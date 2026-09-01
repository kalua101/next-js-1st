"""
Check crops in database
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

print("\n" + "="*80)
print("CROPS IN DATABASE")
print("="*80 + "\n")

try:
    with engine.connect() as conn:
        # Check if crops table exists
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'crops'
        """))
        
        if not result.fetchone():
            print("❌ Crops table does not exist!")
            print("\nThe table needs to be created. The backend should create it automatically on startup.")
            exit(1)
        
        # Get all crops
        result = conn.execute(text("""
            SELECT id, title, farmer, location, category, status, "imageUrl", created_at 
            FROM crops 
            ORDER BY created_at DESC
        """))
        
        crops = result.fetchall()
        
        if not crops:
            print("📦 No crops found in database!")
            print("\nTo add crops:")
            print("1. Login as admin at: http://localhost:3000/admin/dashboard")
            print("2. Click '+ Add New Crop Listing'")
            print("3. Fill in the details and set status to 'Active'")
            print("4. Click 'Save Listing'")
        else:
            print(f"✅ Found {len(crops)} crop(s):\n")
            
            active_count = 0
            pending_count = 0
            
            for crop in crops:
                status_color = "🟢" if crop.status == "Active" else "🟡"
                print(f"{status_color} #{crop.id} - {crop.title}")
                print(f"   Farmer: {crop.farmer}")
                print(f"   Location: {crop.location}")
                print(f"   Category: {crop.category}")
                print(f"   Status: {crop.status}")
                print(f"   Image: {crop.imageUrl}")
                print(f"   Created: {crop.created_at}")
                print()
                
                if crop.status == "Active":
                    active_count += 1
                else:
                    pending_count += 1
            
            print("="*80)
            print(f"SUMMARY:")
            print(f"  🟢 Active Products: {active_count} (shown in marketplace)")
            print(f"  🟡 Pending Products: {pending_count} (hidden from public)")
            print("="*80)
            
            if active_count == 0:
                print("\n⚠️  WARNING: No active products!")
                print("\nTo make products appear in marketplace:")
                print("1. Go to admin dashboard")
                print("2. Click 'Edit' on a product")
                print("3. Change Status to 'Active'")
                print("4. Click 'Update Listing'")
        
        print()
        
except Exception as e:
    print(f"❌ Error: {str(e)}\n")
