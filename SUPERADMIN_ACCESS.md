# Super Admin Access Guide

## Current Superadmin Account

**Email:** `superadmin@farmlovers.com`  
**Password:** [You need to know this - it was set when the account was created]

## How to Access

1. **Go to the login page:**
   ```
   http://localhost:3000/login
   ```

2. **Enter credentials:**
   - Email: `superadmin@farmlovers.com`
   - Password: Your password

3. **Automatic redirect:**
   - After successful login, you'll be automatically redirected to:
   ```
   http://localhost:3000/superadmin
   ```

## Superadmin Dashboard Features

Once logged in, you can:

### 1. **Pending Requests Tab**
   - View admins waiting for approval
   - Approve or deny admin registration requests
   - See registration details (name, email, phone, date)

### 2. **All Admins Tab**
   - View all admin users (approved and pending)
   - See admin status (Approved/Pending badges)
   - Remove approved admins

### 3. **Invitations Tab** (NEW!)
   - **Send invitation:** Enter email and click "Send Invitation"
   - **View all invitations:** See pending, used, and expired invitations
   - **Copy links:** Click "Copy Link" to get invitation URLs
   - **Revoke invitations:** Remove unused invitations
   - **Status tracking:** See who invited whom and when

### 4. **Dashboard Stats**
   - Total pending admin requests
   - Total approved admins
   - Total admin count
   - Total users
   - Total farmers

## Password Reset

If you forgot your password, run this script:

```bash
cd backend
python reset_superadmin_password.py
```

The script will:
1. Show all superadmin accounts
2. Let you choose which one to reset
3. Prompt for new password
4. Update the database
5. Display the new credentials

## Check Existing Superadmin

To check what superadmin accounts exist:

```bash
cd backend
python check_superadmin.py
```

This will show:
- All superadmin accounts
- Their email addresses
- Creation dates
- Access instructions

## Troubleshooting

### "Incorrect email or password"
- Verify you're using the correct email: `superadmin@farmlovers.com`
- If you forgot the password, use the password reset script above
- Check backend logs for detailed error messages

### Page redirects to login immediately
- Your token might have expired
- Clear browser localStorage and login again
- Check browser console for errors

### "Access denied" message
- Make sure you're logged in with a superadmin account
- Check that your role is "superadmin" (not just "admin")

### Backend not responding
- Verify backend is running: `http://localhost:8000/docs`
- Check backend terminal for errors
- Restart backend if needed:
  ```bash
  cd backend
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```

## Creating Additional Superadmins

If you want to promote an existing admin to superadmin, run SQL:

```sql
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'admin@example.com';
```

Or create a new superadmin directly:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Another Super Admin",
    "email": "superadmin2@farmlovers.com",
    "password": "securepassword123",
    "role": "superadmin"
  }'
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Keep superadmin credentials secure** - They have full system access
2. **Don't share superadmin accounts** - Create separate admin accounts instead
3. **Use strong passwords** - At least 12 characters with mixed case, numbers, and symbols
4. **Limit superadmin accounts** - Only create what's necessary
5. **Monitor invitation usage** - Check the Invitations tab regularly
6. **Revoke unused invitations** - Clean up old or unnecessary invitations

## Next Steps After Login

1. **Test the invitation system:**
   - Go to Invitations tab
   - Send an invitation to a test email
   - Copy the invitation link
   - Open it in incognito/private window
   - Complete the admin registration
   - Verify the new admin can login

2. **Review pending admins:**
   - Check if there are any pending admin requests
   - Approve or deny as needed

3. **Check system stats:**
   - Review the dashboard statistics
   - Ensure user counts are correct

## Quick Reference

| Action | Location | URL |
|--------|----------|-----|
| Login | Login Page | http://localhost:3000/login |
| Dashboard | Super Admin | http://localhost:3000/superadmin |
| Send Invites | Invitations Tab | (click tab in dashboard) |
| Manage Admins | Pending/All Tabs | (click tabs in dashboard) |
| API Docs | Swagger UI | http://localhost:8000/docs |
| Check Password | Terminal | `python check_superadmin.py` |
| Reset Password | Terminal | `python reset_superadmin_password.py` |

---

**Need help?** Check the backend terminal logs for detailed error messages.
