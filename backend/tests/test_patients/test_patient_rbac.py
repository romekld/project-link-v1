"""P3-08: RBAC enforcement — nurse CRUD, physician view+consult, CHO read-only, BHW blocked.

Real tests will verify:
- Nurse: POST /patients (201), GET /patients (200), GET /patients/:id (200)
- Midwife: same as nurse (POST/GET/GET by id)
- Physician: GET /patients (200), GET /patients/:id (200), POST /consultations (201)
- Physician: POST /patients returns 403 (no patient creation)
- CHO: GET /patients (200), GET /patients/:id (200) — city-wide read
- CHO: POST /patients returns 403 (read-only)
- DSO: GET /patients (200) — city-wide read
- PHIS Coordinator: GET /patients (200) — read-only
- BHW: all patient endpoints return 403 (zero access in Phase 3)
- system_admin: all patient endpoints return 403 (config-only role)
- Unauthenticated: all patient endpoints return 401
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
