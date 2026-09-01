# 🗄️ Aiven PostgreSQL Setup - Complete Guide

Your backend is now configured to connect to Aiven PostgreSQL! Follow these steps to complete the setup.

## ✅ What's Been Configured

Your backend files are ready for Aiven:

1. **`backend/.env`** - Configured for Aiven (you need to add your credentials)
2. **`backend/database.py`** - Updated for Aiven with SSL support
3. **`backend/requirements.txt`** - All necessary dependencies
4. **`backend/test_connection.py`** - Database connection tester

## 🔑 Step 1: Get Your Aiven Connection Details

### Option A: From Aiven Console (Recommended)

1. Go to https://console.aiven.io
2. Select your PostgreSQL service
3. Go to the **Overview** tab
4. Find the **Connection information** section
5. You'll see:
   ```
   Host: your-service-name.aivencloud.com
   Port: 12345
   User: avnadmin
   Password: [your password]
   Database: defaultdb
   ```

### Option B: Get the Full URI

In the Aiven console, look for **Service URI** or **Connection String**:
```
postgres://avnadmin:password@your-service.aivencloud.com:12345/defaultdb?sslmode=require
```

## 📝 Step 2: Update Your .env File

Open `backend/.env` and add your Aiven credentials:

### Format 1: Using Full URI (Easiest)
```env
DATABASE_URL=postgres://avnadmin:your_password@your-service.aivencloud.com:12345/defaultdb?sslmode=require
```

### Format 2: Using Component Details
If your connection string uses `postgres://` instead of `postgresql://`, both work fine with SQLAlchemy!

**Example**:
```env
DATABASE_URL=postgresql://avnadmin:MyP@ssw0rd123@myapp-postgres.aivencloud.com:23456/defaultdb?sslmode=require
```

**⚠️ Important Notes:**
- Aiven **requires SSL** - always include `?sslmode=require`
- Default username is usually `avnadmin`
- Default database is usually `defaultdb`
- Port is typically 5-digits (not the standard 5432)

## 🔧 Step 3: Install Dependencies

```powershell
# Create virtual environment (recommended)
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt
```

## 🧪 Step 4: Test the Connection

```powershell
python -m backend.test_connection
```

**Expected output**:
```
✓ Imports successful
🔄 Testing database connection...
✓ Database connection successful!
🔄 Creating tables if they don't exist...
✓ Tables created/verified successfully!
✓ Session test successful!
  PostgreSQL version: PostgreSQL 15.x on x86_64-...
✅ All database tests passed!
```

## 🚀 Step 5: Start Your Backend

### Option A: Use the startup script
```powershell
.\start-backend.ps1
```

### Option B: Manual start
```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## 🌐 Step 6: Verify It's Working

1. **API Documentation**: http://127.0.0.1:8000/docs
2. **Test Registration**: Create a user via the API docs
3. **View in Aiven**: Check Aiven console → Database view

## 📊 Database Tables

The following tables are automatically created in your Aiven database:

### `users` table
- `id` (Primary Key, Auto-increment)
- `full_name` (varchar)
- `email` (varchar, unique)
- `phone_number` (varchar, nullable)
- `hashed_password` (varchar)
- `role` (varchar: 'user', 'admin', or 'farmer')
- `is_active` (boolean)
- `created_at` (timestamp with timezone)

### `products` table
- `id` (Primary Key, Auto-increment)
- `title` (varchar)
- `description` (text)
- `category` (varchar)
- `price` (float)
- `unit` (varchar, default 'kg')
- `quantity_available` (float)
- `farmer` (varchar)
- `location` (varchar)
- `imageUrl` (varchar)
- `is_available` (boolean)
- `owner_id` (Foreign Key → users.id)
- `created_at` (timestamp with timezone)

## 🔍 Viewing Your Data in Aiven

### Using Aiven Console:
1. Go to https://console.aiven.io
2. Select your PostgreSQL service
3. Click **Database** in the left sidebar (if available)
4. Or use the **Query Editor** to run SQL

### Using SQL Queries:
```sql
-- View all users
SELECT * FROM users;

-- View all products
SELECT * FROM products;

