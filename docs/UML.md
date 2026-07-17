# UML Diagrams - Biometric Employee Log System

## Use Case Diagram

### Actors
- **HR Administrator**: Manages employees, shifts, and generates reports
- **System Administrator**: Configures system settings and maintains devices
- **Employee**: Clocks in/out using biometric devices
- **Payroll System**: Receives exported payroll data

### Use Cases

#### HR Administrator
- **UC-01**: Login to system
- **UC-02**: Create employee record
- **UC-03**: Update employee information
- **UC-04**: Deactivate employee account
- **UC-05**: Create shift category
- **UC-06**: Assign shift to employee
- **UC-07**: Generate daily attendance report
- **UC-08**: Generate weekly attendance report
- **UC-09**: Export payroll data
- **UC-10**: View audit logs

#### System Administrator
- **UC-11**: Configure biometric devices
- **UC-12**: Manage user accounts
- **UC-13**: View system logs
- **UC-14**: Configure system settings

#### Employee
- **UC-15**: Clock in using face recognition
- **UC-16**: Clock in using RFID card
- **UC-17**: Clock out using face recognition
- **UC-18**: Clock out using RFID card

#### Payroll System
- **UC-19**: Receive payroll data via API
- **UC-20**: Receive payroll data via CSV

## Class Diagram

### Core Classes

#### Employee
- **Attributes**:
  - id: Integer (PK)
  - employee_id: String (Unique)
  - first_name: String
  - last_name: String
  - email: String (Unique)
  - phone: String
  - department: String
  - position: String
  - hire_date: Date
  - is_active: Boolean
  - biometric_template: Text
  - rfid_card: String (Unique)
  - shift_category_id: Integer (FK)
- **Methods**:
  - validate()
  - getFullName()
  - isActive()

#### ShiftCategory
- **Attributes**:
  - id: Integer (PK)
  - category_name: String (Unique)
  - description: Text
  - start_time: Time
  - end_time: Time
  - days_of_week: String
  - grace_period_minutes: Integer
  - is_active: Boolean
- **Methods**:
  - validate()
  - getDaysArray()

#### Shift
- **Attributes**:
  - id: Integer (PK)
  - employee_id: Integer (FK)
  - shift_category_id: Integer (FK)
  - shift_name: String
  - start_time: Time
  - end_time: Time
  - days_of_week: String
  - is_individual_override: Boolean
  - effective_date: Date
  - is_active: Boolean
- **Methods**:
  - validate()
  - isOverride()

#### AttendanceRecord
- **Attributes**:
  - id: Integer (PK)
  - employee_id: Integer (FK)
  - biometric_device_id: Integer (FK)
  - clock_in: DateTime
  - clock_out: DateTime
  - clock_in_method: Enum
  - clock_out_method: Enum
  - shift_id: Integer (FK)
  - is_late: Boolean
  - is_early_departure: Boolean
  - notes: Text
  - auto_logged_out: Boolean
  - ip_address: String
- **Methods**:
  - validate()
  - calculateDuration()
  - isClosed()

#### HRUser
- **Attributes**:
  - id: Integer (PK)
  - username: String (Unique)
  - email: String (Unique)
  - password_hash: String
  - role: Enum
  - failed_login_attempts: Integer
  - locked_until: DateTime
  - last_login: DateTime
  - is_active: Boolean
- **Methods**:
  - validate()
  - isLocked()
  - incrementFailedAttempts()
  - resetFailedAttempts()

#### AuditLog
- **Attributes**:
  - id: Integer (PK)
  - user_id: Integer (FK)
  - username: String
  - action: String
  - entity_type: String
  - entity_id: Integer
  - ip_address: String
  - user_agent: Text
  - before_state: JSON
  - after_state: JSON
  - timestamp: DateTime
- **Methods**:
  - validate()
  - getChangeSummary()

#### PayrollExport
- **Attributes**:
  - id: Integer (PK)
  - export_type: Enum
  - start_date: Date
  - end_date: Date
  - record_count: Integer
  - file_path: String
  - api_endpoint: String
  - api_response: JSON
  - status: Enum
  - error_message: Text
  - exported_by: Integer (FK)
  - exported_at: DateTime
- **Methods**:
  - validate()
  - markCompleted()
  - markFailed()

#### BiometricDevice
- **Attributes**:
  - id: Integer (PK)
  - device_name: String
  - device_type: Enum
  - ip_address: String (Unique)
  - port: Integer
  - serial_number: String (Unique)
  - location: String
  - is_active: Boolean
  - last_sync: DateTime
- **Methods**:
  - validate()
  - sync()
  - isOnline()

