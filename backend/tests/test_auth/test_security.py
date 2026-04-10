"""Tests for app.core.security — JWT creation/verification and password hashing.

TDD: These tests were written BEFORE security.py was implemented.
They specify the exact behavior required by plan 02-01.
"""
import time

import pytest
from fastapi import HTTPException


class TestCreateAccessToken:
    def test_round_trip_basic(self):
        from app.core.security import create_access_token, verify_token

        token = create_access_token(user_id=1, roles=["nurse"], health_station_id=5)
        payload = verify_token(token)

        assert payload["sub"] == "1"
        assert payload["roles"] == ["nurse"]
        assert payload["health_station_id"] == 5
        assert payload["type"] == "access"

    def test_payload_has_iat_and_exp(self):
        from app.core.security import create_access_token, verify_token

        token = create_access_token(user_id=2, roles=["physician"], health_station_id=None)
        payload = verify_token(token)

        assert "exp" in payload
        assert "iat" in payload

    def test_health_station_id_none_allowed(self):
        from app.core.security import create_access_token, verify_token

        token = create_access_token(user_id=3, roles=["system_admin"], health_station_id=None)
        payload = verify_token(token)

        assert payload["health_station_id"] is None

    def test_multiple_roles(self):
        from app.core.security import create_access_token, verify_token

        roles = ["nurse", "disease_surveillance_officer"]
        token = create_access_token(user_id=4, roles=roles, health_station_id=7)
        payload = verify_token(token)

        assert payload["roles"] == roles


class TestCreateRefreshToken:
    def test_round_trip(self):
        from app.core.security import create_refresh_token, verify_token

        token = create_refresh_token(user_id=1, roles=["nurse"], health_station_id=5)
        payload = verify_token(token)

        assert payload["sub"] == "1"
        assert payload["roles"] == ["nurse"]
        assert payload["health_station_id"] == 5
        assert payload["type"] == "refresh"

    def test_has_jti(self):
        from app.core.security import create_refresh_token, verify_token

        token = create_refresh_token(user_id=1, roles=["nurse"], health_station_id=5)
        payload = verify_token(token)

        assert "jti" in payload
        assert len(payload["jti"]) > 0

    def test_jti_is_unique_per_token(self):
        from app.core.security import create_refresh_token, verify_token

        t1 = create_refresh_token(user_id=1, roles=["nurse"], health_station_id=5)
        t2 = create_refresh_token(user_id=1, roles=["nurse"], health_station_id=5)
        p1 = verify_token(t1)
        p2 = verify_token(t2)

        assert p1["jti"] != p2["jti"]


class TestVerifyToken:
    def test_expired_token_raises_401(self):
        import jwt
        from datetime import datetime, timedelta, timezone
        from app.core.config import settings
        from app.core.security import verify_token

        expired_payload = {
            "sub": "1",
            "roles": ["nurse"],
            "health_station_id": 5,
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "access",
        }
        expired_token = jwt.encode(
            expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_token(expired_token)

        assert exc_info.value.status_code == 401

    def test_invalid_token_raises_401(self):
        from app.core.security import verify_token

        with pytest.raises(HTTPException) as exc_info:
            verify_token("not.a.valid.token")

        assert exc_info.value.status_code == 401

    def test_tampered_signature_raises_401(self):
        from app.core.security import create_access_token, verify_token

        token = create_access_token(user_id=1, roles=["nurse"], health_station_id=5)
        # Tamper with the signature
        parts = token.split(".")
        tampered = parts[0] + "." + parts[1] + ".invalidsignature"

        with pytest.raises(HTTPException) as exc_info:
            verify_token(tampered)

        assert exc_info.value.status_code == 401


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        from app.core.security import hash_password

        hashed = hash_password("mysecretpassword")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        from app.core.security import hash_password, verify_password

        plain = "correcthorsebatterystaple"
        hashed = hash_password(plain)

        assert verify_password(plain, hashed) is True

    def test_verify_password_wrong_returns_false(self):
        from app.core.security import hash_password, verify_password

        hashed = hash_password("correctpassword")

        assert verify_password("wrongpassword", hashed) is False

    def test_hash_is_not_plaintext(self):
        from app.core.security import hash_password

        plain = "mysecretpassword"
        hashed = hash_password(plain)

        assert plain not in hashed

    def test_same_password_produces_different_hashes(self):
        """Argon2 uses random salts — same input must not produce same hash."""
        from app.core.security import hash_password

        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")

        assert h1 != h2


class TestHashToken:
    def test_returns_hex_string(self):
        from app.core.security import hash_token

        result = hash_token("somerawtoken")
        assert isinstance(result, str)
        assert len(result) == 64  # SHA-256 = 32 bytes = 64 hex chars

    def test_deterministic(self):
        from app.core.security import hash_token

        assert hash_token("token1") == hash_token("token1")

    def test_different_inputs_differ(self):
        from app.core.security import hash_token

        assert hash_token("token1") != hash_token("token2")
