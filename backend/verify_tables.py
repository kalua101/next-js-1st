"""
Quick script to verify database tables
Run with: python backend/verify_tables.py
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv("DATABASE_URL")

print("🔍 Verifying Database Tables\n")
print("=" * 60)

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Get table list
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
""")
tables = cursor.fetchall()

print("\n📊 Tables in Aiven Database:")
if tables:
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]};")
        count = cursor.fetchone()[0]
        
        # Get column count
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = '{table[0]}';
        """)
        col_count = cursor.fetchone()[0]
        
        print(f"  ✓ {table[0]:20} - {count} rows, {col_count} columns")
else:
    print("  ⚠️  No tables found")

print("\n" + "=" * 60)
print("\n✅ Database verification complete!")
print("\n🚀 Ready to start backend:")
print("   uvicorn backend.main:app --reload")
print("\n" + "=" * 60)

cursor.close()
conn.close()
