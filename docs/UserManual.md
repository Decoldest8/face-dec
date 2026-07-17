# User Manual - Biometric Employee Log System
## Vitality Hospital

## Table of Contents
1. [Getting Started](#getting-started)
2. [Login](#login)
3. [Dashboard](#dashboard)
4. [Employee Management](#employee-management)
5. [Shift Configuration](#shift-configuration)
6. [Attendance Reports](#attendance-reports)
7. [Payroll Export](#payroll-export)
8. [Biometric Terminal](#biometric-terminal)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Valid user credentials (provided by IT department)

### Accessing the System
1. Open your web browser
2. Navigate to: `https://biometric.vitalityhospital.com`
3. Enter your username and password
4. Click "Sign In"

### First-Time Login
1. Contact IT department to receive your credentials
2. Change your password immediately after first login
3. Review your profile information
4. Familiarize yourself with the dashboard

---

## Login

### How to Login
1. Enter your username in the "Username" field
2. Enter your password in the "Password" field
3. Click the "Sign In" button

### Account Lockout
- After 5 failed login attempts, your account will be locked for 15 minutes
- Contact IT department if you need immediate access
- Wait for the lockout period to expire before trying again

### Forgot Password
- Contact IT department to reset your password
- Do not share your password with anyone
- Change your password regularly

### Logout
1. Click the "Logout" button in the top-right corner
2. You will be redirected to the login page
3. Always logout when finished using the system

---

## Dashboard

### Overview
The dashboard provides a quick overview of attendance statistics and system status.

### Dashboard Components

#### Statistics Cards
- **Total Employees**: Number of active employees in the system
- **Active Today**: Number of employees scheduled to work today
- **Present Today**: Number of employees who have clocked in today
- **Late Today**: Number of employees who arrived late today

#### Quick Actions
- **Clock In Employee**: Quick access to clock in an employee
- **Clock Out Employee**: Quick access to clock out an employee
- **View Today's Attendance**: Navigate to today's attendance report

#### System Status
- **Database**: Shows database connection status
- **Biometric Devices**: Shows device online status
- **Auto-Logout Engine**: Shows scheduler running status

### Navigation
Use the sidebar menu to navigate to different sections:
- Dashboard
- Employee Management
- Shift Configuration
- Attendance Reports
- Payroll Export
- Biometric Terminal

---

## Employee Management

### Overview
Manage employee records including creation, updates, and deactivation.

### Adding a New Employee

1. Click "Add Employee" button
2. Fill in the required fields:
   - **Employee ID**: Unique identifier (e.g., EMP001)
   - **Email**: Employee email address
   - **First Name**: Employee's first name
   - **Last Name**: Employee's last name
   - **Department**: Employee's department
   - **Position**: Employee's job position
   - **Phone**: Contact phone number
   - **Hire Date**: Date of employment
3. Click "Create Employee"
4. The employee will be added to the system

### Editing an Employee

1. Locate the employee in the employee list
2. Click the edit icon (pencil) in the Actions column
3. Modify the desired fields
4. Click "Update Employee"
5. Changes will be saved immediately

### Deactivating an Employee

1. Locate the employee in the employee list
2. Click the edit icon (pencil) in the Actions column
3. Uncheck the "Active" checkbox
4. Click "Update Employee"
5. The employee will no longer be able to clock in

### Deleting an Employee

1. Locate the employee in the employee list
2. Click the delete icon (trash) in the Actions column
3. Confirm the deletion
4. The employee record will be permanently removed

**Note**: Deleting an employee will also delete their attendance history. Use deactivation instead if you want to preserve records.

### Biometric Data
- Biometric templates are registered at the biometric device
- RFID cards are assigned during employee creation
- Contact IT department for biometric registration

---

## Shift Configuration

### Overview
Configure shift categories and assign individual shifts to employees.

### Shift Categories
Shift categories are templates that define standard shift times.

#### Creating a Shift Category
1. Navigate to Shift Configuration
2. Click "Add Shift Category"
3. Fill in the details:
   - **Category Name**: Name of the shift (e.g., Morning Shift)
   - **Description**: Description of the shift
   - **Start Time**: Shift start time
   - **End Time**: Shift end time
   - **Days of Week**: Comma-separated days (1=Monday, 7=Sunday)
   - **Grace Period**: Minutes allowed before marked late
4. Click "Save"

### Individual Shifts
Individual shifts can override the category shift for specific employees.

#### Assigning an Individual Shift
1. Click "Add Shift"
2. Select the employee
3. Optionally select a shift category as a template
4. Configure the shift details:
   - **Shift Name**: Display name for the shift
   - **Start Time**: Shift start time
   - **End Time**: Shift end time
   - **Days of Week**: Comma-separated days
   - **Individual Override**: Check to override category shift
5. Click "Save Shift"

### Shift Resolution Logic
1. System checks for individual shift override
2. If individual override exists, it takes precedence
3. If no individual override, category shift is used
4. If neither exists, no shift is assigned

---

## Attendance Reports

### Overview
View and export attendance data for payroll and management purposes.

### Daily Report

1. Navigate to Attendance Reports
2. Select "Daily Report" from the dropdown
3. Select the date using the date picker
4. The report will display automatically

### Weekly Report

1. Navigate to Attendance Reports
2. Select "Weekly Report" from the dropdown
3. Select the start date
4. Select the end date
5. The report will display automatically

### Report Columns
- **Employee ID**: Unique employee identifier
- **Employee Name**: Full name of the employee
- **Department**: Employee's department
- **Clock In**: Time the employee clocked in
- **Clock Out**: Time the employee clocked out
- **Method**: Method used (fingerprint, RFID, manual)
- **Late**: Indicates if arrival was late
- **Early**: Indicates if departure was early

### Exporting to CSV

1. Select the desired date range
2. Click the "Export CSV" button
3. The CSV file will download automatically
4. Open the file in Excel or similar application

### Interpreting Indicators
- **Late (Yes)**: Employee arrived after the grace period
- **Early (Yes)**: Employee departed before shift end time
- **Method**: Shows how the employee clocked in/out

---

## Payroll Export

### Overview
Export payroll data for integration with the payroll system.

### CSV Export

1. Navigate to Payroll Export
2. Select the start date
3. Select the end date
4. Select "CSV Download" as the export type
5. Click "Export CSV"
6. The file will download automatically

### API Push

1. Navigate to Payroll Export
2. Select the start date
3. Select the end date
4. Select "API Push" as the export type
5. Click "Push to Payroll API"
6. The system will send data to the payroll API
7. Check the status in the export history

### Export History
View all previous exports including:
- Export ID
- Export type
- Date range
- Number of records
- Status (pending, completed, failed)
- Export timestamp

### Export Status
- **Pending**: Export is being processed
- **Completed**: Export was successful
- **Failed**: Export encountered an error

### Data Included
Only closed sessions (where clock_out is not null) are included in payroll exports.

---

## Biometric Terminal

### Overview
Terminal interface for employees to clock in and out using biometric devices.

### Clocking In

1. Enter your Employee ID in the input field
2. Click "Clock In" or press Enter
3. Place your finger on the biometric scanner
4. Wait for confirmation message
5. Your clock-in time will be recorded

### Clocking Out

1. Enter your Employee ID in the input field
2. Click "Clock Out"
3. Place your finger on the biometric scanner
4. Wait for confirmation message
5. Your clock-out time will be recorded

### Using RFID Card

1. Present your RFID card to the reader
2. The system will automatically detect your employee ID
3. Click "Clock In" or "Clock Out"
4. Your time will be recorded

### Error Messages

#### "Employee not found"
- Check that your Employee ID is correct
- Contact HR if your ID is not recognized

#### "Already clocked in today"
- You have already clocked in today
- Use "Clock Out" to end your shift

#### "No active clock-in record"
- You have not clocked in today
- Use "Clock In" to start your shift

### Late Arrival
If you arrive after your shift start time plus the grace period:
- The system will mark you as late
- A notification will be displayed
- Contact your supervisor if this was an error

### Early Departure
If you leave before your shift end time:
- The system will mark it as early departure
- A notification will be displayed
- Contact your supervisor if this was authorized

---

## Troubleshooting

### Common Issues

#### Cannot Login
- Verify your username and password are correct
- Check if your account is locked (wait 15 minutes)
- Contact IT department if issue persists

#### Biometric Device Not Working
- Check device power and network connection
- Ensure device IP is configured correctly
- Contact IT department for device support

#### Cannot Clock In/Out
- Verify your Employee ID is correct
- Check that you are not already clocked in/out
- Ensure your account is active
- Contact HR if issue persists

#### Reports Not Loading
- Refresh the page
- Check your internet connection
- Try a different date range
- Contact IT if issue persists

#### Export Fails
- Verify date range is valid
- Check that records exist for the period
- Ensure payroll API is accessible (for API push)
- Contact IT if issue persists

### Error Codes

#### 401 Unauthorized
- Your session has expired
- Login again to continue

#### 403 Forbidden
- You don't have permission for this action
- Contact your supervisor or IT

#### 404 Not Found
- The requested resource doesn't exist
- Check the URL or contact IT

#### 409 Conflict
- Duplicate action (e.g., already clocked in)
- Check your current status

#### 500 Internal Server Error
- Server encountered an error
- Contact IT department

### Browser Issues

#### Page Not Loading
- Clear browser cache
- Disable browser extensions
- Try a different browser
- Check internet connection

#### Buttons Not Working
- Enable JavaScript
- Disable popup blockers
- Update browser to latest version

---

## FAQ

### General Questions

**Q: What happens if I forget to clock out?**
A: The auto-logout engine will automatically clock you out at 11:59:59 PM on the day you clocked in. This will be marked as an auto-logout in the system.

**Q: Can I clock in from home?**
A: No, clock in/out must be done at the biometric terminal on hospital premises. GPS attendance for off-site staff is planned for Phase 2.

**Q: How do I correct a mistake in my attendance?**
A: Contact HR or your supervisor. They can review and correct attendance records if necessary.

**Q: What if the face recognition doesn't recognize me?**
A: You can use your RFID card as a backup. If neither works, contact IT to re-register your face data.

**Q: How long are attendance records kept?**
A: Attendance records are kept indefinitely for audit and payroll purposes.

### Security Questions

**Q: Is my biometric data secure?**
A: Yes, biometric templates are encrypted at rest and transmitted securely. Only authorized personnel can access this data.

**Q: What happens if I lose my RFID card?**
A: Report it to IT immediately. They will deactivate the card and issue a replacement.

**Q: Can someone else clock in for me?**
A: No, this is a serious policy violation. The system tracks IP addresses and device usage. Violations will be investigated.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.

**Q: Do I need to install any software?**
A: No, the system is web-based. Just use a modern web browser.

**Q: Can I access the system from my mobile phone?**
A: Yes, the system is mobile-responsive. A dedicated mobile app is planned for Phase 2.

**Q: What if the internet goes down?**
A: Biometric devices have offline mode. Data will sync when connection is restored. The web interface requires internet access.

### HR Questions

**Q: How do I add a new employee?**
A: See the Employee Management section of this manual.

**Q: How do I change an employee's shift?**
A: See the Shift Configuration section of this manual.

**Q: Can I export attendance data for external reporting?**
A: Yes, use the CSV export feature in Attendance Reports.

**Q: How do I integrate with our payroll system?**
A: Use the API Push feature in Payroll Export or configure automated exports. Contact IT for API documentation.

---

## Contact Information

### IT Department
- **Email**: it@vitalityhospital.com
- **Phone**: ext. 1234
- **Location**: IT Department, 2nd Floor

### HR Department
- **Email**: hr@vitalityhospital.com
- **Phone**: ext. 5678
- **Location**: HR Department, 1st Floor

### Emergency Support
- **After Hours**: Contact hospital operator
- **Critical Issues**: Page IT on-call staff

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial release |
