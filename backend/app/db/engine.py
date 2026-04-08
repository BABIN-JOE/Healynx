# app/db/engine.py

from sqlmodel import create_engine
from app.config import settings

"""
Database Engine for Healynx
- pool_pre_ping=True ensures stale/idle connections auto-recover
- pool_size controls active connections
- max_overflow allows temporary extra connections
- echo=False keeps logs clean
"""

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,     # Prevent "connection closed" errors
    pool_size=20,           # Good default for medium applications
    max_overflow=10         # Extra connections when required
)
