import asyncio
from datetime import date, timedelta
from app.database import get_database
from app.auth import hash_password
from app.services.run_rate import calculate_order_run_rate

async def seed_database():
    db = get_database()
    
    # Check if already seeded
    user_count = await db["users"].count_documents({})
    if user_count > 0:
        return

    print("Seeding database with Tiruppur client sample data...")

    # 1. Units
    units = [
        {"_id": "unit-1", "name": "Unit 1 - Main Fabric & Cut", "type": "OWN", "location": "Tiruppur West"},
        {"_id": "unit-2", "name": "Unit 2 - Stitching Hub", "type": "OWN", "location": "Kangeyam Road"},
        {"_id": "unit-3", "name": "Unit 3 - Finishing & Packing", "type": "OWN", "location": "Netaji Apparel Park"},
        {"_id": "unit-sub-print", "name": "Subcontractor - Tiruppur Screen Prints", "type": "SUBCONTRACTOR", "location": "Palladam Road"},
        {"_id": "unit-sub-wash", "name": "Subcontractor - Avinashi Washing Co.", "type": "SUBCONTRACTOR", "location": "Avinashi"}
    ]
    for u in units:
        await db["units"].insert_one(u)

    # 2. Buyers
    buyers = [
        {"_id": "buyer-comp-b", "name": "Company B (UK)", "code": "COMP-B", "country": "United Kingdom", "contact_email": "sourcing@company-b.co.uk"},
        {"_id": "buyer-comp-c", "name": "Company C (Germany)", "code": "COMP-C", "country": "Germany", "contact_email": "import@company-c.de"}
    ]
    for b in buyers:
        await db["buyers"].insert_one(b)

    # 3. Users (Reviewer Demo Credentials)
    pwd_hash = hash_password("admin123")
    users = [
        {
            "_id": "user-merch-1",
            "email": "merchandiser@company-a.com",
            "password_hash": pwd_hash,
            "name": "Karthik Subramanian (Lead Merchandiser)",
            "role": "merchandiser",
            "buyer_id": None,
            "unit_id": None,
            "language_preference": "en"
        },
        {
            "_id": "user-sup-1",
            "email": "supervisor@company-a.com",
            "password_hash": pwd_hash,
            "name": "Muthu Vel (Floor Supervisor)",
            "role": "supervisor",
            "buyer_id": None,
            "unit_id": "unit-2",
            "language_preference": "ta"
        },
        {
            "_id": "user-buyer-b",
            "email": "buyer.uk@company-b.co.uk",
            "password_hash": pwd_hash,
            "name": "Sarah Jenkins (UK Sourcing)",
            "role": "buyer",
            "buyer_id": "buyer-comp-b",
            "unit_id": None,
            "language_preference": "en"
        },
        {
            "_id": "user-buyer-c",
            "email": "buyer.de@company-c.de",
            "password_hash": pwd_hash,
            "name": "Hans Müller (Germany Sourcing)",
            "role": "buyer",
            "buyer_id": "buyer-comp-c",
            "unit_id": None,
            "language_preference": "en"
        }
    ]
    for u in users:
        await db["users"].insert_one(u)

    # Standard TNA Milestone Templates
    def generate_milestones(order_id: str, ex_factory: str, current_stage: str):
        ex_date = date.fromisoformat(ex_factory)
        stages = [
            ("Fabric Sourcing & Dyeing", 28, 20),
            ("Cutting", 20, 16),
            ("Printing / Embroidery", 16, 12),
            ("Stitching", 12, 5),
            ("Washing", 5, 3),
            ("Finishing & Ironing", 3, 1),
            ("Final Inspection & Packing", 1, 0),
        ]
        milestones = []
        for idx, (s_name, start_offset, end_offset) in enumerate(stages):
            s_date = ex_date - timedelta(days=start_offset)
            e_date = ex_date - timedelta(days=end_offset)
            
            # Determine status based on current stage
            m_status = "PENDING"
            if s_name == current_stage:
                m_status = "IN_PROGRESS"
            else:
                stage_names = [st[0] for st in stages]
                if stage_names.index(s_name) < stage_names.index(current_stage):
                    m_status = "COMPLETED"
                    
            milestones.append({
                "_id": f"milestone-{order_id}-{idx}",
                "order_id": order_id,
                "stage_name": s_name,
                "order_index": idx,
                "planned_start_date": s_date.isoformat(),
                "planned_end_date": e_date.isoformat(),
                "actual_start_date": s_date.isoformat() if m_status != "PENDING" else None,
                "actual_end_date": e_date.isoformat() if m_status == "COMPLETED" else None,
                "status": m_status
            })
        return milestones

    # 4. Sample Orders from Brief
    # Order 1: B-PO-88213 (Company B, 12000, 2026-11-20, Stitching, 6800 done) -> GREEN
    order_1_id = "order-b-88213"
    order_1_logs = [
        {"_id": "log-1", "order_id": order_1_id, "po_number": "B-PO-88213", "stage_name": "Stitching", "date": "2026-11-02", "quantity_produced": 520, "defect_count": 8, "supervisor_name": "Muthu Vel"},
        {"_id": "log-2", "order_id": order_1_id, "po_number": "B-PO-88213", "stage_name": "Stitching", "date": "2026-11-03", "quantity_produced": 480, "defect_count": 6, "supervisor_name": "Muthu Vel"},
        {"_id": "log-3", "order_id": order_1_id, "po_number": "B-PO-88213", "stage_name": "Stitching", "date": "2026-11-04", "quantity_produced": 510, "defect_count": 10, "supervisor_name": "Muthu Vel"},
        {"_id": "log-4", "order_id": order_1_id, "po_number": "B-PO-88213", "stage_name": "Stitching", "date": "2026-11-05", "quantity_produced": 530, "defect_count": 5, "supervisor_name": "Muthu Vel"}
    ]
    for l in order_1_logs:
        await db["daily_production_logs"].insert_one(l)
        
    calc_1 = calculate_order_run_rate(
        total_quantity=12000,
        completed_quantity=6800,
        ex_factory_date_input="2026-11-20",
        daily_logs=order_1_logs,
        current_date_override="2026-11-05"
    )

    await db["orders"].insert_one({
        "_id": order_1_id,
        "po_number": "B-PO-88213",
        "buyer_id": "buyer-comp-b",
        "buyer_name": "Company B (UK)",
        "style_name": "Men's crew neck tee, navy",
        "style_code": "TSH-88213",
        "color": "Navy",
        "total_quantity": 12000,
        "size_breakdown": [
            {"size": "S", "quantity": 2400},
            {"size": "M", "quantity": 4800},
            {"size": "L", "quantity": 3600},
            {"size": "XL", "quantity": 1200}
        ],
        "unit_id": "unit-2",
        "unit_name": "Unit 2 - Stitching Hub",
        "current_stage": "Stitching",
        "completed_quantity": 6800,
        "defect_quantity": 29,
        "ex_factory_date": "2026-11-20",
        "original_ex_factory_date": "2026-11-20",
        "ship_week": "2026-W47",
        "health_status": calc_1.status,
        "run_rate_projection": calc_1.model_dump(),
        "created_at": "2026-10-15T10:00:00Z"
    })
    for m in generate_milestones(order_1_id, "2026-11-20", "Stitching"):
        await db["tna_milestones"].insert_one(m)

    # Order 2: B-PO-88240 (Company B, 8000, 2026-11-12, Finishing, 5200 done) -> RED
    order_2_id = "order-b-88240"
    order_2_logs = [
        {"_id": "log-20", "order_id": order_2_id, "po_number": "B-PO-88240", "stage_name": "Finishing & Ironing", "date": "2026-11-03", "quantity_produced": 260, "defect_count": 14, "supervisor_name": "Ravi Kumar"},
        {"_id": "log-21", "order_id": order_2_id, "po_number": "B-PO-88240", "stage_name": "Finishing & Ironing", "date": "2026-11-04", "quantity_produced": 240, "defect_count": 18, "supervisor_name": "Ravi Kumar"},
        {"_id": "log-22", "order_id": order_2_id, "po_number": "B-PO-88240", "stage_name": "Finishing & Ironing", "date": "2026-11-05", "quantity_produced": 220, "defect_count": 22, "supervisor_name": "Ravi Kumar"}
    ]
    for l in order_2_logs:
        await db["daily_production_logs"].insert_one(l)

    calc_2 = calculate_order_run_rate(
        total_quantity=8000,
        completed_quantity=5200,
        ex_factory_date_input="2026-11-12",
        daily_logs=order_2_logs,
        current_date_override="2026-11-05"
    )

    await db["orders"].insert_one({
        "_id": order_2_id,
        "po_number": "B-PO-88240",
        "buyer_id": "buyer-comp-b",
        "buyer_name": "Company B (UK)",
        "style_name": "Men's polo, white",
        "style_code": "POLO-88240",
        "color": "White",
        "total_quantity": 8000,
        "size_breakdown": [
            {"size": "S", "quantity": 1600},
            {"size": "M", "quantity": 3200},
            {"size": "L", "quantity": 2400},
            {"size": "XL", "quantity": 800}
        ],
        "unit_id": "unit-3",
        "unit_name": "Unit 3 - Finishing & Packing",
        "current_stage": "Finishing & Ironing",
        "completed_quantity": 5200,
        "defect_quantity": 54,
        "ex_factory_date": "2026-11-12",
        "original_ex_factory_date": "2026-11-12",
        "ship_week": "2026-W46",
        "health_status": "RED",
        "run_rate_projection": calc_2.model_dump(),
        "created_at": "2026-10-18T09:30:00Z"
    })
    for m in generate_milestones(order_2_id, "2026-11-12", "Finishing & Ironing"):
        await db["tna_milestones"].insert_one(m)

    # Seed AI Issue Note for Order 2 (Tamil Floor Note)
    await db["issue_notes"].insert_one({
        "_id": "issue-note-201",
        "order_id": order_2_id,
        "po_number": "B-PO-88240",
        "supervisor_id": "user-sup-1",
        "supervisor_name": "Muthu Vel",
        "stage_name": "Finishing & Ironing",
        "original_note_tamil": "தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது",
        "is_voice": False,
        "english_translation": "Stitching machine motor broke down, work halted for 3 hours.",
        "ai_category": "Sewing Machine Breakdown",
        "confidence_score": 0.94,
        "merchandiser_override_category": None,
        "merchandiser_approved_for_buyer": True,  # Approved by merchandiser so buyer can see early notice
        "buyer_disclosed_at": "2026-11-05T14:20:00Z",
        "status": "VERIFIED",
        "created_at": "2026-11-05T11:15:00Z"
    })

    # Order 3: C-PO-0488 (Company C, 10000, 2026-11-28, Printing, 3100 done) -> AMBER
    order_3_id = "order-c-0488"
    order_3_logs = [
        {"_id": "log-30", "order_id": order_3_id, "po_number": "C-PO-0488", "stage_name": "Printing / Embroidery", "date": "2026-11-03", "quantity_produced": 420, "defect_count": 28, "supervisor_name": "Selvam"},
        {"_id": "log-31", "order_id": order_3_id, "po_number": "C-PO-0488", "stage_name": "Printing / Embroidery", "date": "2026-11-04", "quantity_produced": 400, "defect_count": 32, "supervisor_name": "Selvam"},
        {"_id": "log-32", "order_id": order_3_id, "po_number": "C-PO-0488", "stage_name": "Printing / Embroidery", "date": "2026-11-05", "quantity_produced": 390, "defect_count": 25, "supervisor_name": "Selvam"}
    ]
    for l in order_3_logs:
        await db["daily_production_logs"].insert_one(l)

    calc_3 = calculate_order_run_rate(
        total_quantity=10000,
        completed_quantity=3100,
        ex_factory_date_input="2026-11-28",
        daily_logs=order_3_logs,
        current_date_override="2026-11-05"
    )

    await db["orders"].insert_one({
        "_id": order_3_id,
        "po_number": "C-PO-0488",
        "buyer_id": "buyer-comp-c",
        "buyer_name": "Company C (Germany)",
        "style_name": "Kids printed tee, yellow",
        "style_code": "KID-0488",
        "color": "Yellow",
        "total_quantity": 10000,
        "size_breakdown": [
            {"size": "2-3Y", "quantity": 2500},
            {"size": "4-5Y", "quantity": 3500},
            {"size": "6-7Y", "quantity": 2500},
            {"size": "8-9Y", "quantity": 1500}
        ],
        "unit_id": "unit-sub-print",
        "unit_name": "Subcontractor - Tiruppur Screen Prints",
        "current_stage": "Printing / Embroidery",
        "completed_quantity": 3100,
        "defect_quantity": 85,
        "ex_factory_date": "2026-11-28",
        "original_ex_factory_date": "2026-11-25",
        "ship_week": "2026-W48",
        "health_status": "AMBER",
        "run_rate_projection": calc_3.model_dump(),
        "created_at": "2026-10-20T11:00:00Z"
    })
    for m in generate_milestones(order_3_id, "2026-11-28", "Printing / Embroidery"):
        await db["tna_milestones"].insert_one(m)

    # Seed AI Issue Note for Order 3 (Pending merchandiser review)
    await db["issue_notes"].insert_one({
        "_id": "issue-note-301",
        "order_id": order_3_id,
        "po_number": "C-PO-0488",
        "supervisor_id": "user-sup-1",
        "supervisor_name": "Muthu Vel",
        "stage_name": "Printing / Embroidery",
        "original_note_tamil": "பிரிண்டிங் மை கசிவு காரணமாக 350 துணிகள் மறுவேலை செய்ய வேண்டும்",
        "is_voice": False,
        "english_translation": "Screen printing quality rejection or ink bleed detected during chest print. 350 pieces need rework.",
        "ai_category": "Printing Rejection / Bleed",
        "confidence_score": 0.92,
        "merchandiser_override_category": None,
        "merchandiser_approved_for_buyer": False,  # Not approved yet! Buyer will NOT see it until confirmed.
        "buyer_disclosed_at": None,
        "status": "PENDING_REVIEW",
        "created_at": "2026-11-05T15:45:00Z"
    })

    # Seed Date Change Audit Log for Order 3 (Compliance history requirement)
    await db["date_change_audit_logs"].insert_one({
        "_id": "audit-301",
        "order_id": order_3_id,
        "po_number": "C-PO-0488",
        "milestone_name": "Ex-Factory Handover",
        "field_changed": "ex_factory_date",
        "old_date": "2026-11-25",
        "new_date": "2026-11-28",
        "changed_by_user_id": "user-merch-1",
        "changed_by_name": "Karthik Subramanian (Lead Merchandiser)",
        "reason": "Subcontractor printing screen realignment requested 3-day extension approved by buyer agent.",
        "created_at": "2026-10-30T16:00:00Z"
    })

    print("Database successfully seeded with realistic sample data!")

