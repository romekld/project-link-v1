"""P3-06: GET /patients/:id returns patient with consultations.

Real tests will verify:
- GET /patients/:id returns PatientResponse with all identity fields
- Response includes barangay_name (joined from barangay) and health_station_name (joined)
- Response includes computed age field (years from birthdate)
- GET /patients/:id/consultations returns list of ConsultationResponse sorted newest first
- ConsultationResponse includes computed bmi field when weight and height are present
- bmi is None when weight or height is missing
- 404 returned for non-existent patient_id
- Nurse at BHS-1 cannot fetch patient from BHS-2 (403 on isolation filter)
- CHO/DSO can fetch any patient city-wide (read-only roles bypass isolation)
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
