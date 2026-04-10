"""P3-07: POST /patients/:id/consultations creates consultation.

Real tests will verify:
- POST /patients/:id/consultations with chief_complaint returns 201 with ConsultationResponse
- recorded_by is auto-set from current_user.id
- All vitals are optional — consultation with only chief_complaint is valid
- Vitals range validation: bp_systolic outside [40, 300] returns 422
- Vitals range validation: temperature outside [30.0, 45.0] returns 422
- vitals_extra JSONB accepts arbitrary key-value dict
- diagnosis and referring_to are nullable
- BMI computed on response when weight and height provided
- POST to patient from different BHS returns 403 (nurse isolation)
- 404 on non-existent patient_id
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
