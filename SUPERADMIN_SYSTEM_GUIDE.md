# 🔐 Super Admin Approval System - Complete Guide

## ✅ System Overview

The super admin system allows you to control who can access admin privileges in your application. When someone registers as an admin, their account requires approval from a super admin before they can log in.

## 🎯 Key Features

1. **Admin Registration Approval** - All admin registrations must be approved
2. **Super Admin Dashboard** - Dedicated interface to manage admin requests
3. **Approve/Deny Workflow** - Easily approve or reject admin applications
4. **Statistics Dashboard** - View system metrics and user counts
5. **Remove Admins** - Remove existing approved admins if needed
6. **Role-Based Access** - Super admins have all privileges

## 🚀 Getting Started

### Step 1: Create Your Super Admin Account

The **first super admin** can register directly without approval. Subsequent admins will require approval.

1. Go to: http://localhost:3000/register
2. Fill in the registration form
3. Select **"Admin"** role (or register normally and manually change to superadmin in database)
4. **Important**: For the first superadmin, you'll need to update the role in the database:

```sql
-- Run this in Aiven console to make the first user a superadmin
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'your-email@example.com';
```

Or use this Python script:
```powershell
python -c "from backend.database import SessionLocal; from backend.models import UserModel; db = SessionLocal(); user = db.query(UserModel).filter(UserModel.email == 'your-email@example.com').first(); user.role = 'superadmin'; db.commit(); print('Super admin created!')"
```

### Step 2: Login as Super Admin

1. Go to: http://localhost:3000/login
2. Select **"Admin"** role
3. Enter your superadmin credentials
4. You'll be redirected to: http://localhost:3000/superadmin

## 📊 Super Admin Dashboard

### Dashboard Sections

#### 1. **Statistics Cards**
- **Pending Admins** - Orange badge showing how many admin requests are waiting
- **Approved Admins** - Green badge showing approved admin count
- **Total Admins** - All admin accounts (pending + approved)
- **Total Users** - Regular user accounts
- **Total Farmers** - Farmer accounts

#### 2. **Pending Requests Tab**
Shows all admin registration requests awaiting approval:
- **Name** - Full name of the applicant
- **Email** - Email address
- **Phone** - Phone number (if provided)
- **Requested** - Date and time of registration
- **Actions** - Approve or Deny buttons

#### 3. **All Admins Tab**
Shows all admin users in the system:
- **Name** - Admin's full name
- **Email** - Admin's email
- **Phone** - Phone number
- **Status** - Badge showing "Approved" or "Pending"
- **Created** - Registration date
- **Actions** - Remove button for approved admins, Approve/Deny for pending

## 🔄 Approval Workflow

### Scenario 1: New Admin Registration

1. **User registers as admin** via http://localhost:3000/register
2. **Account created but NOT approved** (is_approved = false)
3. **User tries to login** → Blocked with message: "Your admin account is pending approval"
4. **Super admin sees pending request** in dashboard
5. **Super admin clicks "Approve"**
6. **User can now login** as admin

### Scenario 2: Denying Admin Request

1. **Super admin reviews pending request**
2. **Clicks "Deny" button**
3. **User account is deleted** from database
4. **User cannot login** (account removed)

### Scenario 3: Removing Existing Admin

1. **Super admin goes to "All Admins" tab**
2. **Finds approved admin to remove**
3. **Clicks "Remove" button**
4. **Confirms removal**
5. **Admin account deleted** immediately

## 🔌 API Endpoints

### Super Admin Endpoints

All endpoints require super admin authentication (Bearer token with superadmin role).

#### GET `/api/v1/superadmin/pending-admins`
Get list of pending admin requests.

**Response**:
```json
[
  {
    "id": 2,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "1234567890",
    "role": "admin",
    "is_approved": false,
    "created_at": "2026-08-31T10:30:00Z"
  }
]
```

#### GET `/api/v1/superadmin/all-admins`
Get list of all admin users (approved and pending).

**Response**: Same as above, but includes both approved and pending admins.

#### POST `/api/v1/superadmin/approve-admin`
Approve or deny an admin request.

**Request**:
```json
{
  "user_id": 2,
  "approved": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin John Doe has been approved",
  "user": {
    "id": 2,
    "email": "john@example.com",
    "full_name": "John Doe"
  }
}
```

#### DELETE `/api/v1/superadmin/remove-admin/{user_id}`
Remove an existing admin user.

**Response**:
```json
{
  "success": true,
  "message": "Admin John Doe has been removed"
}
```

#### GET `/api/v1/superadmin/stats`
Get dashboard statistics.

**Response**:
```json
{
  "total_admins": 5,
  "pending_admins": 2,
  "approved_admins": 3,
  "total_users": 150,
  "total_farmers": 45
}
```

## 🧪 Testing the System

