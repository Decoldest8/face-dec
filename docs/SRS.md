# Software Requirements Specification (SRS)
## Biometric Employee Log System - Vitality Hospital

### 1. Introduction

#### 1.1 Purpose
This document specifies the requirements for the Biometric Employee Log System for Vitality Hospital. The system will provide secure biometric attendance tracking, shift management, and payroll integration for hospital staff.

#### 1.2 Scope
The system includes:
- Biometric authentication using face recognition/RFID with WebAuthn fallback
- Employee and shift management
- Attendance tracking and reporting
- Payroll data export
- Role-based access control
- Audit logging for all administrative actions

#### 1.3 Definitions
- **HR_ADMIN**: Human Resources Administrator role with employee and shift management permissions
- **SYS_ADMIN**: System Administrator role with full system access
- **Biometric Device**: Hardware device for face recognition/RFID scanning
- **Shift Category**: Predefined shift templates (e.g., Morning, Evening, Night)
- **Individual Override**: Custom shift assignment that overrides category shift

### 2. Overall Description

#### 2.1 Product Perspective
The system is a web-based application with a RESTful API backend and React frontend. It integrates with ZKTeco biometric devices and external payroll systems.

#### 2.2 Product Functions
- User authentication with JWT
- Employee CRUD operations
- Shift configuration and assignment
- Biometric clock-in/clock-out
- Attendance reporting (daily/weekly)
- Payroll data export (CSV/API)
- Automated logout for unclosed sessions

#### 2.3 User Characteristics
- **HR Administrators**: Manage employees, shifts, and generate reports
- **System Administrators**: Full system configuration and maintenance
- **Employees**: Clock in/out using biometric devices

#### 2.4 Constraints
- Must comply with healthcare data protection regulations
- Must support HTTPS/TLS 1.2+
- Must maintain audit logs for all admin actions
- Must handle concurrent biometric device connections

### 3. Specific Requirements

#### 3.1 Functional Requirements

##### 3.1.1 Authentication
- FR-1: System shall support username/password authentication
- FR-2: System shall use JWT tokens with 8-hour expiry
- FR-3: System shall hash passwords using bcrypt (work factor 12)
- FR-4: System shall lock accounts after 5 failed login attempts (15-minute lock)
- FR-5: System shall support HR_ADMIN and SYS_ADMIN roles

##### 3.1.2 Employee Management
- FR-6: System shall allow creation of employee records with unique employee ID
- FR-7: System shall allow updating employee information
- FR-8: System shall allow deactivating employee accounts
- FR-9: System shall assign employees to shift categories
- FR-10: System shall store biometric templates and RFID card numbers

##### 3.1.3 Shift Management
- FR-11: System shall support shift category configuration
- FR-12: System shall allow individual shift overrides per employee
- FR-13: System shall define shift start/end times and days of week
- FR-14: System shall configure grace periods for late arrival
- FR-15: System shall resolve individual overrides before category shifts

##### 3.1.4 Attendance Tracking
- FR-16: System shall support face recognition-based clock-in
- FR-17: System shall support RFID card clock-in
- FR-18: System shall support WebAuthn fallback for browser biometric input
- FR-19: System shall reject duplicate clock-in attempts (409 Conflict)
- FR-20: System shall mark late arrivals based on shift configuration
- FR-21: System shall mark early departures based on shift configuration
- FR-22: System shall make attendance records immutable

##### 3.1.5 Auto-Logout Engine
- FR-23: System shall run auto-logout job every minute
- FR-24: System shall auto-logout unclosed sessions from previous days
- FR-25: System shall use toLocaleDateString() for day filtering
- FR-26: System shall be resilient to database errors

##### 3.1.6 Reporting
- FR-27: System shall generate daily attendance reports
- FR-28: System shall generate weekly attendance reports
- FR-29: System shall export attendance data as CSV
- FR-30: System shall display late arrival and early departure indicators

##### 3.1.7 Payroll Integration
- FR-31: System shall export payroll data as CSV
- FR-32: System shall push payroll data via REST API
- FR-33: System shall only export closed sessions (clock_out IS NOT NULL)
- FR-34: System shall log all export events in payroll_exports table

##### 3.1.8 Audit Logging
- FR-35: System shall log all admin actions with user, IP, and timestamp
- FR-36: System shall record before/after state for update/delete operations
- FR-37: System shall log entity type and entity ID for each action

#### 3.2 Non-Functional Requirements

##### 3.2.1 Security
- NFR-1: System shall enforce HTTPS/TLS 1.2+
- NFR-2: System shall use rate limiting on authentication endpoints
- NFR-3: System shall implement Helmet.js security headers
- NFR-4: System shall validate all input data
- NFR-5: System shall sanitize output to prevent XSS

##### 3.2.2 Performance
- NFR-6: System shall respond to API requests within 500ms (95th percentile)
- NFR-7: System shall support 100 concurrent users
- NFR-8: System shall process 1000 attendance records per minute

##### 3.2.3 Reliability
- NFR-9: System shall have 99.5% uptime
- NFR-10: System shall maintain database backups daily
- NFR-11: System shall log all errors for troubleshooting

##### 3.2.4 Usability
- NFR-12: System shall provide intuitive user interface
- NFR-13: System shall use royal blue and orange color scheme
- NFR-14: System shall be accessible via keyboard navigation

### 4. External Interface Requirements

#### 4.1 User Interfaces
- Web-based interface compatible with modern browsers
- Mobile-responsive design for tablet access
- Biometric terminal interface for kiosk mode

#### 4.2 Hardware Interfaces
- ZKTeco biometric devices via TCP/IP
- RFID card readers
- Face recognition cameras

#### 4.3 Software Interfaces
- MySQL 8.0 database
- External payroll system REST API

### 5. System Features

#### 5.1 Feature 1: Biometric Authentication
**Description**: Secure login using biometric devices with WebAuthn fallback

**Functional Requirements**: FR-1, FR-2, FR-3, FR-4, FR-5

#### 5.2 Feature 2: Employee Management
**Description**: Complete CRUD operations for employee records

**Functional Requirements**: FR-6, FR-7, FR-8, FR-9, FR-10

#### 5.3 Feature 3: Shift Management
**Description**: Configure shift categories and individual overrides

**Functional Requirements**: FR-11, FR-12, FR-13, FR-14, FR-15

#### 5.4 Feature 4: Attendance Tracking
**Description**: Biometric clock-in/clock-out with late/early detection

**Functional Requirements**: FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22

#### 5.5 Feature 5: Auto-Logout Engine
**Description**: Automated logout for unclosed sessions

**Functional Requirements**: FR-23, FR-24, FR-25, FR-26

#### 5.6 Feature 6: Reporting
**Description**: Generate and export attendance reports

**Functional Requirements**: FR-27, FR-28, FR-29, FR-30

#### 5.7 Feature 7: Payroll Integration
**Description**: Export payroll data via CSV or API

**Functional Requirements**: FR-31, FR-32, FR-33, FR-34

#### 5.8 Feature 8: Audit Logging
**Description**: Complete audit trail for admin actions

**Functional Requirements**: FR-35, FR-36, FR-37

### 6. Future Enhancements (Phase 2 & 3)

- SMS/email alerts for auto-logout
- Leave management integrated with shifts
- Android mobile app for biometric terminal
- Facial recognition via mobile camera
- GPS attendance for off-site staff
- AI staffing prediction from attendance patterns
- 2FA for HR accounts
- Docker containerisation for deployment
