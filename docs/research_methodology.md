# Research Methodology

The development of Project LINK utilized an Agile methodology to ensure that the integrated health station management system effectively meets the operational needs of City Health Office II (CHO II). This iterative framework allowed the project to adapt to the complex data flows of the Field Health Services Information System (FHSIS) while maintaining high standards for patient safety and data integrity.

## Agile Development Lifecycle

**Plan**: Defined the technical stack (React, FastAPI, and Supabase), project scope, and objectives for digitizing health records across 32 stations. This phase involved gathering existing manual processes and identifying user requirements through consultations with health workers.

**Design**: Researched specific CHO and BHS FHSIS workflows to design the planned "Zero-Tally" engine and the two-tier architecture. This stage focused on mapping data structures and designing the user interface to ensure it met the offline-first needs of field health workers.

**Develop**: Implemented the core clinical modules, the automated tallying logic, and the central validation gate. This phase focused on building the digital registries for ITR and TCL records and integrating the reporting platform for city-wide analytics.

**Test**: Conducted functional evaluations and E2E testing using Playwright to ensure the system’s reliability. The testing verified data synchronization accuracy, role-based access security, and compliance with DOH reporting standards.

**Deploy**: Released the system for incremental use through pilot testing at selected barangay health stations. This allowed for real-world monitoring of data handling and system stability in field conditions.

**Review**: Assessed the system's performance and gathered direct feedback from midwives and nurses. This phase focused on refining the validation process and ensuring the reporting modules accurately mirrored required health forms.

**Launch**: Executed the full city-wide implementation of the integrated health station management system. This marked the final transition of all operational stations from paper-based registries to the centralized digital platform.
