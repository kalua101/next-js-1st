"""
Script to create a superadmin account or show existing superadmin credentials info
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
import database
import models
from argon2 import PasswordHasher

# Use argon2 (same as main.py)
ph = PasswordHasher()

def get_password_hash(password):
    return ph.hash(password)

def create_superadmin():
    db = database.SessionLocal()
    
    try:
        # Check if any superadmin exists
        existing_superadmin = db.query(models.UserModel).filter(models.UserModel.role == "superadmin").first()
        
        if existing_superadmin:
            print("\n" + "="*60)
            print("SUPERADMIN ACCOUNT ALREADY EXISTS")
            print("="*60)
            print(f"\nName: {existing_superadmin.full_name}")
            print(f"Email: {existing_superadmin.email}")
            print(f"Phone: {existing_superadmin.phone_number or 'N/A'}")
            print(f"Created: {existing_superadmin.created_at}")
            print("\n⚠️  Password is hashed and cannot be displayed.")
            print("\nTo access the superadmin dashboard:")
            print("1. Go to: http://localhost:3000/login")
            print(f"2. Login with email: {existing_superadmin.email}")
            print("3. Use your original password")
            print("4. You'll be redirected to: http://localhost:3000/superadmin")
            print("\n" + "="*60)
            
            reset = input("\nDo you want to reset this superadmin's password? (yes/no): ").strip().lower()
            if reset == 'yes':
                new_password = input("Enter new password: ").strip()
                if len(new_password) < 6:
                    print("❌ Password must be at least 6 characters")
                    return
                
                existing_superadmin.hashed_password = get_password_hash(new_password)
                db.commit()
                print(f"\n✅ Password reset successfully for {existing_superadmin.email}")
                print(f"New password: {new_password}")
            return
        
        # No superadmin exists, create one
        print("\n" + "="*60)
        print("CREATE NEW SUPERADMIN ACCOUNT")
        print("="*60 + "\n")
        
        full_name = input("Full Name: ").strip()
        email = input("Email: ").strip()
        phone = input("Phone Number (optional): ").strip() or None
        password = input("Password (min 6 chars): ").strip()
        
        if not full_name or not email or not password:
            print("\n❌ Full name, email, and password are required!")
            return
        
        if len(password) < 6:
            print("\n❌ Password must be at least 6 characters!")
            return
        
        # Check if email is already taken
        existing_user = db.query(models.UserModel).filter(models.UserModel.email == email).first()
        if existing_user:
            print(f"\n❌ Email {email} is already registered!")
            print(f"User: {existing_user.full_name} ({existing_user.role})")
            return
        
        # Create superadmin
        new_superadmin = models.UserModel(
            full_name=full_name,
            email=email,
            phone_number=phone,
            hashed_password=get_password_hash(password),
            role="superadmin",
            is_approved=True
        )
        
        db.add(new_superadmin)
        db.commit()
        db.refresh(new_superadmin)
        
        print("\n" + "="*60)
        print("✅ SUPERADMIN ACCOUNT CREATED SUCCESSFULLY!")
        print("="*60)
        print(f"\nName: {new_superadmin.full_name}")
        print(f"Email: {new_superadmin.email}")
        print(f"Password: {password}")
        print(f"Role: {new_superadmin.role}")
        print("\nAccess the superadmin dashboard:")
        print("1. Go to: http://localhost:3000/login")
        print(f"2. Login with:")
        print(f"   - Email: {email}")
        print(f"   - Password: {password}")
        print("3. You'll be redirected to: http://localhost:3000/superadmin")
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin()
