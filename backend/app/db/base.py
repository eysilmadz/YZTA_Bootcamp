# app/db/base.py
# Veritabanı bağlantısı — SQLAlchemy 2.0
# SQLite (dev) ve PostgreSQL (prod) destekli

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aihirecoach.db")

# SQLite'da check_same_thread devre dışı bırakılmalı
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI endpoint'lerinde Depends(get_db) olarak kullanılacak."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