### Test 1: Create First Super Admin
```powershell
# Register as admin first, then promote to superadmin
$body = @{
    full_name = "Super Admin"
    email = "superadmin@test.com"
    password = "Super123"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $body

# Then update role in database
python -c "from backend.database import SessionLocal; from backend.models import UserModel; db = SessionLocal(); user = db.query(UserModel).filter(UserModel.email == 'superadmin@test.com').first(); user.role = 'superadmin'; db.commit()"
```

### Test 2: Register Admin User (Should Be Pending)
```powershell
$body = @{
    full_name = "Test Admin"
    email = "admin@test.com"
    password = "Admin123"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $body
```

### Test 3: Try Login as Unapproved Admin (Should Fail)
```powershell
$login = @{
    username = "admin@test.com"
    password = "Admin123"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $login
# Should return: 403 Forbidden - "Your admin account is pending approval"
```

### Test 4: Approve Admin as Super Admin
```powershell
# Login as superadmin first
$superlogin = @{
    username = "superadmin@test.com"
    password = "Super123"
}
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $superlogin
$token = $response.access_token

# Get pending admins
$headers = @{ Authorization = "Bearer $token" }
$pending = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/superadmin/pending-admins" -Method GET -Headers $headers

# Approve first pending admin
$approve = @{
    user_id = $pending[0].id
    approved = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/superadmin/approve-admin" -Method POST -Headers $headers -ContentType "application/json" -Body $approve
```

### Test 5: Login as Approved Admin (Should Succeed)
```powershell
$login = @{
    username = "admin@test.com"
    password = "Admin123"
}

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $login
# Should return: Success with JWT token
```

## 🎨 UI Components

### Super Admin Link in Admin Dashboard
When logged in as super admin, you'll see a purple **"Super Admin Portal"** button in the admin sidebar.

### Dashboard Color Scheme
- **Pending Badge**: Orange (#F59E0B)
- **Approved Badge**: Green (#10B981)
- **Super Admin Link**: Purple (#9333EA)
- **Primary Actions**: Green (#388E3C)
- **Danger Actions**: Red (#DC2626)

## 🔒 Security Features

1. **JWT Authentication** - All super admin endpoints require valid token
2. **Role Verification** - Only superadmin role can access endpoints
3. **Database Validation** - All operations verify user exists and has correct role
4. **Approval Workflow** - Admins cannot login until approved
5. **Self-Protection** - Super admins cannot remove themselves

## 📱 Frontend Integration

### Check if User is Super Admin
```typescript
const userStr = localStorage.getItem('user');
if (userStr) {
  const user = JSON.parse(userStr);
  if (user.role === 'superadmin') {
    // Show super admin features
  }
}
```

### Call Super Admin API
```typescript
const token = localStorage.getItem('token');
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/pending-admins`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const pendingAdmins = await response.json();
```

## 🗄️ Database Schema

### Users Table (Updated)
```sql
users:
  - id (integer, primary key)
  - full_name (varchar)
  - email (varchar, unique)
  - phone_number (varchar, nullable)
  - hashed_password (varchar)
  - role (varchar: 'user', 'admin', 'farmer', 'superadmin')
  - is_active (boolean, default true)
  - is_approved (boolean, default true)  -- NEW
  - created_at (timestamp)
```

### Role Values
- **user** - Regular customer (auto-approved)
- **farmer** - Farmer selling products (auto-approved)
- **admin** - Admin user (requires approval if superadmin exists)
- **superadmin** - Super admin (full privileges, auto-approved)

## 🎯 Best Practices

1. **Create First Super Admin Early** - Set up your superadmin account before launching
2. **Review Admin Requests Promptly** - Check dashboard regularly for pending requests
3. **Verify Admin Identity** - Confirm admin identities before approval
4. **Keep Super Admin Credentials Secure** - Use strong password, enable 2FA if available
5. **Regular Audits** - Review admin list periodically, remove inactive admins
6. **Document Approvals** - Keep records of who approved which admins

## 🆘 Troubleshooting

### Issue: Can't Access Super Admin Dashboard
**Solution**: Make sure you're logged in as superadmin role. Check:
```javascript
console.log(JSON.parse(localStorage.getItem('user')));
// Should show: { role: 'superadmin', ... }
```

### Issue: "Admin privileges required" error
**Solution**: Your role is not set to superadmin. Update in database:
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'your-email@example.com';
```

### Issue: Pending admin can still login
**Solution**: Check is_approved field:
```sql
SELECT email, role, is_approved FROM users WHERE role = 'admin';
```

### Issue: Super admin link doesn't show
**Solution**: Clear localStorage and login again, or check that isSuperAdmin state is set correctly.

## 📚 Additional Resources

- **Backend API**: http://127.0.0.1:8000/docs
- **Super Admin Dashboard**: http://localhost:3000/superadmin
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Database Console**: https://console.aiven.io

---

**Your super admin approval system is now fully operational!** 🎉
