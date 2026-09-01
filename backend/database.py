import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from backend/.env file
# Get the directory of this file (backend/) and find .env there
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Aiven PostgreSQL Connection String
# Aiven requires SSL connections, so make sure sslmode=require is in your connection string
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        f"DATABASE_URL environment variable is not set. "
        f"Please update {env_path} with your Aiven credentials."
    )

# Engine configuration with health checks for remote cloud hosting
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Automatically tests connection health before executing queries
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()