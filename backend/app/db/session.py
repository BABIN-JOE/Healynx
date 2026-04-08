# app/db/session.py
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator:
    with Session(engine) as session:
        yield session
