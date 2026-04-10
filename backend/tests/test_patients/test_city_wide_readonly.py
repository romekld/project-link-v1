"""P3-09: City-wide results are read-only for BHS-level roles.

Real tests will verify:
- Nurse at BHS-1 with city_wide=True can see patients from other BHS in search results
- Nurse at BHS-1 cannot POST /patients/:id/consultations for a patient from BHS-2 (403)
- Nurse at BHS-1 cannot PUT /patients/:id for a patient from BHS-2 (403)
- CHO/DSO with city_wide=True can see all patients (they are inherently city-wide roles)
- City-wide search result items include health_station_id for frontend to detect cross-BHS
- Physician at BHS-1 can create consultations for BHS-1 patients only (isolation enforced)
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
