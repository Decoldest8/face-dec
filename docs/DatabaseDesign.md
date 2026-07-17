# Database Design - Biometric Employee Log System

## Overview
The database uses MySQL 8.0 with InnoDB engine, UTF8MB4 encoding, and follows Third Normal Form (3NF). All timestamps are stored in UTC.

## Entity-Relationship Diagram

```
+------------------+       +-------------------+
| shift_categories |<------|    employees      |
+------------------+       +-------------------+
| id (PK)          |       | id (PK)           |
| category_name    |       | employee_id (UK)  |
| description      |       | first_name        |
| start_time       |       | last_name         |
| end_time         |       | email (UK)        |
| days_of_week     |       | phone             |
| grace_period_mins|       | department        |
| is_active        |       | position          |
| created_at       |       | hire_date         |
+------------------+       | is_active         |
                          | biometric_template |
                          | rfid_card (UK)     |
                          | shift_category_id  |
                          | created_at         |
                          | updated_at         |
                          +-------------------+
                                   |
                                   | 1
                                   |
                                   | N
                                   v
                          +-------------------+
                          |      shifts       |
                          +-------------------+
                          | id (PK)           |
                          | employee_id (FK)  |
                          | shift_category_id |
                          | shift_name        |
                          | start_time        |
                          | end_time          |
                          | days_of_week      |
                          | is_individual_ovr |
                          | effective_date    |
                          | is_active         |
                          | created_at        |
                          | updated_at        |
                          +-------------------+
                                   |
                                   | 1
                                   |
                                   | N
                                   v
                          +-------------------+
                          | attendance_records|
                          +-------------------+
                          | id (PK)           |
                          | employee_id (FK)  |
                          | biometric_device_id|
                          | clock_in          |
                          | clock_out         |
                          | clock_in_method   |
                          | clock_out_method  |
                          | shift_id (FK)     |
                          | is_late           |
                          | is_early_departure|
                          | notes             |
                          | auto_logged_out   |
                          | ip_address        |
                          | created_at        |
                          +-------------------+

+------------------+       +-------------------+
|   biometric_dev  |<------| attendance_records|
+------------------+       +-------------------+
| id (PK)          |       |
| device_name      |       |
| device_type      |       |
| ip_address (UK)  |       |
| port             |       |
| serial_number(UK)|       |
| location         |       |
| is_active        |       |
| last_sync        |       |
+------------------+       |

+------------------+       +-------------------+
|     hr_users     |<------|    audit_logs     |
+------------------+       +-------------------+
| id (PK)          |       | id (PK)           |
| username (UK)    |       | user_id (FK)      |
| email (UK)       |       | username          |
| password_hash    |       | action            |
| role             |       | entity_type       |
| failed_attempts  |       | entity_id         |
| locked_until     |       | ip_address        |
| last_login       |       | user_agent        |
| is_active        |       | before_state      |
| created_at       |       | after_state       |
| updated_at       |       | timestamp         |
+------------------+       +-------------------+
                                   |
                                   | 1
                                   |
                                   | N
                                   v
                          +-------------------+
                          |  payroll_exports  |
                          +-------------------+
                          | id (PK)           |
                          | export_type       |
                          | start_date        |
                          | end_date          |
                          | record_count      |
                          | file_path         |
                          | api_endpoint      |
                          | api_response      |
                          | status            |
                          | error_message     |
                          | exported_by (FK)  |
                          | exported_at       |
                          | created_at        |
                          +-------------------+
```

## Table Definitions

### 1. shift_categories
Defines shift templates that can be assigned to employees.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| category_name | VARCHAR(50) | UNIQUE, NOT NULL | Shift category name |
| description | TEXT | NULLABLE | Category description |
| start_time | TIME | NOT NULL | Shift start time |
| end_time | TIME | NOT NULL | Shift end time |
| days_of_week | VARCHAR(20) | NOT NULL | Comma-separated days (1=Mon, 7=Sun) |
| grace_period_minutes | INT | DEFAULT 15 | Minutes allowed before marked late |
| is_active | BOOLEAN | DEFAULT TRUE | Category active status |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE NOW | Last update time |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (category_name)
- INDEX (is_active)

