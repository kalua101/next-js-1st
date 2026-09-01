"""
Debug status field issue
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

print("\n" + "="*80)
print("DEBUGGING STATUS FIELD")
print("="*80 + "\n")

try:
    with engine.connect() as conn:
        # Get exact status values
        result = conn.execute(text("""
            SELECT id, title, status, LENGTH(status) as len, ASCII(status) as ascii_first
            FROM crops
        """))
        
        crops = result.fetchall()
        
        for crop in crops:
            print(f"ID: {crop.id}")
            print(f"Title: {crop.title}")
            print(f"Status: '{crop.status}'")
            print(f"Status Length: {crop.len}")
            print(f"First char ASCII: {crop.ascii_first}")
            print(f"Status == 'Active': {crop.status == 'Active'}")
            print()
        
        # Try the exact query from the API
        print("="*80)
        print("TESTING EXACT API QUERY:")
        print("="*80 + "\n")
        
        result2 = conn.execute(text("""
            SELECT id, title, status 
            FROM crops 
            WHERE status = 'Active'
            ORDER BY created_at DESC
        """))
        
        matching = result2.fetchall()
        print(f"Products matching status='Active': {len(matching)}")
        
        for m in matching:
            print(f"  - {m.title} (status: '{m.status}')")
        
except Exception as e:
    print(f"Error: {e}")
