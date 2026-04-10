"""P3-10: Registration and duplicate-override events write audit_logs.

Real tests will verify:
- POST /patients (new registration) inserts a row in audit_logs with operation='CREATE'
- audit_logs row contains table_name='patients', record_id=patient.id, performed_by=user.id
- POST /patients with force_duplicate=True inserts audit_logs with operation='CREATE'
  and new_values containing possible_duplicate=True
- audit_logs rows cannot be updated or deleted (append-only enforcement)
- Multiple registrations produce multiple audit_logs rows (one per patient)
- audit_logs performed_at is set to current timestamp
"""
import pytest


@pytest.mark.asyncio
async def test_placeholder():
    """Wave 0 stub — will be replaced with real tests during execution."""
    pass
