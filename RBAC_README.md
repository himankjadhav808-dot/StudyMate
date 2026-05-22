# StudyMate RBAC Implementation

## Overview
This implementation adds comprehensive Role-Based Access Control (RBAC) with admin approval workflow to the StudyMate application.

## Features Implemented

### 1. Role-Based Schema
- Updated `Learner` model with `role` field: `'user'`, `'admin'`, `'admin_pending'`
- Default role: `'user'`

### 2. Authentication Flow
- **User Signup**: `/signup/user` → Creates user with role `'user'`
- **Admin Signup**: `/signup/admin` → Creates user with role `'admin_pending'`
- JWT includes role information
- Session verification sets role in frontend context

### 3. Middleware & Security
- `middleware/rbac.js`: JWT verification and role-based access control
- `isAdmin` middleware protects all `/api/admin/*` routes
- Frontend checks role before rendering protected components

### 4. Admin Approval System
- **Super Admin**: Pre-created account (admin@studymate.com / SuperAdmin@123)
- **Approval Dashboard**: `/dashboard` for admins shows pending requests
- **API Endpoints**:
  - `GET /api/admin/requests`: Fetch pending admin requests
  - `POST /api/admin/approve/:userId`: Approve admin request
  - `POST /api/admin/reject/:userId`: Reject admin request

### 5. Frontend Components
- **AuthSelection**: Landing page with user/admin account selection
- **AdminPending**: Page shown to users with `'admin_pending'` role
- **AdminApprovalDashboard**: Super admin dashboard for managing requests
- **Updated Signup/Login**: Support for account type selection

### 6. Role-Based Redirection
- `'user'` → Student dashboard with exam features
- `'admin'` → Admin approval dashboard + admin panel
- `'admin_pending'` → Waiting for approval page

## Setup Instructions

### 1. Database Setup
```bash
cd server
node setupSuperAdmin.js
```

### 2. Environment Variables
Ensure `.env` includes:
```
SUPER_ADMIN_EMAIL=admin@studymate.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

### 3. Start Application
```bash
# Backend
cd server
npm start

# Frontend (new terminal)
cd client
npm run dev
```

## Usage Flow

### For Students
1. Visit `/auth-select`
2. Choose "Student Account"
3. Signup/Login as normal user
4. Access student features

### For Admins
1. Visit `/auth-select`
2. Choose "Admin Account"
3. Request admin access (creates `'admin_pending'` account)
4. Wait for super admin approval
5. Once approved, access admin features

### For Super Admin
1. Login with super admin credentials
2. Access approval dashboard at `/dashboard`
3. Approve/reject admin requests
4. Access admin panel at `/admin`

## Security Features
- JWT-based authentication with role validation
- Middleware protection on all admin routes
- Role-based frontend rendering
- No role manipulation from frontend
- Secure password hashing

## API Endpoints

### Public
- `POST /signup/user` - User registration
- `POST /signup/admin` - Admin request registration
- `POST /login` - Authentication

### Protected (Admin Only)
- `GET /api/admin/requests` - Get pending requests
- `POST /api/admin/approve/:userId` - Approve admin request
- `POST /api/admin/reject/:userId` - Reject admin request
- `GET /api/admin/leaderboard` - Get student leaderboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/questions` - Get all questions
- `POST /api/admin/share` - Share top students

## File Structure
```
server/
├── middleware/rbac.js
├── controller/
│   ├── signupEnhanced.js
│   └── adminManagement.js
├── routes/adminRoutes.js
└── setupSuperAdmin.js

client/src/
├── pages/
│   ├── AuthSelection.jsx
│   ├── AdminPending.jsx
│   └── AdminApprovalDashboard.jsx
├── contexts/AppContextProvider.jsx
└── components/Navbar.jsx
```

## Notes
- Change super admin password immediately after first login
- All admin routes are protected with JWT and role verification
- Frontend automatically redirects based on user role
- Admin requests are stored in database until approved/rejected