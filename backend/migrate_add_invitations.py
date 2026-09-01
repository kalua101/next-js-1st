"""
Migration script to add admin_invitations table
Run with: python -m backend.migrate_add_invitations
"""
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from backend.database import engine

print("🔄 Creating admin_invitations table...")

try:
    with engine.connect() as connection:
        # Create admin_invitations table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS admin_invitations (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                invitation_token VARCHAR(255) UNIQUE NOT NULL,
                invited_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                is_used BOOLEAN DEFAULT FALSE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                used_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create indexes
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_admin_invitations_email 
            ON admin_invitations(email);
        """))
        
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_admin_invitations_token 
            ON admin_invitations(invitation_token);
        """))
        
        connection.commit()
        
        print("✅ Migration successful!")
        print("   - Created admin_invitations table")
        print("   - Created email index")
        print("   - Created token index")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    exit(1)
