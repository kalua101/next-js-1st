"""
Simple script to check existing superadmin accounts
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

engine = create_engine(DATABASE_URL)

print("\n" + "="*60)
print("CHECKING FOR SUPERADMIN ACCOUNTS")
print("="*60 + "\n")

try:
    with engine.connect() as conn:
        # Query for superadmin users
        result = conn.execute(text("""
            SELECT id, full_name, email, phone_number, role, is_approved, created_at 
            FROM users 
            WHERE role = 'superadmin'
        """))
        
        superadmins = result.fetchall()
        
        if not superadmins:
            print("❌ No superadmin account found!\n")
            print("📝 To create a superadmin account:")
            print("   1. Go to: http://localhost:3000/register")
            print("   2. Select role: Admin")
            print("   3. Register with your details")
            print("   4. The FIRST admin registered becomes superadmin automatically")
            print("\nOR you can create one directly via the API:")
            print("\ncurl -X POST http://localhost:8000/api/v1/auth/register \\")
            print("  -H \"Content-Type: application/json\" \\")
            print("  -d '{")
            print('    "full_name": "Super Admin",')
            print('    "email": "admin@farmlovers.com",')
            print('    "password": "admin123",')
            print('    "role": "superadmin"')
            print("  }'")
        else:
            print(f"✅ Found {len(superadmins)} superadmin account(s):\n")
            for idx, sa in enumerate(superadmins, 1):
                print(f"{idx}. {sa.full_name}")
                print(f"   Email: {sa.email}")
                print(f"   Phone: {sa.phone_number or 'N/A'}")
                print(f"   Approved: {sa.is_approved}")
                print(f"   Created: {sa.created_at}")
                print()
            
            print("="*60)
            print("TO ACCESS SUPERADMIN DASHBOARD:")
            print("="*60)
            print(f"\n1. Go to: http://localhost:3000/login")
            print(f"2. Login with:")
            print(f"   Email: {superadmins[0].email}")
            print(f"   Password: [your password]")
            print(f"\n3. You'll be automatically redirected to:")
            print(f"   http://localhost:3000/superadmin")
            print()
            print("⚠️  Note: Passwords are hashed and cannot be displayed.")
            print("   If you forgot your password, you'll need to reset it in the database.")
        
        print("="*60 + "\n")
        
except Exception as e:
    print(f"❌ Error: {str(e)}\n")
    print("Make sure:")
    print("1. The database is running")
    print("2. DATABASE_URL in .env is correct")
    print(f"3. Current DATABASE_URL: {DATABASE_URL[:50]}...")
