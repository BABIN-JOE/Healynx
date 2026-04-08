# app/deps.py
from fastapi import Depends, HTTPException
from app.db.session import get_session
from typing import Generator

def get_db():
    yield from get_session()
