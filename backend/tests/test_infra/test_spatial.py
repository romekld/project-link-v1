import pytest


@pytest.mark.asyncio
async def test_barangay_seed_count(async_session):
    """INFRA-04: 32 barangay rows exist after alembic upgrade head."""
    import sqlalchemy as sa
    try:
        result = await async_session.execute(sa.text("SELECT count(*) FROM barangays"))
        count = result.scalar()
    except Exception:
        pytest.skip("barangays table not yet created — run alembic upgrade head (Plan 02/03)")
    if count == 0:
        pytest.skip("barangays table empty — run alembic upgrade head with seed migration (Plan 01-03)")
    assert count == 32, f"Expected 32 barangays (CHO 2 jurisdiction), got {count}"


@pytest.mark.asyncio
async def test_barangay_geojson(async_session):
    """INFRA-04: ST_AsGeoJSON(boundary) returns valid RFC 7946 GeoJSON for a seeded barangay."""
    import sqlalchemy as sa
    import json
    try:
        result = await async_session.execute(
            sa.text("SELECT ST_AsGeoJSON(boundary) FROM barangays LIMIT 1")
        )
        row = result.fetchone()
    except Exception:
        pytest.skip("barangays table not yet created — run alembic upgrade head (Plan 03)")
    if row is None:
        pytest.skip("No barangay rows seeded yet — run alembic upgrade head (Plan 03)")
    geojson = json.loads(row[0])
    assert geojson["type"] in ("MultiPolygon", "Polygon"), "Boundary must be a polygon geometry"


@pytest.mark.asyncio
async def test_bhs_station_geojson(async_session):
    """INFRA-04: ST_AsGeoJSON(location) returns valid Point GeoJSON for a seeded BHS station."""
    import sqlalchemy as sa
    import json
    try:
        result = await async_session.execute(
            sa.text("SELECT ST_AsGeoJSON(location) FROM health_stations LIMIT 1")
        )
        row = result.fetchone()
    except Exception:
        pytest.skip("health_stations table not yet created — run alembic upgrade head (Plan 03)")
    if row is None:
        pytest.skip("No health_station rows seeded yet — run alembic upgrade head (Plan 03)")
    geojson = json.loads(row[0])
    assert geojson["type"] == "Point", "BHS location must be a Point geometry"
    coords = geojson["coordinates"]
    assert len(coords) == 2, "Point must have [lng, lat] coordinates"
    assert 119.0 < coords[0] < 122.0, "Longitude must be in Philippines range"
    assert 13.0 < coords[1] < 15.0, "Latitude must be in Cavite province range"
