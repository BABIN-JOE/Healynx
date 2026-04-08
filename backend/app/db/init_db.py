from sqlmodel import SQLModel
from app.db.engine import engine


def create_all_tables():
    """
    Safe table creation:
    - Creates tables if they do not exist
    - Does NOT drop or modify existing tables
    - Perfect for production use
    """
    print("\n--- INITIALIZING DATABASE ---")
    SQLModel.metadata.create_all(engine)
    print("--- DATABASE READY (all tables exist) ---\n")
