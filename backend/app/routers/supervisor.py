import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.database import get_database
from app.auth import get_current_user, require_staff, UserResponse
from app.services.run_rate import calculate_order_run_rate
from app.services.ai_classifier import classify_tamil_note

router = APIRouter(prefix="/api/supervisor", tags=["supervisor"])

class DailyLogSubmission(BaseModel):
    order_id: str
    stage_name: str
    quantity_produced: int = Field(ge=0, description="Good pieces finished today")
    defect_count: int = Field(default=0, ge=0, description="Defective pieces quarantined")
    photo_url: Optional[str] = None
    audio_url: Optional[str] = None
    issue_note_tamil: Optional[str] = None
    is_voice: bool = False
    date_override: Optional[str] = None

@router.get("/assigned-orders")
async def get_supervisor_orders(current_user: UserResponse = Depends(require_staff)):
    db = get_database()
    query = {}
    if current_user.role == "supervisor" and current_user.unit_id:
        query["unit_id"] = current_user.unit_id
    
    orders = await db["orders"].find(query).to_list(50)
    return orders

@router.post("/daily-log")
async def submit_daily_floor_log(
    req: DailyLogSubmission,
    current_user: UserResponse = Depends(require_staff)
):
    db = get_database()
    order = await db["orders"].find_one({"_id": req.order_id})
    if not order:
        order = await db["orders"].find_one({"po_number": req.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    order_id = str(order["_id"])
    po_number = order.get("po_number", "")
    today_str = req.date_override or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Create Daily Production Log Record
    log_id = f"log-{uuid.uuid4().hex[:8]}"
    log_entry = {
        "_id": log_id,
        "order_id": order_id,
        "po_number": po_number,
        "stage_name": req.stage_name,
        "unit_id": order.get("unit_id", ""),
        "date": today_str,
        "quantity_produced": req.quantity_produced,
        "defect_count": req.defect_count,
        "photo_url": req.photo_url,
        "audio_url": req.audio_url,
        "is_voice": req.is_voice,
        "supervisor_id": current_user.id,
        "supervisor_name": current_user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["daily_production_logs"].insert_one(log_entry)

    # 2. Update Order Completed Quantity and Current Stage
    new_completed = order.get("completed_quantity", 0) + req.quantity_produced
    new_defects = order.get("defect_quantity", 0) + req.defect_count
    await db["orders"].update_one(
        {"_id": order_id},
        {"$set": {
            "completed_quantity": new_completed,
            "defect_quantity": new_defects,
            "current_stage": req.stage_name
        }}
    )

    # 3. Process AI Tamil Note if provided
    ai_result_data = None
    if req.issue_note_tamil and req.issue_note_tamil.strip():
        tamil_text = req.issue_note_tamil.strip()
        ai_classification = await classify_tamil_note(tamil_text)
        
        issue_id = f"issue-{uuid.uuid4().hex[:8]}"
        issue_doc = {
            "_id": issue_id,
            "order_id": order_id,
            "po_number": po_number,
            "supervisor_id": current_user.id,
            "supervisor_name": current_user.name,
            "stage_name": req.stage_name,
            "original_note_tamil": tamil_text,
            "is_voice": req.is_voice,
            "audio_url": req.audio_url,
            "english_translation": ai_classification.english_translation,
            "ai_category": ai_classification.ai_category,
            "confidence_score": ai_classification.confidence_score,
            "urgency": ai_classification.urgency,
            "recommended_action": ai_classification.recommended_action,
            "merchandiser_override_category": None,
            "merchandiser_notes": None,
            "merchandiser_approved_for_buyer": False,  # Strict safeguard: Merchandiser must approve before buyer sees!
            "buyer_disclosed_at": None,
            "status": "PENDING_REVIEW",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db["issue_notes"].insert_one(issue_doc)
        ai_result_data = issue_doc

    # 4. Recalculate Run-Rate with updated logs
    all_logs = await db["daily_production_logs"].find({"order_id": order_id}).to_list(50)
    calc = calculate_order_run_rate(
        total_quantity=order.get("total_quantity", 0),
        completed_quantity=new_completed,
        ex_factory_date_input=order.get("ex_factory_date"),
        daily_logs=all_logs,
        current_date_override="2026-11-05"
    )

    await db["orders"].update_one(
        {"_id": order_id},
        {"$set": {
            "health_status": calc.status,
            "run_rate_projection": calc.model_dump()
        }}
    )

    return {
        "message": "Floor update recorded successfully",
        "log_id": log_id,
        "order_id": order_id,
        "completed_quantity": new_completed,
        "new_health_status": calc.status,
        "run_rate": calc.model_dump(),
        "ai_issue": ai_result_data
    }

