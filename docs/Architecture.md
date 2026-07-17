# System Architecture - Biometric Employee Log System

## Overview
The Biometric Employee Log System follows a layered architecture pattern with clear separation of concerns. The system is built using Node.js/Express.js for the backend API and React for the frontend, with MySQL 8.0 as the primary database.

## Architecture Layers

### 1. Presentation Layer (Frontend)
**Technology Stack**: React 18, Vite, Tailwind CSS, React Router

**Components**:
- **Pages**: Login, Dashboard, Employee Management, Shift Configuration, Attendance Reports, Payroll Export, Biometric Terminal
- **UI Components**: Navbar, Sidebar, ReportTable, ShiftForm
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router v6 with protected routes
- **Styling**: Tailwind CSS with custom royal blue and orange theme
- **API Client**: Axios with request/response interceptors

**Responsibilities**:
- Render user interface
- Handle user interactions
- Manage client-side state
- Communicate with backend API
- Implement authentication flow

### 2. Application Layer (Backend API)
**Technology Stack**: Express.js, Node.js 20 LTS

**Components**:
- **Controllers**: AuthController, EmployeeController, ShiftController, AttendanceController, PayrollController
- **Middleware**: authMiddleware, roleMiddleware, rate limiting, CORS, Helmet.js
- **Routes**: RESTful API endpoints for all resources
- **Services**: Business logic implementation
- **Scheduler**: node-cron for auto-logout engine

**Responsibilities**:
- Process HTTP requests
- Implement business logic
- Coordinate data access
- Enforce security policies
- Handle authentication and authorization

### 3. Data Access Layer
**Technology Stack**: Sequelize ORM, MySQL 8.0

**Components**:
- **Models**: Employee, Shift, AttendanceRecord, HRUser, AuditLog, PayrollExport, ShiftCategory, BiometricDevice
- **Associations**: Model relationships and foreign keys
- **Queries**: Database operations through Sequelize
- **Transactions**: Data consistency management

**Responsibilities**:
- Abstract database operations
- Manage model relationships
- Ensure data integrity
- Handle database connections
- Implement caching strategies

### 4. Integration Layer
**Technology Stack**: ZKTeco SDK, Axios, WebAuthn

**Components**:
- **Biometric Device Integration**: ZKTeco SDK for face recognition/RFID
- **WebAuthn Integration**: Browser biometric authentication fallback
- **Payroll API Integration**: REST API client for payroll system
- **CSV Export**: File generation and download

**Responsibilities**:
- Communicate with external systems
- Handle device connections
- Process biometric data
- Manage API integrations

### 5. Security Layer
**Technology Stack**: JWT, bcrypt, Helmet.js, express-rate-limit

**Components**:
- **Authentication**: JWT token generation and validation
- **Password Security**: bcrypt hashing (work factor 12)
- **Rate Limiting**: Request throttling on authentication endpoints
- **Security Headers**: Helmet.js for HTTP security headers
- **Account Lockout**: Failed login attempt tracking
- **Audit Logging**: Complete audit trail for admin actions

**Responsibilities**:
- Protect against unauthorized access
- Secure sensitive data
- Prevent common attacks (XSS, CSRF, injection)
- Monitor and log security events

## Component Communication

### Request Flow
```
Client (React)
    ↓ HTTP Request
API Gateway (Express)
    ↓ Authentication
Middleware Layer
    ↓ Authorization
Controller Layer
    ↓ Business Logic
Service Layer
    ↓ Data Access
Sequelize ORM
    ↓ SQL Query
MySQL Database
    ↓ Result
Sequelize ORM
    ↓ Data Transformation
Service Layer
    ↓ Response Preparation
Controller Layer
    ↓ HTTP Response
Client (React)
```

### Biometric Device Flow
```
Biometric Device
    ↓ TCP/IP
ZKTeco SDK
    ↓ Device Data
Attendance Controller
    ↓ Validation
Attendance Record
    ↓ Persistence
Database
```

### Auto-Logout Flow
```
node-cron Scheduler
    ↓ Every Minute
Auto-Logout Engine
    ↓ Query Unclosed Records
Database
    ↓ Records
Auto-Logout Engine
    ↓ Date Comparison
    ↓ Update Records
Database
    ↓ Audit Log
Audit Log
```

## Technology Stack Details

### Backend Technologies

#### Core Framework
- **Node.js 20 LTS**: Runtime environment
- **Express.js 4.18**: Web framework
- **Sequelize 6.35**: ORM for database operations

#### Security
- **jsonwebtoken 9.0**: JWT token generation/validation
- **bcryptjs 2.4**: Password hashing
- **helmet 7.1**: Security headers
- **express-rate-limit 7.1**: Rate limiting
- **cors 2.8**: Cross-origin resource sharing