### Relationships
- Employee → ShiftCategory (Many-to-One)
- Employee → Shift (One-to-Many)
- ShiftCategory → Shift (One-to-Many)
- Employee → AttendanceRecord (One-to-Many)
- BiometricDevice → AttendanceRecord (One-to-Many)
- Shift → AttendanceRecord (One-to-Many)
- HRUser → AuditLog (One-to-Many)
- HRUser → PayrollExport (One-to-Many)

## Sequence Diagrams

### Sequence 1: Employee Clock-In

```
Actor: Employee
Objects: BiometricDevice, AttendanceController, AttendanceRecord, Shift, ShiftCategory

1. Employee → BiometricDevice: Scan face
2. BiometricDevice → AttendanceController: POST /attendance/clock-in
3. AttendanceController → AttendanceRecord: findByEmployeeId
4. AttendanceRecord → AttendanceController: Return existing record
5. AttendanceController → Shift: findByEmployeeId (with override)
6. Shift → AttendanceController: Return shift
7. AttendanceController → ShiftCategory: findById
8. ShiftCategory → AttendanceController: Return category
9. AttendanceController → AttendanceRecord: create(clock_in, method, shift)
10. AttendanceRecord → AttendanceController: Return new record
11. AttendanceController → BiometricDevice: Return success
12. BiometricDevice → Employee: Display confirmation
```

### Sequence 2: HR Admin Creates Employee

```
Actor: HR Administrator
Objects: EmployeeController, Employee, AuditLog, Database

1. HR Administrator → EmployeeController: POST /employees
2. EmployeeController → Employee: validate()
3. Employee → EmployeeController: Return validation result
4. EmployeeController → Database: Check uniqueness
5. Database → EmployeeController: Return result
6. EmployeeController → Employee: create()
7. Employee → EmployeeController: Return new employee
8. EmployeeController → AuditLog: create(action, before, after)
9. AuditLog → EmployeeController: Return log entry
10. EmployeeController → HR Administrator: Return employee data
```

### Sequence 3: Auto-Logout Engine

```
Actor: CronScheduler
Objects: AttendanceRecord, Employee, AuditLog

1. CronScheduler → AttendanceRecord: findAll(clock_out=null, auto_logged_out=false)
2. AttendanceRecord → CronScheduler: Return unclosed records
3. CronScheduler → AttendanceRecord: For each record
4. CronScheduler → AttendanceRecord: get clock_in date
5. AttendanceRecord → CronScheduler: Return date
6. CronScheduler → CronScheduler: Compare with today (toLocaleDateString)
7. CronScheduler → AttendanceRecord: update(clock_out=23:59:59, method=auto)
8. AttendanceRecord → CronScheduler: Return updated record
9. CronScheduler → AuditLog: create(AUTO_LOGOUT action)
10. AuditLog → CronScheduler: Return log entry
11. CronScheduler → CronScheduler: Continue next record
```

## Activity Diagrams

### Activity 1: Clock-In Process

```
Start
  |
  v
[Employee scans face]
  |
  v
[Validate employee ID]
  |
  +---> [Invalid] ---> [Display error] ---> End
  |
  v
[Check for active clock-in today]
  |
  +---> [Exists] ---> [Display "Already clocked in"] ---> End
  |
  v
[Retrieve shift configuration]
  |
  v
[Calculate late arrival]
  |
  v
[Create attendance record]
  |
  v
[Log audit entry]
  |
  v
[Display success message]
  |
  v
End
```

### Activity 2: Payroll Export

```
Start
  |
  v
[HR Admin selects date range]
  |
  v
[Select export type (CSV/API)]
  |
  +---> [CSV] ---> [Generate CSV file] ---> [Download file]
  |
  +---> [API] ---> [Format JSON payload] ---> [POST to payroll API]
  |                                      |
  |                                      +---> [Success] ---> [Log success]
  |                                      |
  |                                      +---> [Failure] ---> [Log error]
  |
  v
[Create payroll export record]
  |
  v
[Log audit entry]
  |
  v
[Display confirmation]
  |
  v
End
```

## Component Diagram

### Backend Components
- **API Layer**: Express.js routes and controllers
- **Business Logic Layer**: Controllers and services
- **Data Access Layer**: Sequelize models
- **Security Layer**: JWT, bcrypt, rate limiting
- **Integration Layer**: ZKTeco SDK, Payroll API
- **Scheduler Layer**: node-cron for auto-logout

### Frontend Components
- **Presentation Layer**: React components (pages, UI components)
- **State Management**: React hooks and context
- **API Client**: Axios with interceptors
- **Authentication**: Token management
- **Routing**: React Router
- **Styling**: Tailwind CSS

### Database Components
- **MySQL 8.0**: Primary database
- **Sequelize ORM**: Object-relational mapping
- **Connection Pool**: Database connection management
