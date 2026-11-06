from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.database import get_database
from app.auth import get_current_user, require_buyer, UserResponse
from app.services.run_rate import calculate_order_run_rate

router = APIRouter(prefix="/api/buyer", tags=["buyer"])

@router.get("/orders")
async def get_buyer_orders(current_user: UserResponse = Depends(require_buyer)):
    """
    Strictly isolated Buyer view.
    A buyer can ONLY see orders where buyer_id matches their assigned account.
    """
    if not current_user.buyer_id:
        raise HTTPException(status_code=403, detail="No buyer tenant associated with this account")

    db = get_database()
    buyer_orders = await db["orders"].find({"buyer_id": current_user.buyer_id}).to_list(50)

    # Decorate with approved milestones, approved photos, and approved warnings
    results = []
    for order in buyer_orders:
        order_id = str(order["_id"])
        
        # Milestones
        milestones = await db["tna_milestones"].find({"order_id": order_id}).to_list(20)
        milestones.sort(key=lambda m: m.get("order_index", 0))

        # Recent photos from daily logs (good production proof for buyers)
        logs = await db["daily_production_logs"].find({"order_id": order_id}).to_list(20)
        verified_photos = [
            {
                "photo_url": l["photo_url"],
                "stage": l.get("stage_name"),
                "date": l.get("date"),
                "caption": f"Stage {l.get('stage_name')} inspection proof"
            }
            for l in logs if l.get("photo_url")
        ]

        # Approved delay warnings only! (Buyer must NOT see raw internal notes)
        approved_issues = await db["issue_notes"].find({
            "order_id": order_id,
            "merchandiser_approved_for_buyer": True
        }).to_list(20)

        # Recalculate run-rate
        calc = calculate_order_run_rate(
            total_quantity=order.get("total_quantity", 0),
            completed_quantity=order.get("completed_quantity", 0),
            ex_factory_date_input=order.get("ex_factory_date"),
            daily_logs=logs,
            current_date_override="2026-11-05"
        )

        results.append({
            "order_id": order_id,
            "po_number": order.get("po_number"),
            "buyer_name": order.get("buyer_name"),
            "style_name": order.get("style_name"),
            "style_code": order.get("style_code"),
            "color": order.get("color"),
            "total_quantity": order.get("total_quantity"),
            "completed_quantity": order.get("completed_quantity"),
            "current_stage": order.get("current_stage"),
            "ex_factory_date": order.get("ex_factory_date"),
            "health_status": calc.status,
            "completion_percentage": round((order.get("completed_quantity", 0) / max(1, order.get("total_quantity", 1))) * 100, 1),
            "milestones": milestones,
            "verified_photos": verified_photos,
            "approved_notices": [
                {
                    "stage": i.get("stage_name"),
                    "notice": i.get("english_translation"),
                    "category": i.get("merchandiser_override_category") or i.get("ai_category"),
                    "disclosed_at": i.get("buyer_disclosed_at")
                }
                for i in approved_issues
            ],
            "run_rate": {
                "pieces_made_per_day": calc.pieces_made_per_day,
                "projected_completion_date": calc.projected_completion_date,
                "status": calc.status,
                "summary": "On Track" if calc.status == "GREEN" else f"Notice: Estimated {calc.projected_delay_days} days variance under review with factory"
            }
        })

    return results

@router.get("/weekly-export")
async def get_weekly_status_export(current_user: UserResponse = Depends(get_current_user)):
    """
    Weekly Status Export per buyer (PDF/Excel data feed).
    Can be accessed by buyer (for their own data) or merchandiser (for any buyer).
    """
    db = get_database()
    buyer_id = current_user.buyer_id if current_user.role == "buyer" else None
    query = {"buyer_id": buyer_id} if buyer_id else {}

    orders = await db["orders"].find(query).to_list(100)
    export_rows = []

    for o in orders:
        order_id = str(o["_id"])
        logs = await db["daily_production_logs"].find({"order_id": order_id}).to_list(20)
        calc = calculate_order_run_rate(
            total_quantity=o.get("total_quantity", 0),
            completed_quantity=o.get("completed_quantity", 0),
            ex_factory_date_input=o.get("ex_factory_date"),
            daily_logs=logs,
            current_date_override="2026-11-05"
        )

        pct = round((o.get("completed_quantity", 0) / max(1, o.get("total_quantity", 1))) * 100, 1)

        export_rows.append({
            "PO Number": o.get("po_number"),
            "Buyer": o.get("buyer_name"),
            "Style": o.get("style_name"),
            "Color": o.get("color"),
            "Total Qty": o.get("total_quantity"),
            "Current Stage": o.get("current_stage"),
            "Qty Done": o.get("completed_quantity"),
            "Progress": f"{pct}%",
            "Ex-Factory Date": o.get("ex_factory_date"),
            "Ship Week": o.get("ship_week", ""),
            "Status": calc.status,
            "Daily Run Rate": f"{int(calc.pieces_made_per_day)} pcs/day",
            "Projected Finish": calc.projected_completion_date,
            "Delay (Days)": calc.projected_delay_days,
            "Unit": o.get("unit_name", "")
        })

    return {
        "report_title": f"Tiruppur Knitwear Weekly Production Status Report",
        "generated_at": "2026-11-06",
        "total_orders": len(export_rows),
        "data": export_rows
    }

