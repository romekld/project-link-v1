"""P3-01: Patient model creates with all identity fields.

Real tests will verify:
- Patient ORM model persists with all required fields (last_name, first_name, birthdate, sex,
  barangay_psgc_code, health_station_id)
- Optional fields (middle_name, address_line, mobile_number) are nullable
- search_vector tsvector column is auto-populated on insert
- possible_duplicate defaults to False
- deleted_at defaults to None (soft delete pattern)
- created_at and updated_at are set on insert
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