#### Utilities
- **dotenv 16.3**: Environment variable management
- **winston 3.11**: Logging
- **node-cron 3.0**: Scheduled tasks
- **@simplewebauthn/server 8.3**: WebAuthn implementation

#### Testing
- **jest 29.7**: Unit testing framework
- **supertest 6.3**: HTTP assertion library

### Frontend Technologies

#### Core Framework
- **React 18**: UI library
- **Vite 5.0**: Build tool and dev server
- **React Router 6.21**: Client-side routing

#### Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **PostCSS 8.4**: CSS post-processor
- **Autoprefixer 10.4**: CSS vendor prefixing

#### Utilities
- **Axios 1.6**: HTTP client
- **Lucide React 0.303**: Icon library

### Database Technologies

#### Database Server
- **MySQL 8.0**: Relational database management system
- **InnoDB Engine**: Transactional storage engine
- **UTF8MB4 Encoding**: Full Unicode support

#### Database Features
- **Foreign Keys**: Referential integrity
- **Indexes**: Query optimization
- **Transactions**: ACID compliance
- **Stored Procedures**: Server-side logic (future)

## Deployment Architecture

### Development Environment
```
Local Development Machine
├── Backend Server (Port 5000)
├── Frontend Dev Server (Port 5173)
├── MySQL Database (Port 3306)
└── Biometric Device Simulator
```

### Production Environment
```
Load Balancer (Nginx)
├── Backend Server 1 (Node.js)
├── Backend Server 2 (Node.js)
└── Backend Server 3 (Node.js)
    ↓
MySQL Master-Slave Replication
├── Master Database (Read/Write)
├── Slave Database 1 (Read Only)
└── Slave Database 2 (Read Only)
    ↓
Biometric Devices Network
├── Device 1 (Main Entrance)
├── Device 2 (Staff Room)
└── Device 3 (Emergency Room)
```

### Docker Deployment
```
Docker Compose
├── MySQL Container
├── Backend Container
├── Frontend Container
└── Nginx Reverse Proxy
```

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Server validates credentials
3. Server generates JWT token (8-hour expiry)
4. Server returns token to client
5. Client stores token in localStorage
6. Client includes token in Authorization header
7. Server validates token on each request
8. Server grants/denies access based on role
```

### Authorization Model
```
HR_ADMIN Role:
├── Employee Management (CRUD)
├── Shift Management (CRUD)
├── Attendance Reports (Read)
└── Payroll Export (Execute)

SYS_ADMIN Role:
├── All HR_ADMIN permissions
├── User Account Management
├── System Configuration
└── Audit Log Access
```

### Data Protection
- **Passwords**: bcrypt hashed (work factor 12)
- **Biometric Data**: Encrypted at rest
- **API Communication**: HTTPS/TLS 1.2+
- **Database**: Encrypted connections
- **Audit Logs**: Immutable records

## Scalability Considerations

### Horizontal Scaling
- Stateless backend servers
- Session data in JWT tokens
- Database connection pooling
- Load balancer for request distribution

### Vertical Scaling
- Optimized database queries
- Indexed frequently accessed columns
- Caching layer (Redis - future)
- Database read replicas

### Performance Optimization
- Database query optimization
- API response caching
- Static asset CDN (future)
- Image optimization (future)

## Monitoring and Logging

### Application Logging
- Winston logger with multiple transports
- Log levels: error, warn, info, debug
- File-based logging with rotation
- Console logging in development

### Error Tracking
- Centralized error logging
- Stack trace capture
- Error context preservation
- Alert integration (future)

### Performance Monitoring
- API response time tracking
- Database query performance
- Memory usage monitoring
- CPU utilization tracking (future)

## Future Architecture Enhancements

### Phase 2 Enhancements
- Redis caching layer
- Message queue for async processing
- Microservices decomposition
- GraphQL API alternative

### Phase 3 Enhancements
- Kubernetes orchestration
- Service mesh (Istio)
- Distributed tracing
- Advanced monitoring (Prometheus/Grafana)

## Design Patterns Used

### Backend Patterns
- **MVC Pattern**: Separation of concerns
- **Repository Pattern**: Data access abstraction
- **Middleware Pattern**: Request processing pipeline
- **Factory Pattern**: Object creation
- **Singleton Pattern**: Database connection

### Frontend Patterns
- **Component Pattern**: Reusable UI components
- **Container Pattern**: State management
- **Higher-Order Components**: Logic reuse
- **Custom Hooks**: Stateful logic extraction

## API Design Principles

### RESTful Design
- Resource-based URLs
- HTTP methods for operations (GET, POST, PUT, DELETE)
- Status codes for responses
- JSON for data exchange
- HATEOAS (future)

### API Versioning
- URL-based versioning (/api/v1/)
- Backward compatibility
- Deprecation policy
- Migration guides

### Error Handling
- Consistent error response format
- HTTP status codes
- Error codes and messages
- Stack traces in development only