-- View products with owner info
SELECT p.*, u.full_name as owner_name 
FROM products p 
LEFT JOIN users u ON p.owner_id = u.id;
```

### Using pgAdmin or Other Tools:
You can connect using the credentials from your Aiven console:
- Host: `your-service.aivencloud.com`
- Port: `your-port-number`
- Database: `defaultdb`
- Username: `avnadmin`
- Password: `your-password`
- SSL Mode: **Require**

## 🛠️ Troubleshooting

### ❌ "Could not connect to server"
**Causes:**
- Incorrect host, port, or credentials
- SSL not enabled
- Firewall blocking connection
- Aiven service is powered down

**Solutions:**
```powershell
# 1. Verify your configuration
python backend/check_env.py

# 2. Check Aiven service is running
# Go to Aiven console and ensure status is "Running"

# 3. Verify SSL is in connection string
# Must include: ?sslmode=require
```

### ❌ "SSL connection is required"
**Solution**: Make sure your DATABASE_URL includes `?sslmode=require`:
```env
DATABASE_URL=postgresql://avnadmin:pass@host:port/db?sslmode=require
```

### ❌ "Password authentication failed"
**Solutions:**
- Double-check the password in Aiven console
- Copy-paste carefully (no extra spaces)
- If password contains special characters, they might need encoding
- Reset password in Aiven console if needed

### ❌ "Database does not exist"
**Solution**: Aiven creates `defaultdb` by default. To create a new database:
1. Go to Aiven console
2. Navigate to your service → Databases
3. Create new database if needed
4. Update DATABASE_URL with the new database name

### ❌ Connection works but tables not created
**Solution**:
```powershell
# Run the test connection script
python -m backend.test_connection

# If that fails, create tables manually
python -c "from backend.database import engine; from backend.models import Base; Base.metadata.create_all(bind=engine)"
```

## 🔐 Security Best Practices

### For Development:
- ✅ Use `.env` file (already gitignored)
- ✅ Keep `?sslmode=require` in connection string
- ✅ Don't share credentials in code or commits

### For Production:
- Use Aiven's connection pooling if available
- Enable IP whitelisting in Aiven console
- Rotate passwords regularly
- Use read-only users for reporting
- Enable Aiven's backup features

## 📊 Aiven Features You Can Use

### Backups:
- Aiven automatically backs up your database
- Check backup schedule in console
- Restore from backups if needed

### Monitoring:
- View metrics in Aiven console
- Monitor connection count, CPU, memory
- Set up alerts for issues

### Scaling:
- Upgrade plan for more resources
- Aiven handles upgrades seamlessly

## 🔧 Connection String Formats

Aiven accepts multiple formats:

### Standard PostgreSQL:
```
postgresql://avnadmin:password@host:port/database?sslmode=require
```

### Short format (also works):
```
postgres://avnadmin:password@host:port/database?sslmode=require
```

### With connection pooling:
```
postgresql://avnadmin:password@host:port/database?sslmode=require&pool_size=10
```

## 📱 Connecting Frontend to Backend

Your Next.js frontend is already configured in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Make sure both servers are running:
- **Backend**: http://127.0.0.1:8000 (connected to Aiven)
- **Frontend**: http://localhost:3000

## 🎯 Quick Command Reference

```powershell
# Check configuration
python backend/check_env.py

# Test Aiven connection
python -m backend.test_connection

# Start backend server
uvicorn backend.main:app --reload

# View logs (if connection fails)
uvicorn backend.main:app --reload --log-level debug
```

## 📚 Additional Resources

- [Aiven PostgreSQL Documentation](https://docs.aiven.io/docs/products/postgresql)
- [Aiven Console](https://console.aiven.io)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## 🆘 Still Having Issues?

1. **Check Aiven service status** in console
2. **Verify credentials** by connecting with psql or pgAdmin
3. **Review Aiven logs** in the console
4. **Test with a simple Python script**:

```python
import psycopg2

conn = psycopg2.connect(
    host="your-service.aivencloud.com",
    port=12345,
    database="defaultdb",
    user="avnadmin",
    password="your-password",
    sslmode="require"
)
print("✓ Connected to Aiven!")
conn.close()
```

---

**Need help?** Check your Aiven service logs in the console or contact Aiven support!
