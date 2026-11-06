from fastapi import APIRouter, Depends
from app.database import get_database
from app.auth import get_current_user, UserResponse

router = APIRouter(prefix="/api/meta", tags=["meta"])

KNITWEAR_STAGES = [
    "Fabric Sourcing & Dyeing",
    "Cutting",
    "Printing / Embroidery",
    "Stitching",
    "Washing",
    "Finishing & Ironing",
    "Final Inspection & Packing",
    "Ex-Factory Handover"
]

@router.get("/stages")
async def get_stages():
    return KNITWEAR_STAGES

@router.get("/buyers")
async def get_buyers():
    db = get_database()
    buyers = await db["buyers"].find({}).to_list(20)
    return buyers

@router.get("/units")
async def get_units():
    db = get_database()
    units = await db["units"].find({}).to_list(20)
    return units

