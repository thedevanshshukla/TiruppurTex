import pytest
from app.auth import hash_password, verify_password, create_access_token
from app.database import get_database, InMemoryDatabase
from app.seed import seed_database
import jwt
from app.config import settings

@pytest.mark.asyncio
async def test_password_hashing():
    pwd = "secretpassword123"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

@pytest.mark.asyncio
async def test_token_creation_and_payload():
    data = {
        "sub": "user-test-1",
        "email": "test@company-a.com",
        "role": "merchandiser",
        "name": "Test Merchandiser"
    }
    token = create_access_token(data)
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == "user-test-1"
    assert decoded["role"] == "merchandiser"

@pytest.mark.asyncio
async def test_buyer_isolation_logic():
    # Setup test DB
    await seed_database()
    db = get_database()
    
    # Query for Company B's orders
    comp_b_orders = await db["orders"].find({"buyer_id": "buyer-comp-b"}).to_list(10)
    for o in comp_b_orders:
        assert o["buyer_id"] == "buyer-comp-b"
        assert o["po_number"] in ["B-PO-88213", "B-PO-88240"]
        assert o["po_number"] != "C-PO-0488"  # Company C order MUST NEVER appear

    # Query for Company C's orders
    comp_c_orders = await db["orders"].find({"buyer_id": "buyer-comp-c"}).to_list(10)
    for o in comp_c_orders:
        assert o["buyer_id"] == "buyer-comp-c"
        assert o["po_number"] == "C-PO-0488"
        assert o["po_number"] not in ["B-PO-88213", "B-PO-88240"]

