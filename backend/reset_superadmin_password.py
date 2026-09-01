"""
Script to reset superadmin password
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from argon2 import PasswordHasher

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

engine = create_engine(DATABASE_URL)
ph = PasswordHasher()

print("\n" + "="*60)
print("RESET SUPERADMIN PASSWORD")
print("="*60 + "\n")

try:
    with engine.connect() as conn:
        # Get all superadmin accounts
        result = conn.execute(text("""
            SELECT id, full_name, email FROM users WHERE role = 'superadmin'
        """))
        
        superadmins = result.fetchall()
        
        if not superadmins:
            print("❌ No superadmin account found!")
            exit(1)
        
        print("Found superadmin account(s):\n")
        for idx, sa in enumerate(superadmins, 1):
            print(f"{idx}. {sa.full_name} ({sa.email})")
        
        print()
        
        # Get selection
        if len(superadmins) > 1:
            choice = int(input(f"Select account (1-{len(superadmins)}): ")) - 1
            selected = superadmins[choice]
        else:
            selected = superadmins[0]
        
        print(f"\nResetting password for: {selected.full_name} ({selected.email})")
        
        # Get new password
        new_password = input("\nEnter new password (min 6 chars): ").strip()
        
        if len(new_password) < 6:
            print("❌ Password must be at least 6 characters!")
            exit(1)
        
        confirm_password = input("Confirm password: ").strip()
        
        if new_password != confirm_password:
            print("❌ Passwords do not match!")
            exit(1)
        
        # Hash password
        hashed_password = ph.hash(new_password)
        
        # Update database
        conn.execute(
            text("UPDATE users SET hashed_password = :pwd WHERE id = :id"),
            {"pwd": hashed_password, "id": selected.id}
        )
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ PASSWORD RESET SUCCESSFUL!")
        print("="*60)
        print(f"\nAccount: {selected.full_name}")
        print(f"Email: {selected.email}")
        print(f"New Password: {new_password}")
        print("\nYou can now login at:")
        print("http://localhost:3000/login")
        print("="*60 + "\n")
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print("\nMake sure:")
    print("1. The database is running")
    print("2. DATABASE_URL in .env is correct")
