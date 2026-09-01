# Backend Setup Guide - Aiven PostgreSQL Integration

This backend uses FastAPI with Aiven PostgreSQL for database management.

## 🚀 Quick Start

### 1. Get Your Aiven Credentials

1. Go to your [Aiven Console](https://console.aiven.io)
2. Select your PostgreSQL service
3. Go to **Overview** tab
4. Find the **Connection information** section
5. Note or copy the Service URI:
   ```
   postgres://avnadmin:[PASSWORD]@your-service.aivencloud.com:12345/defaultdb
   ```

### 2. Configure Environment Variables

1. Open `backend/.env`
2. Update with your actual Aiven credentials:
   ```env
   DATABASE_URL=postgresql://avnadmin:your_password@your-host.aivencloud.com:12345/defaultdb?sslmode=require
   SECRET_KEY=your_secret_key_here
   ```

**⚠️ Important**: Aiven requires SSL - always include `?sslmode=require`

### 3. Install Dependencies

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install packages
pip install -r backend/requirements.txt
```

### 4. Test Database Connection

```bash
python -m backend.test_connection
```

If successful, you should see:
```
✓ Database connection successful!
✓ Tables created/verified successfully!
✅ All database tests passed!
```

### 5. Start the Backend Server

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://127.0.0.1:8000
- **Interactive Docs**: http://127.0.0.1:8000/docs
- **OpenAPI Schema**: http://127.0.0.1:8000/openapi.json

## 📊 Database Tables

The following tables are automatically created:

### Users Table
- `id` (Primary Key)
- `full_name`
- `email` (Unique)
- `phone_number`
- `hashed_password`
- `role` (user/admin/farmer)
- `is_active`
- `created_at`

### Products Table
- `id` (Primary Key)
- `title`
- `description`
- `category`
- `price`
- `unit`
- `quantity_available`
- `farmer`
- `location`
- `imageUrl`
- `is_available`
- `owner_id` (Foreign Key → users)
- `created_at`

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Products
- `GET /api/v1/products` - Query products with filters
- `POST /api/v1/products` - Create product (Admin only)

## 🛠️ Troubleshooting

### Connection Issues

1. **"No module named 'backend'"**
   - Make sure you're in the project root directory
   - Run commands with `python -m backend.main` instead of `python backend/main.py`

2. **"Could not connect to database"**
   - Check your `.env` file has the correct credentials
   - Verify your Aiven service is running in the console
   - Make sure `?sslmode=require` is in your DATABASE_URL
   - Check your internet connection

3. **"SSL connection is required"**
   - Add `?sslmode=require` to the end of your DATABASE_URL

4. **"Table already exists"**
   - This is normal if tables were created before
   - SQLAlchemy will skip creating existing tables

### Port Already in Use

If port 8000 is busy:
```bash
uvicorn backend.main:app --reload --port 8001
```

## 🔍 Viewing Data in Aiven

1. Go to your Aiven Console
2. Select your PostgreSQL service
3. Use the **Query Editor** or connect with a database client
4. You can view, edit, and query data directly

You can also use tools like pgAdmin, DBeaver, or psql with your Aiven credentials.

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string from Aiven | Yes |
| `SECRET_KEY` | JWT signing secret (change in production!) | Yes |

## 🚀 Production Deployment

For production:
1. Use a strong `SECRET_KEY`
2. Aiven uses SSL by default (keep `?sslmode=require`)
3. Set up proper CORS origins
4. Consider using Aiven's connection pooling features
5. Never commit `.env` files to git
6. Enable IP whitelisting in Aiven console for security
