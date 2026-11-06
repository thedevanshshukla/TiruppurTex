import pytest
from datetime import date
from app.services.run_rate import calculate_order_run_rate, count_working_days

def test_working_days_calculation():
    # Thursday Nov 5 to Friday Nov 20: 13 working days (excluding Sundays Nov 8 and Nov 15)
    start = date(2026, 11, 5)
    end = date(2026, 11, 20)
    days = count_working_days(start, end)
    assert days == 13

def test_on_track_order_is_green():
    # Order 1: B-PO-88213 (12000 total, 6800 completed, ex-factory 2026-11-20)
    # 5200 remaining pieces, 12 workdays left = ~433 needed/day
    # Daily logs averaging ~510/day -> easily on track
    logs = [
        {"date": "2026-11-02", "quantity_produced": 520},
        {"date": "2026-11-03", "quantity_produced": 480},
        {"date": "2026-11-04", "quantity_produced": 510},
        {"date": "2026-11-05", "quantity_produced": 530}
    ]
    res = calculate_order_run_rate(
        total_quantity=12000,
        completed_quantity=6800,
        ex_factory_date_input="2026-11-20",
        daily_logs=logs,
        current_date_override="2026-11-05"
    )
    assert res.status == "GREEN"
    assert res.projected_delay_days == 0
    assert not res.air_freight_risk
    assert res.pieces_needed_per_day > 0
    assert res.pieces_made_per_day >= res.pieces_needed_per_day

def test_delayed_order_is_red_with_air_freight_risk():
    # Order 2: B-PO-88240 (8000 total, 5200 completed, ex-factory 2026-11-12)
    # 2800 remaining pieces, with only 5 days left until ex-factory!
    # Floor is only doing ~240/day -> requires ~12 work days -> projected finish Nov 19 -> 7 days delay!
    logs = [
        {"date": "2026-11-03", "quantity_produced": 260},
        {"date": "2026-11-04", "quantity_produced": 240},
        {"date": "2026-11-05", "quantity_produced": 220}
    ]
    res = calculate_order_run_rate(
        total_quantity=8000,
        completed_quantity=5200,
        ex_factory_date_input="2026-11-12",
        daily_logs=logs,
        current_date_override="2026-11-05"
    )
    assert res.status == "RED"
    assert res.projected_delay_days >= 6
    assert res.air_freight_risk is True
    assert res.estimated_financial_loss_inr == 350000.0  # ₹3.5 Lakh air freight penalty

def test_completed_order_is_green():
    res = calculate_order_run_rate(
        total_quantity=5000,
        completed_quantity=5000,
        ex_factory_date_input="2026-11-20",
        daily_logs=[],
        current_date_override="2026-11-05"
    )
    assert res.status == "GREEN"
    assert res.remaining_quantity == 0
    assert res.projected_delay_days == 0

