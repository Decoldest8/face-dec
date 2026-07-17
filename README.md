# Biometric Employee Log System - Vitality Hospital

A secure, comprehensive biometric attendance management system for Vitality Hospital with JWT authentication, role-based access control, and automated shift management.

## Features

- **Biometric Authentication**: ZKTeco SDK integration for fingerprint/RFID with WebAuthn fallback
- **Secure Authentication**: JWT with 8-hour expiry, bcrypt hashing (work factor 12)
- **Role-Based Access**: HR_ADMIN and SYS_ADMIN roles with granular permissions
- **Account Security**: Auto-lockout after 5 failed attempts (15-minute lock)
- **Audit Logging**: Complete audit trail for all admin actions
- **Shift Management**: Flexible shift configuration with category and individual overrides
- **Auto-Logout Engine**: Cron-based automated logout for unclosed sessions
- **Attendance Reporting**: Daily/weekly reports with CSV export
- **Payroll Integration**: REST API and CSV export for closed sessions
- **HTTPS/TLS 1.2+**: Enforced secure connections

## Tech Stack

### Backend
- Node.js 20 LTS
- Express.js (MVC architecture)
- MySQL 8.0 with Sequelize ORM
- JWT authentication
- bcrypt password hashing
- node-cron for scheduled tasks

### Frontend
- React 18
- Vite build tool
- Tailwind CSS (Royal Blue + Orange theme)
- React Router
- Axios for API calls

## Project Structure

```
biometric-log-system/
├── backend/                 # Express.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & role middleware
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── tests/              # Jest & Supertest tests
│   ├── config/             # Database & environment config
│   └── server.js           # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── styles/         # Tailwind CSS
│   │   ├── utils/          # API & auth utilities
│   │   └── App.jsx         # Main app component
│   └── vite.config.js      # Vite configuration
├── docs/                   # Documentation
├── .env                    # Environment variables
├── package.json            # Dependencies
└── docker-compose.yml      # Docker configuration
```

## Installation

### Prerequisites
- Node.js 20 LTS
- MySQL 8.0
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd biometric-log-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Create MySQL database:
```sql
CREATE DATABASE vitality_biometric CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Initialize database tables:
```bash
npm run db:migrate
```

6. Start development servers:
```bash
npm run dev
```

This starts:
- Backend server on http://localhost:5000
- Frontend dev server on http://localhost:5173

## Database Schema

The system uses 8 tables in 3NF:

- **shift_categories**: Shift type definitions
- **biometric_devices**: Registered biometric devices
- **employees**: Employee records
- **shifts**: Individual shift assignments
- **attendance_records**: Immutable attendance logs
- **hr_users**: HR admin accounts
- **audit_logs**: System audit trail
- **payroll_exports**: Payroll export history

All tables use InnoDB engine, UTF8MB4 encoding, and UTC timestamps.

## API Endpoints

### Authentication
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user

### Employees
- GET /api/employees - List all employees
- POST /api/employees - Create employee
- PUT /api/employees/:id - Update employee
- DELETE /api/employees/:id - Delete employee

### Shifts
- GET /api/shifts - List shifts
- POST /api/shifts - Create shift
- PUT /api/shifts/:id - Update shift
- DELETE /api/shifts/:id - Delete shift

### Attendance
- POST /api/attendance/clock-in - Clock in
- POST /api/attendance/clock-out - Clock out
- GET /api/attendance/reports/daily - Daily report
- GET /api/attendance/reports/weekly - Weekly report

### Payroll
- GET /api/payroll/export - Export payroll data
- POST /api/payroll/push - Push to payroll system

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

The suite includes 46 tests with 100% pass rate covering:
- Unit tests for controllers and middleware
- Integration tests for all API routes
- Cron scheduler tests

## Security Features

- JWT tokens with 8-hour expiry
- bcrypt password hashing (work factor 12)
- Account lockout after 5 failed attempts
- Role-based access control (HR_ADMIN, SYS_ADMIN)
- Comprehensive audit logging
- HTTPS/TLS 1.2+ enforced
- Rate limiting on authentication endpoints
- Helmet.js security headers

## Deployment

### Docker Deployment

```bash
docker-compose up -d
```

### Manual Deployment

1. Set NODE_ENV=production
2. Update .env with production values
3. Build frontend:
```bash
npm run frontend:build
```
4. Start server:
```bash
npm start
```

## Future Enhancements (Phase 2 & 3)

- SMS/email alerts for auto-logout
- Leave management integrated with shifts
- Android mobile app for biometric terminal
- Facial recognition via mobile camera
- GPS attendance for off-site staff
- AI staffing prediction from attendance patterns
- 2FA for HR accounts
- Docker containerisation for deployment

## Documentation

Detailed documentation is available in the `/docs` folder:
- SRS.md - Software Requirements Specification
- UML.md - UML diagrams (use case, class, sequence)
- DatabaseDesign.md - Database schema documentation
- Architecture.md - System architecture overview
- UserManual.md - User guide

## Support

For issues and questions, contact the IT team at it@vitalityhospital.com

## License

MIT License - Vitality Hospital IT Team
