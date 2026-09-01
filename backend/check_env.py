"""
Environment variable checker - helps diagnose configuration issues
Run with: python backend/check_env.py
"""
import os
from pathlib import Path

def check_environment():
    print("🔍 Environment Configuration Check\n")
    print("=" * 60)
    
    # Check for .env file
    env_path = Path(__file__).parent / ".env"
    print(f"\n1. Checking for .env file...")
    if env_path.exists():
        print(f"   ✓ Found: {env_path}")
    else:
        print(f"   ❌ Not found: {env_path}")
        print("   Create one using the template in backend/.env")
        return False
    
    # Load and check DATABASE_URL
    from dotenv import load_dotenv
    load_dotenv(env_path)
    
    print(f"\n2. Checking DATABASE_URL...")
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("   ❌ DATABASE_URL not found in .env file")
        return False
    
    # Check if placeholder values are still there
    if "[YOUR-PASSWORD]" in db_url or "your-service.aivencloud.com" in db_url:
        print("   ❌ DATABASE_URL still contains placeholder values")
        print("   📝 Action needed: Replace with your actual Aiven credentials")
        print("\n   Get your credentials from:")
        print("   https://console.aiven.io → Your Service → Overview")
        return False
    
    # Check for SSL mode (required for Aiven)
    if "sslmode=require" not in db_url:
        print("   ⚠️  WARNING: sslmode=require not found in DATABASE_URL")
        print("   Aiven requires SSL connections. Add ?sslmode=require to your URL")
        print(f"   Example: {db_url}?sslmode=require")
    
    # Parse and display connection info (masking password)
    if db_url.startswith(("postgresql://", "postgres://")):
        try:
            # Extract parts
            protocol = "postgresql://" if db_url.startswith("postgresql://") else "postgres://"
            parts = db_url.replace(protocol, "").split("@")
            if len(parts) >= 2:
                user_pass = parts[0].split(":")
                host_db = parts[1].split("/")
                
                user = user_pass[0] if len(user_pass) > 0 else "unknown"
                password_length = len(user_pass[1]) if len(user_pass) > 1 else 0
                host_port = host_db[0] if len(host_db) > 0 else "unknown"
                database = host_db[1].split("?")[0] if len(host_db) > 1 else "unknown"
                
                # Check if it looks like Aiven
                is_aiven = "aivencloud.com" in host_port
                
                print(f"   ✓ DATABASE_URL is configured")
                print(f"\n   Connection details:")
                print(f"   - Provider: {'Aiven' if is_aiven else 'Custom PostgreSQL'}")
                print(f"   - User: {user}")
                print(f"   - Password: {'*' * password_length} ({password_length} characters)")
                print(f"   - Host: {host_port}")
                print(f"   - Database: {database}")
                print(f"   - SSL: {'✓ Enabled' if 'sslmode=require' in db_url else '❌ Not configured'}")
        except Exception as e:
            print(f"   ⚠️  Could not parse DATABASE_URL: {e}")
    else:
        print(f"   ⚠️  DATABASE_URL doesn't start with 'postgresql://' or 'postgres://'")
        print(f"   Current value: {db_url[:50]}...")
    
    # Check SECRET_KEY
    print(f"\n3. Checking SECRET_KEY...")
    secret_key = os.getenv("SECRET_KEY")
    if secret_key:
        if "change_in_prod" in secret_key.lower():
            print(f"   ⚠️  Using default SECRET_KEY (change this in production!)")
        else:
            print(f"   ✓ SECRET_KEY is configured ({len(secret_key)} characters)")
    else:
        print(f"   ❌ SECRET_KEY not found")
    
    print("\n" + "=" * 60)
    print("\n✅ Configuration looks good! Try running:")
    print("   python -m backend.test_connection")
    print("\nOr start the server:")
    print("   uvicorn backend.main:app --reload")
    print("\n" + "=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = check_environment()
        if not success:
            print("\n" + "=" * 60)
            print("\n📋 Next steps:")
            print("1. Update backend/.env with your Aiven credentials")
            print("   Get them from: https://console.aiven.io")
            print("2. Run this script again to verify")
            print("3. Then run: python -m backend.test_connection")
            print("\n" + "=" * 60)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you have python-dotenv installed:")
        print("pip install python-dotenv")
