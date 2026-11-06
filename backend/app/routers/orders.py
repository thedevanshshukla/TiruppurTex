import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from app.database import get_database
from app.auth import get_current_user, require_merchandiser, UserResponse
from app.services.run_rate import calculate_order_run_rate

router = APIRouter(prefix="/api/orders", tags=["orders"])

class SizeBreakdownItem(BaseModel):
    size: str
    quantity: int

class CreateOrderRequest(BaseModel):
    po_number: str
    buyer_id: str
    style_name: str
    style_code: str
    color: str
    total_quantity: int
    size_breakdown: List[SizeBreakdownItem]
    unit_id: str
    ex_factory_date: str
    current_stage: str = "Fabric Sourcing & Dyeing"

class UpdateDateRequest(BaseModel):
    milestone_name: str = "Ex-Factory Handover"
    field_changed: str = "ex_factory_date"
    new_date: str
    reason: str

@router.get("")
async def list_orders(
    buyer_id: Optional[str] = Query(None),
    unit_id: Optional[str] = Query(None),
    ship_week: Optional[str] = Query(None),
    health_status: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    query: Dict[str, Any] = {}

    # Strict multi-tenant buyer isolation: If user is a buyer, enforce their own buyer_id!
    if current_user.role == "buyer":
        if not current_user.buyer_id:
            raise HTTPException(status_code=403, detail="Buyer profile missing tenant ID")
        query["buyer_id"] = current_user.buyer_id
    elif buyer_id:
        query["buyer_id"] = buyer_id

    if unit_id:
        query["unit_id"] = unit_id
    if ship_week:
        query["ship_week"] = ship_week
    if health_status:
        query["health_status"] = health_status.upper()

    orders_cursor = db["orders"].find(query)
    orders = await orders_cursor.to_list(100)

    # Attach fresh run-rate calculations dynamically
    for o in orders:
        order_id = str(o["_id"])
        logs_cursor = db["daily_production_logs"].find({"order_id": order_id})
        logs = await logs_cursor.to_list(20)
        calc = calculate_order_run_rate(
            total_quantity=o.get("total_quantity", 0),
            completed_quantity=o.get("completed_quantity", 0),
            ex_factory_date_input=o.get("ex_factory_date"),
            daily_logs=logs,
            current_date_override="2026-11-05"  # baseline for sample data consistency
        )
        o["run_rate_projection"] = calc.model_dump()
        o["health_status"] = calc.status

    return orders

@router.get("/{order_id}")
async def get_order_detail(
    order_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    order = await db["orders"].find_one({"_id": order_id})
    if not order:
        order = await db["orders"].find_one({"po_number": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    # Strict Buyer Tenant Isolation:
    if current_user.role == "buyer" and order.get("buyer_id") != current_user.buyer_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot view another buyer's order")

    real_id = str(order["_id"])

    # Milestones
    milestones = await db["tna_milestones"].find({"order_id": real_id}).to_list(50)
    milestones.sort(key=lambda m: m.get("order_index", 0))

    # Daily Production Logs
    logs = await db["daily_production_logs"].find({"order_id": real_id}).to_list(50)
    logs.sort(key=lambda l: l.get("date", ""), reverse=True)

    # Issue Notes (If buyer, show ONLY merchandiser approved notes!)
    issue_query = {"order_id": real_id}
    if current_user.role == "buyer":
        issue_query["merchandiser_approved_for_buyer"] = True
    issues = await db["issue_notes"].find(issue_query).to_list(50)
    issues.sort(key=lambda i: i.get("created_at", ""), reverse=True)

    # Audit Logs
    audit_logs = await db["date_change_audit_logs"].find({"order_id": real_id}).to_list(50)
    audit_logs.sort(key=lambda a: a.get("created_at", ""), reverse=True)

    # Recalculate run-rate
    calc = calculate_order_run_rate(
        total_quantity=order.get("total_quantity", 0),
        completed_quantity=order.get("completed_quantity", 0),
        ex_factory_date_input=order.get("ex_factory_date"),
        daily_logs=logs,
        current_date_override="2026-11-05"
    )

    return {
        "order": order,
        "milestones": milestones,
        "daily_logs": logs,
        "issues": issues,
        "audit_logs": audit_logs,
        "run_rate_projection": calc.model_dump()
    }

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    req: CreateOrderRequest,
    current_user: UserResponse = Depends(require_merchandiser)
):
    db = get_database()
    
    # Check duplicate PO
    existing = await db["orders"].find_one({"po_number": req.po_number.strip()})
    if existing:
        raise HTTPException(status_code=400, detail=f"PO number '{req.po_number}' already exists")

    # Fetch buyer name
    buyer = await db["buyers"].find_one({"_id": req.buyer_id})
    buyer_name = buyer.get("name", "Unknown Buyer") if buyer else "Unknown Buyer"

    # Fetch unit name
    unit = await db["units"].find_one({"_id": req.unit_id})
    unit_name = unit.get("name", "Unknown Unit") if unit else "Unknown Unit"

    # Compute ship week (e.g. 2026-W47)
    ex_date = date.fromisoformat(req.ex_factory_date)
    year, week, _ = ex_date.isocalendar()
    ship_week = f"{year}-W{week:02d}"

    order_id = f"order-{uuid.uuid4().hex[:8]}"

    # Initial Run-Rate
    calc = calculate_order_run_rate(
        total_quantity=req.total_quantity,
        completed_quantity=0,
        ex_factory_date_input=req.ex_factory_date,
        daily_logs=[],
        current_date_override="2026-11-05"
    )

    order_doc = {
        "_id": order_id,
        "po_number": req.po_number.strip().upper(),
        "buyer_id": req.buyer_id,
        "buyer_name": buyer_name,
        "style_name": req.style_name,
        "style_code": req.style_code,
        "color": req.color,
        "total_quantity": req.total_quantity,
        "size_breakdown": [item.model_dump() for item in req.size_breakdown],
        "unit_id": req.unit_id,
        "unit_name": unit_name,
        "current_stage": req.current_stage,
        "completed_quantity": 0,
        "defect_quantity": 0,
        "ex_factory_date": req.ex_factory_date,
        "original_ex_factory_date": req.ex_factory_date,
        "ship_week": ship_week,
        "health_status": calc.status,
        "run_rate_projection": calc.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["orders"].insert_one(order_doc)

    # Generate TNA Milestones from standard knitwear template
    stages = [
        ("Fabric Sourcing & Dyeing", 28, 20),
        ("Cutting", 20, 16),
        ("Printing / Embroidery", 16, 12),
        ("Stitching", 12, 5),
        ("Washing", 5, 3),
        ("Finishing & Ironing", 3, 1),
        ("Final Inspection & Packing", 1, 0),
    ]
    for idx, (s_name, start_off, end_off) in enumerate(stages):
        s_date = ex_date - timedelta(days=start_off)
        e_date = ex_date - timedelta(days=end_off)
        m_status = "IN_PROGRESS" if idx == 0 else "PENDING"
        await db["tna_milestones"].insert_one({
            "_id": f"milestone-{order_id}-{idx}",
            "order_id": order_id,
            "stage_name": s_name,
            "order_index": idx,
            "planned_start_date": s_date.isoformat(),
            "planned_end_date": e_date.isoformat(),
            "actual_start_date": s_date.isoformat() if idx == 0 else None,
            "actual_end_date": None,
            "status": m_status
        })

    return {"message": "Order created successfully", "order_id": order_id, "po_number": req.po_number}

@router.patch("/{order_id}/date")
async def update_order_date(
    order_id: str,
    req: UpdateDateRequest,
    current_user: UserResponse = Depends(require_merchandiser)
):
    db = get_database()
    order = await db["orders"].find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_date = order.get(req.field_changed, order.get("ex_factory_date", ""))
    
    # Update date on order
    update_data = {req.field_changed: req.new_date}
    if req.field_changed == "ex_factory_date":
        new_d = date.fromisoformat(req.new_date)
        y, w, _ = new_d.isocalendar()
        update_data["ship_week"] = f"{y}-W{w:02d}"

    await db["orders"].update_one({"_id": order_id}, {"$set": update_data})

    # Record Date Change Audit Log for Compliance
    audit_id = f"audit-{uuid.uuid4().hex[:8]}"
    audit_entry = {
        "_id": audit_id,
        "order_id": order_id,
        "po_number": order.get("po_number", ""),
        "milestone_name": req.milestone_name,
        "field_changed": req.field_changed,
        "old_date": old_date,
        "new_date": req.new_date,
        "changed_by_user_id": current_user.id,
        "changed_by_name": current_user.name,
        "reason": req.reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["date_change_audit_logs"].insert_one(audit_entry)

    # Recalculate run-rate
    logs = await db["daily_production_logs"].find({"order_id": order_id}).to_list(50)
    calc = calculate_order_run_rate(
        total_quantity=order.get("total_quantity", 0),
        completed_quantity=order.get("completed_quantity", 0),
        ex_factory_date_input=req.new_date,
        daily_logs=logs,
        current_date_override="2026-11-05"
    )
    await db["orders"].update_one(
        {"_id": order_id},
        {"$set": {"health_status": calc.status, "run_rate_projection": calc.model_dump()}}
    )

    return {
        "message": "Date updated and recorded in compliance audit log",
        "audit_entry": audit_entry,
        "new_status": calc.status
    }

