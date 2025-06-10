# Multi-Disease Platform - Development Guide

## 🎯 Project Overview

A comprehensive multi-disease, multi-entity, and multilingual platform for remote treatment monitoring with automated rule-based workflows and task management.

## 👥 User Roles & Permissions

### Role Hierarchy

1. **SUPERADMIN**
   - Full system access
   - Create organizations (hospitals/service desks)
   - Create employee-admins for organizations
   - Add treatments for diseases
   - Manage all questionnaires and measurement groups
   - System configuration and monitoring

2. **HEALTHCARE_PROVIDER_ADMIN (HCPA)**
   - Organization-level administration
   - Manage healthcare providers within organization
   - Create questionnaires and measurement groups
   - Manage patient assignments
   - View organization analytics

3. **SERVICE_DESK_ADMIN (SDA)**
   - Service desk administration
   - Support multiple hospital organizations
   - Create questionnaires and measurement groups
   - Manage service desk employees
   - Handle support tickets and issues

4. **DOCTOR (HCP)**
   - Patient management and care
   - Treatment planning and monitoring
   - View patient data and analytics
   - Assign tasks and treatments
   - Communication with patients and caregivers

5. **SERVICE_DESK_EMPLOYEE**
   - Technical support and assistance
   - Handle user issues and requests
   - Monitor system performance
   - Escalate complex issues to admins

6. **PATIENT**
   - Self-monitoring and data entry
   - Complete assigned tasks and questionnaires
   - View personal health data
   - Communicate with healthcare providers
   - Receive notifications and alerts

## 🏗️ Core Features

### 1. Two-Factor Authentication (2FA)
- TOTP-based authentication using apps like Google Authenticator
- Backup recovery codes for account recovery
- Mandatory for admin roles, optional for others
- SMS/Email fallback options

### 2. Organization Management

#### Hospital Organizations
- Created by SUPERADMIN only
- Must be linked to exactly one Service Desk
- Contains departments and healthcare providers
- Manages patient populations

#### Service Desk Organizations
- Created by SUPERADMIN only
- Can support multiple hospitals
- Provides technical and operational support
- Manages system issues and user assistance

### 3. Treatment System

#### Disease-Based Treatments
- SUPERADMIN can add new treatments for diseases
- Each treatment can have multiple questionnaires and measurement groups
- Reusable across multiple patients and conditions
- Configurable protocols and guidelines

#### Questionnaires
- Created by SUPERADMIN, SDA, or HCPA
- Belong to specific treatments
- Can be reused across multiple treatments
- Dynamic question types (text, multiple choice, scale, etc.)
- Conditional logic and branching

#### Measurement Groups
- Created by SUPERADMIN, SDA, or HCPA
- Define sets of vital signs or metrics to track
- Belong to treatments but reusable
- Support various measurement types (numeric, boolean, categorical)
- Integration with medical devices

### 4. Automated Workflows
- Rule-based task assignment
- Automated alerts and notifications
- Workflow triggers based on patient data
- Escalation procedures for critical values

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd multidisease-platform
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Environment Configuration**
   ```bash
   cp packages/backend/env.example packages/backend/.env
   # Edit .env file with your configuration
   ```

3. **Database Setup**
   ```bash
   cd packages/backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start Development**
   ```bash
   # Option 1: Use the development script
   ./scripts/dev.sh
   
   # Option 2: Manual start
   npm run dev
   ```

### Development Workflow

#### Database Changes
```bash
# Create new migration
cd packages/backend
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

#### Running Tests
```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests  
cd packages/frontend
npm test

# All tests
npm test
```

#### Code Quality
```bash
# Lint and fix
npm run lint:fix

# Type checking
npm run type-check

# Build for production
npm run build
```

## 📊 API Structure

### Authentication Endpoints
- `POST /api/auth/login` - User login with 2FA support
- `POST /api/auth/register` - User registration  
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA token
- `POST /api/auth/logout` - User logout

### Organization Management
- `GET /api/organizations` - List organizations (filtered by type)
- `POST /api/organizations` - Create organization (SUPERADMIN only)
- `GET /api/organizations/service-desks` - List service desks for assignment
- `PUT /api/organizations/:id` - Update organization

### Treatment Management
- `GET /api/treatments` - List treatments by disease
- `POST /api/treatments` - Create treatment (SUPERADMIN only)
- `PUT /api/treatments/:id` - Update treatment
- `POST /api/treatments/:id/questionnaires` - Assign questionnaire
- `POST /api/treatments/:id/measurement-groups` - Assign measurement group

### Questionnaire Management
- `GET /api/questionnaires` - List questionnaires
- `POST /api/questionnaires` - Create questionnaire (SUPERADMIN, SDA, HCPA)
- `PUT /api/questionnaires/:id` - Update questionnaire
- `POST /api/questionnaires/:id/responses` - Submit patient response

### User Management
- `GET /api/users` - List users (role-filtered)
- `POST /api/users` - Create user account
- `PUT /api/users/:id/roles` - Assign user roles
- `GET /api/users/me` - Current user profile

## 🔒 Security Considerations

### Authentication & Authorization
- JWT tokens with role-based access control
- 2FA enforcement for administrative roles
- Session management with Redis
- Password complexity requirements

### Data Protection
- HIPAA-compliant data handling
- End-to-end encryption for sensitive data
- Audit logging for all data access
- Data anonymization for analytics

### API Security
- Rate limiting per endpoint
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

## 🚀 Deployment

### Development
```bash
# Local development with hot reload
npm run dev

# Database services only
docker-compose up -d postgres redis
```

### Production
```bash
# Full production deployment
docker-compose -f docker-compose.prod.yml up -d

# Or individual services
docker-compose up -d
```

### Environment Variables
Key environment variables for production:
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT signing
- `REDIS_URL` - Redis connection string
- `CORS_ORIGIN` - Allowed frontend origins

## 📝 Data Models

### Key Relationships
- Organizations (Hospital) → Service Desk (1:1)
- Organizations → Users (Many:Many with roles)
- Treatments → Questionnaires (Many:Many)
- Treatments → Measurement Groups (Many:Many)
- Patients → Questionnaire Responses (1:Many)
- Users → 2FA Settings (1:1)

### Role Permissions Matrix

| Feature | SUPERADMIN | HCPA | SDA | DOCTOR | SD_EMPLOYEE | PATIENT |
|---------|------------|------|-----|---------|-------------|---------|
| Create Organizations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Treatments | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Questionnaires | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Measurement Groups | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Patients | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit Responses | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🧪 Testing Strategy

### Unit Tests
- Service layer business logic
- Utility functions
- React components

### Integration Tests  
- API endpoints
- Database operations
- Authentication flows

### End-to-End Tests
- User workflows
- Multi-role scenarios
- Critical paths

## 📈 Monitoring & Analytics

### Application Monitoring
- Prometheus metrics collection
- Grafana dashboards
- Winston logging
- Error tracking

### Health Checks
- Database connectivity
- Redis availability
- External service status
- Memory/CPU usage

### Business Metrics
- User engagement
- Treatment adherence
- System utilization
- Performance indicators 