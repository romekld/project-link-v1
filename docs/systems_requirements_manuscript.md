Below is a plain-text, manuscript-ready version of the Systems Requirements section with APA 7th-style table formatting adapted for plain text presentation.

Systems Requirements

This section presents the hardware, software, peopleware, and network requirements used in the development and intended implementation of Project LINK (Local Information Network for Kalusugan). These requirements define the resources needed to design, build, test, deploy, and operate the proposed system effectively.

Hardware Requirements

The hardware requirements include the computing devices and equipment needed during both the development and implementation phases of the system. During development, higher-performance devices are necessary to support programming, database management, testing, and interface design. During implementation, the required hardware focuses on usability, portability, and accessibility for health workers and administrative personnel.

Table 1
Hardware Requirements for the Development and Implementation of Project LINK

Component               Development Requirement                          Implementation Requirement
Processor               Intel Core i5 / Ryzen 5 or higher               Intel Core i3 / Ryzen 3 or equivalent
Memory (RAM)            8 GB minimum; 16 GB recommended                 4 GB minimum for mobile devices;
8 GB recommended for desktop use
Storage                 256 GB SSD minimum                              64 GB internal storage for mobile devices;
256 GB SSD for desktops or laptops
Display                 14-inch or larger display                       10-inch tablet or 14-inch laptop/desktop monitor
Device Type             Laptop or desktop computer                      Tablet, laptop, or desktop computer
Server Environment      Cloud-hosted or local test server               Centralized deployment server or cloud server
Internet Capability     Stable broadband connection                     Wi-Fi or mobile data connectivity for synchronization

Note. Development devices are intended for coding, testing, and system configuration, while implementation devices are intended for actual field and office use.

During the development phase, the researchers require computers with sufficient processing power and memory to support frontend development, backend API integration, database operations, and testing activities. In the implementation phase, barangay health workers and health center personnel may use tablets, laptops, or desktop computers depending on the nature of their tasks. Mobile-friendly access is important to support field-based health work and decentralized data entry. 

Software Requirements

The software requirements refer to the programs, frameworks, libraries, and platforms used to develop and operate the system. These tools support interface development, backend processing, database management, geospatial visualization, predictive analytics, and collaboration.

Table 2
Software Requirements for the Development and Implementation of Project LINK

Category                Development Software                            Implementation Software
Operating System        Windows 10/11 or Linux                          Windows 10/11, Linux, or Android
Frontend                React with TypeScript                           Web browser-based user interface / PWA
Styling/UI              Tailwind CSS and shadcn/ui                      Rendered through supported modern browsers
Mapping/GIS             MapLibre GL JS                                 Map-based disease visualization interface
Backend API             Laravel REST API                                Laravel application server
Database                PostgreSQL with PostGIS                         PostgreSQL with PostGIS
Machine Learning        Python with FastAPI                             Python-based prediction service
Version Control         Git and GitHub                                  Not applicable to end users
Development Tools       Visual Studio Code, Figma, Postman              Web browser, server runtime environment
Browser Support         Google Chrome, Microsoft Edge, Mozilla Firefox  Google Chrome, Microsoft Edge, Mozilla Firefox

Note. The listed software includes both development tools and runtime technologies necessary for the operation of the proposed system.

The software stack was selected to support a modern, scalable, and maintainable information system. React with TypeScript is used for the frontend interface, while Laravel serves as the backend API for business logic, authentication, and data management. PostgreSQL with PostGIS supports structured health data and geospatial processing. Python with FastAPI is used for machine learning services related to predictive analytics. These software components work together to support digital health records management, disease mapping, and analytical reporting. 

Peopleware Requirements

Peopleware requirements refer to the individuals involved in the development, management, and use of the system. This includes both the technical personnel responsible for building the system and the intended users who will operate it in the health service environment.

Table 3
Peopleware Requirements for Project LINK

Role                    Phase                                            Primary Responsibility
System Analyst          Development                                      Gather requirements and analyze workflows
Frontend Developer      Development                                      Develop the user interface and client-side features
Backend Developer       Development                                      Build APIs, business logic, and server-side functions
Database Developer      Development                                      Design and manage the database structure
ML Developer            Development                                      Develop predictive analytics models and services
QA Tester               Development                                      Conduct functional, integration, and usability testing
Project Manager         Development                                      Coordinate tasks, timelines, and documentation
Barangay Health Worker  Implementation                                   Encode and update field-level health data
Midwife/Nurse           Implementation                                   Validate records and manage patient-related workflows
CHO Personnel           Implementation                                   Monitor reports, dashboards, and program performance
System Administrator    Implementation                                   Manage accounts, permissions, and system maintenance

Note. Peopleware requirements include both the project development team and the actual users and administrators of the system.

The success of the system depends not only on technical tools but also on the individuals who develop and use it. During development, the project team is responsible for translating user needs into a working information system. During implementation, barangay health workers, midwives, nurses, and CHO personnel serve as the primary users of the platform. Their participation is essential in maintaining accurate records, validating data, and using system outputs for decision-making and service delivery. 

Network Requirements

The network requirements describe the connectivity and communication environment needed for system access, data synchronization, and secure transmission of records. Because the system is intended to support health centers and field users, reliable but practical network requirements are necessary.

Table 4
Network Requirements for the Development and Implementation of Project LINK

Requirement             Specification                                   Purpose
Internet Connection     Broadband or mobile data connection             Supports access to online system services
Minimum Speed           At least 5 Mbps                                Supports routine synchronization and web access
Local Network           Wi-Fi or local area network (LAN)              Enables office-based connectivity
Protocol                HTTPS                                           Secures transmission of health data
Remote Access           Internet-enabled browser access                 Allows access across health centers and offices
Offline Capability      Local temporary storage with delayed sync       Supports use in low-connectivity areas
Server Access           Centralized server or cloud-hosted deployment   Provides shared access to system data
Security Support        Firewall, SSL, and authenticated access         Protects confidentiality and integrity of information

Note. Network requirements are designed to support both centralized access and practical field conditions where connectivity may be limited.

The network environment must allow secure and efficient access to the system across multiple health centers. Since some field locations may experience unstable internet connectivity, the system should support temporary offline data handling and later synchronization once a connection becomes available. Secure communication protocols and controlled server access are necessary to protect sensitive health information and maintain reliable system performance. 

Overall, the system requirements provide the technical and operational foundation for the development and implementation of Project LINK. By identifying the necessary hardware, software, peopleware, and network resources, this section establishes the conditions needed for the system to function effectively and support the health information management needs of City Health Office II and its barangay health centers.
