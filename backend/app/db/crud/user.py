# backend/app/db/crud/user.py

from sqlalchemy.orm import Session
from app.db.models.user import User


def create_user(db: Session, email: str, name: str | None = None) -> User:
    """
    Yeni kullanıcı oluşturur.
    Aynı email zaten varsa mevcut kullanıcıyı döner (upsert benzeri davranış).
    """
    existing = get_user_by_email(db, email)
    if existing:
        return existing

    user = User(email=email, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """ID ile kullanıcı getirir. Bulunamazsa None döner."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Email ile kullanıcı getirir. Bulunamazsa None döner."""
    return db.query(User).filter(User.email == email).first()
