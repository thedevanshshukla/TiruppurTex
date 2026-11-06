from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from app.database import get_database
from app.auth import get_current_user, require_merchandiser, require_staff, UserResponse
from app.services.ai_classifier import classify_tamil_note, STANDARD_CATEGORIES, AIClassificationOutput

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ClassifyNoteRequest(BaseModel):
    tamil_note: str

class UpdateIssueRequest(BaseModel):
    merchandiser_override_category: Optional[str] = None
    merchandiser_notes: Optional[str] = None
    merchandiser_approved_for_buyer: Optional[bool] = None
    status: Optional[str] = None  # "VERIFIED" | "DISMISSED" | "PENDING_REVIEW"

@router.get("/categories")
async def get_standard_categories():
    return STANDARD_CATEGORIES

@router.post("/classify-note", response_model=AIClassificationOutput)
async def classify_note(req: ClassifyNoteRequest, current_user: UserResponse = Depends(require_staff)):
    """Translates Tamil note to English and categorizes into standard reason category."""
    return await classify_tamil_note(req.tamil_note)

@router.get("/issues")
async def list_issues(
    status_filter: Optional[str] = Query(None),
    po_number: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_merchandiser)
):
    db = get_database()
    query = {}
    if status_filter:
        query["status"] = status_filter.upper()
    if po_number:
        query["po_number"] = po_number.strip().upper()

    issues = await db["issue_notes"].find(query).to_list(100)
    issues.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return issues

@router.patch("/issues/{issue_id}")
async def update_issue(
    issue_id: str,
    req: UpdateIssueRequest,
    current_user: UserResponse = Depends(require_merchandiser)
):
    db = get_database()
    issue = await db["issue_notes"].find_one({"_id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue note not found")

    update_fields = {}
    if req.merchandiser_override_category is not None:
        update_fields["merchandiser_override_category"] = req.merchandiser_override_category
    if req.merchandiser_notes is not None:
        update_fields["merchandiser_notes"] = req.merchandiser_notes
    if req.merchandiser_approved_for_buyer is not None:
        update_fields["merchandiser_approved_for_buyer"] = req.merchandiser_approved_for_buyer
        if req.merchandiser_approved_for_buyer:
            update_fields["buyer_disclosed_at"] = datetime.now(timezone.utc).isoformat()
    if req.status is not None:
        update_fields["status"] = req.status.upper()

    await db["issue_notes"].update_one({"_id": issue_id}, {"$set": update_fields})
    updated = await db["issue_notes"].find_one({"_id": issue_id})
    return {
        "message": "Issue triage updated successfully",
        "issue": updated
    }

