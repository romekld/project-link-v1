"""P3-02: Consultation model creates with hybrid vitals.

Real tests will verify:
- Consultation ORM model persists with patient_id, recorded_by, chief_complaint
- All discrete vitals (bp_systolic, bp_diastolic, heart_rate, respiratory_rate,
  temperature, weight, height) are nullable
- vitals_extra JSONB column accepts arbitrary key-value pairs
- diagnosis and referring_to are nullable
- deleted_at defaults to None (soft delete pattern)
- FK to patients.id is enforced
- FK to users.id is enforced
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
