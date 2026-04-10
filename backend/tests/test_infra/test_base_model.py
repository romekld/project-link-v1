from app.core.base import TimestampMixin, SoftDeleteMixin


def test_timestamp_mixin_has_created_at():
    assert hasattr(TimestampMixin, "created_at")


def test_timestamp_mixin_has_updated_at():
    assert hasattr(TimestampMixin, "updated_at")


def test_soft_delete_column():
    assert hasattr(SoftDeleteMixin, "deleted_at")
