"""
Quick script to reset superadmin password in production database
"""
import sys
import os

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, parent_dir)

from backend import database, models
from argon2 import PasswordHasher

ph = PasswordHasher()

def reset_password():
    db = database.SessionLocal()
    
    try:
        # Find superadmin
        superadmin = db.query(models.UserModel).filter(
            models.UserModel.email == "superadmin@farmlovers.com"
        ).first()
        
        if not superadmin:
            print("❌ Superadmin not found. Creating new superadmin...")
            
            new_superadmin = models.UserModel(
                full_name="Super Admin",
                email="superadmin@farmlovers.com",
                phone_number=None,
                hashed_password=ph.hash("admin123456"),
                role="superadmin",
                is_approved=True
            )
            
            db.add(new_superadmin)
            db.commit()
            print("✅ Superadmin created successfully!")
        else:
            print(f"✅ Found superadmin: {superadmin.email}")
            print("Resetting password to: admin123456")
            
            superadmin.hashed_password = ph.hash("admin123456")
            db.commit()
            print("✅ Password reset successfully!")
        
        print("\nLogin credentials:")
        print("Email: superadmin@farmlovers.com")
        print("Password: admin123456")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
