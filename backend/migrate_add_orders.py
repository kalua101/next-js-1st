#!/usr/bin/env python3
"""
Migration script to add orders table
Run with: python -m backend.migrate_add_orders
"""
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from backend.database import engine

print("🔄 Creating orders table...")

try:
    with engine.connect() as connection:
        # Create orders table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
                
                product_name VARCHAR(255) NOT NULL,
                product_category VARCHAR(100),
                quantity FLOAT NOT NULL,
                unit VARCHAR(50) DEFAULT 'kg' NOT NULL,
                price_per_unit VARCHAR(100) NOT NULL,
                total_price VARCHAR(100),
                
                buyer_name VARCHAR(255) NOT NULL,
                buyer_email VARCHAR(255) NOT NULL,
                buyer_phone VARCHAR(50) NOT NULL,
                delivery_address TEXT NOT NULL,
                
                farmer_name VARCHAR(255) NOT NULL,
                farmer_location VARCHAR(255) NOT NULL,
                
                status VARCHAR(50) DEFAULT 'pending' NOT NULL,
                notes TEXT,
                admin_notes TEXT,
                
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create indexes
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        """))
        
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_crop_id ON orders(crop_id);
        """))
        
        connection.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        """))
        
        connection.commit()
        
        print("✅ Migration successful!")
        print("   - Created orders table")
        print("   - Created user_id index")
        print("   - Created crop_id index")
        print("   - Created status index")
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    sys.exit(1)
