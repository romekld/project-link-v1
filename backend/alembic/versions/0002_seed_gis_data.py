"""Seed GIS data: barangay boundaries and BHS station points.

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-16

Loads 32 CHO 2 barangay MultiPolygon boundaries from cho2-boundaries.geojson
and all BHS station Point geometries from fixtures/bhs_stations.json.
All inserts use ON CONFLICT DO NOTHING — safe to replay on existing data.
"""

import json
import os

import sqlalchemy as sa
from alembic import op
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, shape

# revision identifiers
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _resolve_geojson_path() -> str:
    base_dir = os.path.dirname(__file__)
    candidate_paths = [
        os.path.join(base_dir, "../../fixtures/cho2-boundaries.geojson"),
        os.path.join(base_dir, "../../../gis-data/cho2-boundaries.geojson"),
        "/gis-data/cho2-boundaries.geojson",
    ]

    for path in candidate_paths:
        if os.path.exists(path):
            return path

    raise FileNotFoundError(
        "Unable to locate cho2-boundaries.geojson. Checked: "
        + ", ".join(candidate_paths)
    )


def upgrade() -> None:
    conn = op.get_bind()

    # -------------------------------------------------------------------------
    # 1. Seed barangay boundaries from cho2-boundaries.geojson
    # -------------------------------------------------------------------------
    # Prefer backend fixtures, but support optional repo-level mount for local variants.
    geojson_path = _resolve_geojson_path()
    with open(geojson_path, encoding="utf-8") as f:
        geojson = json.load(f)

    for feature in geojson["features"]:
        props = feature["properties"]
        geom = shape(feature["geometry"])       # Shapely MultiPolygon
        wkb = from_shape(geom, srid=4326)       # WKBElement (EWKB with SRID)

        conn.execute(
            sa.text(
                "INSERT INTO barangays (psgc_code, name, city_name, boundary, area_sqkm) "
                "VALUES (:psgc_code, :name, :city_name, "
                "ST_GeomFromEWKB(decode(:boundary, 'hex')), :area_sqkm) "
                "ON CONFLICT (psgc_code) DO NOTHING"
            ),
            {
                "psgc_code": props["ADM4_PCODE"],
                "name": props["ADM4_EN"],
                "city_name": props["ADM3_EN"],
                "boundary": wkb.desc,           # hex WKB string
                "area_sqkm": props.get("AREA_SQKM"),
            },
        )

    # -------------------------------------------------------------------------
    # 2. Seed BHS station points from fixtures/bhs_stations.json
    # -------------------------------------------------------------------------
    # Path: alembic/versions/ -> alembic/ -> backend/ -> fixtures/
    fixture_path = os.path.join(
        os.path.dirname(__file__), "../../fixtures/bhs_stations.json"
    )
    with open(fixture_path, encoding="utf-8") as f:
        stations = json.load(f)

    for s in stations:
        # Skip placeholder/comment entries that have _comment key
        if "_comment" in s:
            continue

        # Point(longitude, latitude) — GeoJSON / WGS 84 axis order
        point_geom = Point(s["lng"], s["lat"])
        wkb_point = from_shape(point_geom, srid=4326)

        conn.execute(
            sa.text(
                "INSERT INTO health_stations "
                "(name, psgc_code, location, contact_number, address) "
                "VALUES (:name, :psgc_code, "
                "ST_GeomFromEWKB(decode(:location, 'hex')), "
                ":contact_number, :address) "
                "ON CONFLICT DO NOTHING"
            ),
            {
                "name": s["name"],
                "psgc_code": s["psgc_code"],
                "location": wkb_point.desc,     # hex WKB string
                "contact_number": s.get("contact_number"),
                "address": s.get("address"),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    # Remove all seeded data in reverse FK order
    conn.execute(sa.text("DELETE FROM health_stations"))
    conn.execute(sa.text("DELETE FROM barangays"))
