# Flow 6 — GIS Map and ML Intelligence Dashboard

**Actor:** City Health Officer, PHN (read-only)
**Interface:** Web

```
Intelligence → Disease Map
    │
    └── MapLibre GL JS loads Dasmariñas barangay choropleth
              ├── Default layer: aggregate case density (all disease types)
              └── Toggle layers:
                        ├── Disease outbreak heatmap (from PIDSR)
                        ├── TB case density (from NTP Registry)
                        ├── Maternal risk overlay
                        └── Malnutrition distribution (from Child Nutrition TCL)
                                  │
                                  ▼
    [Click barangay polygon]
    │
    └── Sidebar opens:
              ├── BHS name and current period
              ├── Active disease alerts (if any)
              ├── Key indicator snapshot (top FHSIS indicators for this BHS)
              └── Link to full BHS ST (if available)

    [Toggle: High-Risk Patient markers]
    └── Point markers for patients flagged HIGH by ML classifier
              (barangay-level geocoded — no precise address shown for privacy)

Intelligence → Forecasting
    │
    └── Prophet outbreak forecast panel
              ├── Disease selector: Dengue | TB | Maternal Risk | Malnutrition
              ├── Forecast horizon: 30 / 60 / 90 days
              └── Chart: historical trend + forecast curve with confidence bands
                        │
                        ▼
    [Export forecast as PNG or PDF]
```

---

## ML Models — Data Sources

| Model | Feeds From | Output |
| :--- | :--- | :--- |
| Maternal risk classifier | Maternal Care TCL (BP, age, parity, AOG, labs per ANC visit) | Risk level: LOW / MEDIUM / HIGH; referral flag |
| Child malnutrition risk | Child Care TCL Parts 1–2 (WAZ/HAZ/WHZ trend over time) | SAM/MAM prediction; growth trajectory alert |
| EPI dropout risk | Child Care TCL (missed dose pattern, age vs schedule) | Dropout probability; follow-up priority score |
| NCD escalation risk | NCD TCL Part 1 (BP/FBS trend, PhilPEN score history) | Escalation risk; intervention trigger |
| TB dropout prediction | NTP Registry (DOTS attendance log, treatment phase, missed doses) | Treatment failure probability |
| Outbreak forecasting | PIDSR Disease Log (time-series by disease type) | Forecast curve with confidence bands per disease |
