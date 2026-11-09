import pytest
from app.services.ai_classifier import classify_tamil_note, rule_based_classify

@pytest.mark.asyncio
async def test_tamil_machine_breakdown_classification():
    tamil_note = "தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது"
    result = await classify_tamil_note(tamil_note)
    assert result.ai_category == "Sewing Machine Breakdown"
    assert "machine" in result.english_translation.lower() or "motor" in result.english_translation.lower()
    assert result.confidence_score >= 0.85
    assert result.urgency in ["HIGH", "CRITICAL"]

@pytest.mark.asyncio
async def test_tamil_printing_rejection_classification():
    tamil_note = "பிரிண்டிங் மை கசிவு காரணமாக 350 துணிகள் மறுவேலை செய்ய வேண்டும்"
    result = await classify_tamil_note(tamil_note)
    assert result.ai_category in ["Printing Rejection / Bleed", "Quality Defect / Stitch Rework"]
    assert result.confidence_score >= 0.85

@pytest.mark.asyncio
async def test_tamil_worker_absenteeism_classification():
    tamil_note = "இன்று 5 தையல் தொழிலாளர்கள் வரவில்லை, லைன் மெதுவாக உள்ளது"
    result = await classify_tamil_note(tamil_note)
    assert result.ai_category == "Worker Absenteeism / Labor Shortage"

@pytest.mark.asyncio
async def test_empty_note_fallback():
    result = await classify_tamil_note("")
    assert result.ai_category == "Normal Floor Progress / General Update"
    assert result.confidence_score == 1.0