### 2. biometric_devices
Registered biometric devices in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| device_name | VARCHAR(100) | NOT NULL | Device display name |
| device_type | ENUM | NOT NULL | face_recognition, rfid |
| ip_address | VARCHAR(45) | UNIQUE, NOT NULL | Device IP address |
| port | INT | DEFAULT 4370 | Device communication port |
| serial_number | VARCHAR(100) | UNIQUE, NULLABLE | Manufacturer serial number |
| location | VARCHAR(100) | NULLABLE | Physical device location |
| is_active | BOOLEAN | DEFAULT TRUE | Device active status |
| last_sync | TIMESTAMP | NULLABLE | Last successful sync time |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE NOW | Last update time |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (ip_address)
- INDEX (device_type)
- INDEX (is_active)

### 3. employees
Employee records with biometric data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| employee_id | VARCHAR(20) | UNIQUE, NOT NULL | Employee ID number |
| first_name | VARCHAR(50) | NOT NULL | First name |
| last_name | VARCHAR(50) | NOT NULL | Last name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| phone | VARCHAR(20) | NULLABLE | Phone number |
| department | VARCHAR(50) | NULLABLE | Department name |
| position | VARCHAR(50) | NULLABLE | Job position |
| hire_date | DATE | NOT NULL | Hire date |
| is_active | BOOLEAN | DEFAULT TRUE | Employee active status |
| face_data | TEXT | NULLABLE | Face recognition descriptor data (JSON string) |
| rfid_card | VARCHAR(50) | UNIQUE, NULLABLE | RFID card number |
| shift_category_id | INT | FK, NULLABLE | Default shift category |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE NOW | Last update time |

**Foreign Keys**:
- shift_category_id → shift_categories(id)

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (employee_id)
- UNIQUE INDEX (email)
- INDEX (department)
- INDEX (is_active)

### 4. shifts
Individual shift assignments (can override category).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| employee_id | INT | FK, NOT NULL | Assigned employee |
| shift_category_id | INT | FK, NULLABLE | Reference category |
| shift_name | VARCHAR(50) | NOT NULL | Shift display name |
| start_time | TIME | NOT NULL | Shift start time |
| end_time | TIME | NOT NULL | Shift end time |
| days_of_week | VARCHAR(20) | NOT NULL | Comma-separated days |
| is_individual_override | BOOLEAN | DEFAULT FALSE | Overrides category shift |
| effective_date | DATE | NOT NULL | Shift effective date |
| is_active | BOOLEAN | DEFAULT TRUE | Shift active status |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE NOW | Last update time |

**Foreign Keys**:
- employee_id → employees(id)
- shift_category_id → shift_categories(id)

**Indexes**:
- PRIMARY KEY (id)
- INDEX (employee_id)
- INDEX (shift_category_id)
- INDEX (is_active)
- INDEX (effective_date)

### 5. attendance_records
Immutable attendance tracking records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| employee_id | INT | FK, NOT NULL | Employee reference |
| biometric_device_id | INT | FK, NULLABLE | Device used for clock-in |
| clock_in | TIMESTAMP | NOT NULL | Clock-in time |
| clock_out | TIMESTAMP | NULLABLE | Clock-out time |
| clock_in_method | ENUM | NOT NULL | face_recognition, rfid, webauthn, manual |
| clock_out_method | ENUM | NULLABLE | face_recognition, rfid, webauthn, manual, auto |
| shift_id | INT | FK, NULLABLE | Shift reference |
| is_late | BOOLEAN | DEFAULT FALSE | Late arrival flag |
| is_early_departure | BOOLEAN | DEFAULT FALSE | Early departure flag |
| notes | TEXT | NULLABLE | Additional notes |
| auto_logged_out | BOOLEAN | DEFAULT FALSE | Auto-logout flag |
| ip_address | VARCHAR(45) | NULLABLE | Client IP address |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Foreign Keys**:
- employee_id → employees(id)
- biometric_device_id → biometric_devices(id)
- shift_id → shifts(id)

