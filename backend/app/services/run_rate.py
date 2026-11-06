import math
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class RunRateResult(BaseModel):
    total_quantity: int
    completed_quantity: int
    remaining_quantity: int
    working_days_left: int
    pieces_needed_per_day: float
    pieces_made_per_day: float
    projected_completion_date: str
    projected_delay_days: int
    status: str  # "GREEN" | "AMBER" | "RED"
    air_freight_risk: bool
    discount_risk: bool
    estimated_financial_loss_inr: float
    math_explanation: str
    stage_breakdown: Optional[Dict[str, Any]] = None

def parse_date(d: Any) -> date:
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        # YYYY-MM-DD
        return datetime.strptime(d[:10], "%Y-%m-%d").date()
    raise ValueError(f"Cannot parse date: {d}")

def is_working_day(d: date) -> bool:
    # Tiruppur garment units typically work Monday through Saturday (Sunday is off)
    return d.weekday() != 6

def count_working_days(start_date: date, end_date: date) -> int:
    """Counts working days between start_date (exclusive) and end_date (inclusive)."""
    if start_date >= end_date:
        return 0
    count = 0
    cur = start_date + timedelta(days=1)
    while cur <= end_date:
        if is_working_day(cur):
            count += 1
        cur += timedelta(days=1)
    return max(1, count)

def add_working_days(from_date: date, working_days: int) -> date:
    """Adds a number of factory working days to from_date."""
    if working_days <= 0:
        return from_date
    cur = from_date
    added = 0
    while added < working_days:
        cur += timedelta(days=1)
        if is_working_day(cur):
            added += 1
    return cur

def calculate_order_run_rate(
    total_quantity: int,
    completed_quantity: int,
    ex_factory_date_input: Any,
    daily_logs: Optional[List[Dict[str, Any]]] = None,
    current_date_override: Optional[Any] = None,
    buffer_days: int = 2
) -> RunRateResult:
    """
    Core Run-Rate Delay Projection Engine for Knitwear Export Orders.
    Shows the exact math: pieces needed per day vs pieces made per day.
    """
    today = parse_date(current_date_override) if current_date_override else date.today()
    ex_factory = parse_date(ex_factory_date_input)
    
    # 1. Quantities
    remaining_qty = max(0, total_quantity - completed_quantity)
    
    # 2. Time Available (Customs / Carting buffer of buffer_days applied)
    target_date = ex_factory - timedelta(days=buffer_days)
    if target_date < today:
        target_date = ex_factory
    
    working_days_left = count_working_days(today, target_date)
    
    # 3. Pieces Needed per day
    if remaining_qty == 0:
        pieces_needed = 0.0
    else:
        pieces_needed = round(remaining_qty / max(1, working_days_left), 1)
        
    # 4. Pieces Made per day (Current Run Rate)
    # Average of last 3-5 days from daily logs
    recent_outputs = []
    if daily_logs and len(daily_logs) > 0:
        sorted_logs = sorted(
            daily_logs, 
            key=lambda x: parse_date(x.get("date", today)), 
            reverse=True
        )
        for log in sorted_logs[:5]:
            qty = log.get("quantity_produced", 0)
            if qty > 0:
                recent_outputs.append(qty)
                
    if recent_outputs:
        pieces_made = round(sum(recent_outputs) / len(recent_outputs), 1)
    else:
        # If no daily logs yet, estimate from completed quantity vs elapsed time or baseline
        pieces_made = max(1.0, round(pieces_needed * 0.8, 1))
        
    # 5. Projected Completion Date & Delay
    if remaining_qty == 0:
        proj_completion_date = today
        delay_days = 0
    else:
        days_needed = math.ceil(remaining_qty / max(1.0, pieces_made))
        proj_completion_date = add_working_days(today, days_needed)
        # Delay is counted against the contractual ex-factory date
        calendar_delay = (proj_completion_date - ex_factory).days
        delay_days = max(0, calendar_delay)

    # 6. Status Determination (Green / Amber / Red)
    # Thresholds:
    # GREEN: delay_days == 0 and pace ratio >= 0.88
    # AMBER: 1 <= delay_days <= 4 or pace ratio 0.65-0.87
    # RED: delay_days > 4 or pace ratio < 0.65
    pace_ratio = (pieces_made / max(1.0, pieces_needed)) if pieces_needed > 0 else 1.0

    if remaining_qty == 0:
        status = "GREEN"
    elif delay_days == 0 and pace_ratio >= 0.85:
        status = "GREEN"
    elif delay_days <= 4 and pace_ratio >= 0.60:
        status = "AMBER"
    else:
        status = "RED"

    # 7. Financial Risk Flags (Tiruppur Client Metrics)
    # Air freight: ₹3.5 Lakhs extra (delay >= 6 days)
    # 5% Discount penalty: ~₹1.05 Lakhs (delay 2-5 days)
    air_freight_risk = delay_days >= 6
    discount_risk = 2 <= delay_days < 6
    
    financial_loss = 0.0
    if air_freight_risk:
        financial_loss = 350000.0  # ₹3.5 Lakh
    elif discount_risk:
        financial_loss = 105000.0  # ₹1.05 Lakh (5% on ₹21L average order)

    # 8. Math Explanation String for Merchandiser & Buyer Transparency
    math_explanation = (
        f"Needed: {int(pieces_needed)} pcs/day ({remaining_qty:,} remaining ÷ {working_days_left} workdays). "
        f"Floor Output: {int(pieces_made)} pcs/day (last 3-day avg). "
        f"Projected Finish: {proj_completion_date.strftime('%d %b %Y')}. "
    )
    if delay_days > 0:
        math_explanation += f"Projected delay: +{delay_days} days after ex-factory ({ex_factory.strftime('%d %b')}). "
        if air_freight_risk:
            math_explanation += "CRITICAL: Air freight penalty risk (~₹3.5L)."
        elif discount_risk:
            math_explanation += "WARNING: Buyer 5% discount penalty risk (~₹1.05L)."
    else:
        math_explanation += "On track for sea shipment cut-off."

    return RunRateResult(
        total_quantity=total_quantity,
        completed_quantity=completed_quantity,
        remaining_quantity=remaining_qty,
        working_days_left=working_days_left,
        pieces_needed_per_day=pieces_needed,
        pieces_made_per_day=pieces_made,
        projected_completion_date=proj_completion_date.strftime("%Y-%m-%d"),
        projected_delay_days=delay_days,
        status=status,
        air_freight_risk=air_freight_risk,
        discount_risk=discount_risk,
        estimated_financial_loss_inr=financial_loss,
        math_explanation=math_explanation
    )

