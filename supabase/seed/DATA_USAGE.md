# GIS Data Usage Reference

This directory contains the GeoJSON data used for initializing the spatial registry of Project LINK.

## Files

- `gis/dasmarinas_boundaries.geojson`: Official municipal and barangay boundaries for Dasmariñas City.
- `gis/cho2_boundaries.geojson`: Specific coverage boundaries for City Health Office 2 (CHO2).

## Purpose and Usage

### 1. Master Registry vs. Operational Coverage

The system uses a dual-table approach for maximum flexibility:

- **`city_barangays` (The Registry):** Populated using `dasmarinas_boundaries.geojson`. It stores every official barangay in the city with its full spatial boundary (`MultiPolygon`).
- **`barangays` (The Operational Scope):** References `city_barangays` via a Foreign Key. This table defines the specific barangays currently covered by Project LINK or assigned to CHO2.

### 2. Dynamic and Flexible Coverage

This structure enables "Dynamic Flexible Work":

- **Expanding Coverage:** To add a new barangay to the system, simply link it from the Master Registry to the Operational table.
- **Eliminating Coverage:** Removing a barangay from operational scope doesn't delete its geographic data; it just removes it from the app's active list.

### 3. Spatial Logic and Assignment

By storing polygons in the Master Registry, the system can:

- **Auto-Assignment:** Use `ST_Within` to automatically identify which barangay a patient belongs to based on GPS coordinates.
- **CHO Scoping:** Use `cho2_boundaries.geojson` to filter or select which master barangays should be active for a specific office.