**Indexes**:
- PRIMARY KEY (id)
- INDEX (employee_id)
- INDEX (biometric_device_id)
- INDEX (clock_in)
- INDEX (clock_out)
- INDEX (shift_id)
- INDEX (auto_logged_out)

### 6. hr_users
HR administrator accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt password hash |
| role | ENUM | NOT NULL | HR_ADMIN, SYS_ADMIN |
| failed_login_attempts | INT | DEFAULT 0 | Failed login count |
| locked_until | TIMESTAMP | NULLABLE | Account lock expiry |
| last_login | TIMESTAMP | NULLABLE | Last successful login |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE NOW | Last update time |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (username)
- UNIQUE INDEX (email)
- INDEX (role)
- INDEX (is_active)

### 7. audit_logs
Complete audit trail for admin actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FK, NOT NULL | User who performed action |
| username | VARCHAR(50) | NOT NULL | Username of actor |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(50) | NOT NULL | Entity type affected |
| entity_id | INT | NULLABLE | Entity ID affected |
| ip_address | VARCHAR(45) | NOT NULL | Actor IP address |
| user_agent | TEXT | NULLABLE | Browser user agent |
| before_state | JSON | NULLABLE | State before change |
| after_state | JSON | NULLABLE | State after change |
| timestamp | TIMESTAMP | NOT NULL | Action timestamp |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Foreign Keys**:
- user_id → hr_users(id)

**Indexes**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (action)
- INDEX (entity_type)
- INDEX (timestamp)

### 8. payroll_exports
Payroll export history and tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| export_type | ENUM | NOT NULL | csv, api_push |
| start_date | DATE | NOT NULL | Export start date |
| end_date | DATE | NOT NULL | Export end date |
| record_count | INT | DEFAULT 0 | Number of records |
| file_path | VARCHAR(255) | NULLABLE | CSV file path |
| api_endpoint | VARCHAR(255) | NULLABLE | API endpoint used |
| api_response | JSON | NULLABLE | API response data |
| status | ENUM | DEFAULT pending | pending, completed, failed |
| error_message | TEXT | NULLABLE | Error details |
| exported_by | INT | FK, NOT NULL | User who initiated export |
| exported_at | TIMESTAMP | NOT NULL | Export timestamp |
| created_at | TIMESTAMP | DEFAULT NOW | Record creation time |

**Foreign Keys**:
- exported_by → hr_users(id)

**Indexes**:
- PRIMARY KEY (id)
- INDEX (export_type)
- INDEX (status)
- INDEX (exported_by)
- INDEX (exported_at)

## Data Integrity

### Constraints
- All foreign keys enforced with ON DELETE RESTRICT
- Unique constraints on all natural keys
- NOT NULL constraints on all required fields
- ENUM constraints for enumerated fields

### Normalization
- Database follows Third Normal Form (3NF)
- No transitive dependencies
- All non-key attributes depend only on the primary key
- All tables have a single-purpose design

## Security Considerations

### Password Storage
- Passwords hashed using bcrypt with work factor 12
- Salt included in bcrypt hash
- Plain text passwords never stored

### Sensitive Data
- Biometric templates stored as encrypted text
- RFID card numbers stored with access controls
- Audit logs track all data access

### Audit Trail
- All admin actions logged with:
  - User identity
  - IP address
  - Timestamp
  - Before/after state for modifications

## Performance Optimization

### Indexes
- All foreign keys indexed
- Unique constraints indexed
- Frequently queried columns indexed
- Composite indexes for common query patterns

### Connection Pooling
- Sequelize connection pool configured
- Max 10 connections
- Min 0 connections
- 30 second acquire timeout
- 10 second idle timeout

## Backup Strategy

### Backup Schedule
- Daily full backups at 2:00 AM UTC
- Hourly incremental backups
- Transaction log backups every 15 minutes

### Retention Policy
- Daily backups retained for 30 days
- Weekly backups retained for 12 weeks
- Monthly backups retained for 12 months
