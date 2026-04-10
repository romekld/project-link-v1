"""P3-05: POST /patients registers patient, checks duplicate pre-save.

Real tests will verify:
- POST /patients with valid data returns 201 with PatientResponse
- health_station_id is auto-set from current_user.health_station_id (not from request body)
- sex validation: only 'male' or 'female' accepted (422 on other values)
- birthdate validation: date format enforced
- Required fields (last_name, first_name, birthdate, sex, barangay_psgc_code) enforced
- Duplicate check runs before save: 409 returned with existing patient on exact match
- force_duplicate=True bypasses 409, saves with possible_duplicate=True
- Nurse at BHS-1 creates patient assigned to BHS-1 automatically
- Missing required fields return 422 with field-level error detail
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
