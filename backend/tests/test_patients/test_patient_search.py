"""P3-04: Search returns results via GIN tsvector, BHS-scoped and city-wide.

Real tests will verify:
- GET /patients?q=Santos returns patients with 'Santos' in last_name or first_name
- Partial match: 'San' returns 'Santos', 'Santiago', 'Sanchez'
- Default search is BHS-scoped (nurse at BHS-1 does not see BHS-2 patients)
- GET /patients?q=Santos&city_wide=true returns patients from all BHS
- City-wide results for BHS-level roles are read-only (no edit actions)
- Special characters in query (O'Brien, &) do not cause 500 error (input sanitization)
- Empty query returns all patients (BHS-scoped or city-wide)
- Pagination works: page and page_size params respected, total_pages calculated
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
