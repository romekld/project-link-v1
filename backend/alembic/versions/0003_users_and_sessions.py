"""users and user_sessions tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users table
    # Note: NO deleted_at (soft delete) — User uses is_active flag (CONTEXT.md decision)
    # Note: roles uses PostgreSQL ARRAY(TEXT) — requires explicit dialect type
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("email", sa.Text, nullable=False, unique=True),
        sa.Column("full_name", sa.Text, nullable=False),
        sa.Column("hashed_password", sa.Text, nullable=False),
        sa.Column("roles", postgresql.ARRAY(sa.Text), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_health_station_id", "users", ["health_station_id"])

    # user_sessions table — refresh token store with SHA-256 hashed tokens
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.Text, nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_token_hash", "user_sessions", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_table("user_sessions")
    op.drop_table("users")
