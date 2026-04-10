"""P3-03: Duplicate detection finds exact match city-wide.

Real tests will verify:
- POST /patients with (last_name, first_name, birthdate) matching an existing patient
  returns 409 with has_duplicate=True and existing_patient details
- Duplicate check is city-wide (matches patients at other BHS)
- Case-insensitive match: 'SANTOS' matches 'santos'
- POST /patients with force_duplicate=True saves with possible_duplicate=True flag
- No match returns 201 with has_duplicate=False
- Middle name difference alone does NOT prevent duplicate detection
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
