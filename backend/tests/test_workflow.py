import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db
from app.seed import seed_database

@pytest.mark.asyncio
async def test_full_workflow_api():
    await init_db()
    await seed_database()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login as Merchandiser
        login_res = await client.post("/api/auth/login", json={
            "email": "merchandiser@company-a.com",
            "password": "admin123"
        })
        assert login_res.status_code == 200
        merch_token = login_res.json()["access_token"]
        merch_headers = {"Authorization": f"Bearer {merch_token}"}

        # 2. Fetch Orders on Board
        orders_res = await client.get("/api/orders", headers=merch_headers)
        assert orders_res.status_code == 200
        orders = orders_res.json()
        assert len(orders) >= 3

        # Check PO numbers from brief
        po_nums = [o["po_number"] for o in orders]
        assert "B-PO-88213" in po_nums
        assert "B-PO-88240" in po_nums
        assert "C-PO-0488" in po_nums

        # 3. Supervisor Floor Update
        sup_login = await client.post("/api/auth/login", json={
            "email": "supervisor@company-a.com",
            "password": "admin123"
        })
        assert sup_login.status_code == 200
        sup_token = sup_login.json()["access_token"]
        sup_headers = {"Authorization": f"Bearer {sup_token}"}

        sup_update = await client.post("/api/supervisor/daily-log", headers=sup_headers, json={
            "order_id": "order-b-88213",
            "stage_name": "Stitching",
            "quantity_produced": 450,
            "defect_count": 5,
            "issue_note_tamil": "ஊசி பழுது காரணமாக 30 நிமிடம் தாமதம்"
        })
        assert sup_update.status_code == 200
        sup_data = sup_update.json()
        assert sup_data["completed_quantity"] == 6800 + 450
        assert sup_data["ai_issue"] is not None
        assert sup_data["ai_issue"]["merchandiser_approved_for_buyer"] is False  # Safe! Not visible to buyer yet.

        # 4. Strict Buyer Multi-Tenant Isolation
        # Login as UK Buyer (Company B)
        uk_buyer_login = await client.post("/api/auth/login", json={
            "email": "buyer.uk@company-b.co.uk",
            "password": "admin123"
        })
        uk_token = uk_buyer_login.json()["access_token"]
        uk_headers = {"Authorization": f"Bearer {uk_token}"}

        buyer_orders_res = await client.get("/api/buyer/orders", headers=uk_headers)
        assert buyer_orders_res.status_code == 200
        uk_orders = buyer_orders_res.json()
        assert len(uk_orders) == 2
        for o in uk_orders:
            assert "Company B" in o["buyer_name"]
            assert o["po_number"] != "C-PO-0488"  # Germany order MUST NEVER be leaked!

        # Try to access Germany order directly as UK Buyer -> Must be 403 Forbidden!
        forbidden_res = await client.get("/api/orders/order-c-0488", headers=uk_headers)
        assert forbidden_res.status_code == 403

        # 5. Merchandiser Date Change & Compliance Audit Log
        date_change_res = await client.patch("/api/orders/order-b-88213/date", headers=merch_headers, json={
            "milestone_name": "Ex-Factory Handover",
            "field_changed": "ex_factory_date",
            "new_date": "2026-11-23",
            "reason": "Vessel sailing cut-off moved by freight forwarder Evergreen"
        })
        assert date_change_res.status_code == 200
        assert date_change_res.json()["audit_entry"]["reason"] == "Vessel sailing cut-off moved by freight forwarder Evergreen"

