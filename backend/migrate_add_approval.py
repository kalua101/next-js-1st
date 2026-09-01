"""
Migration script to add is_approved column to users table
Run with: python -m backend.migrate_add_approval
"""
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from backend.database import engine

print("🔄 Adding is_approved column to users table...")

try:
    with engine.connect() as connection:
        # Add is_approved column (default True for existing users)
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE NOT NULL;
        """))
        connection.commit()
        
        print("✅ Migration successful!")
        print("   - Added is_approved column to users table")
        print("   - Existing users set to approved by default")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    exit(1)
