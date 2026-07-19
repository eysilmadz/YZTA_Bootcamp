# backend/app/db/crud/user.py

from sqlalchemy.orm import Session
from app.db.models.user import User


def create_user(db: Session, email: str, name: str | None = None, password_hash: str | None = None) -> User:
    """
    Yeni kullanıcı oluşturur.
    Aynı email zaten varsa mevcut kullanıcıyı döner (upsert benzeri davranış).
    """
    existing = get_user_by_email(db, email)
    if existing:
        if password_hash and not existing.password_hash:
            existing.password_hash = password_hash
            db.commit()
            db.refresh(existing)
        return existing

    user = User(email=email, name=name, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user_id: int, name: str | None = None, email: str | None = None, password_hash: str | None = None, profile_picture: str | None = None) -> User | None:
    """Kullanıcı bilgilerini günceller."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if name is not None:
        user.name = name
    if email is not None:
        user.email = email
    if password_hash is not None:
        user.password_hash = password_hash
    if profile_picture is not None:
        user.profile_picture = profile_picture
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """ID ile kullanıcı getirir. Bulunamazsa None döner."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Email ile kullanıcı getirir. Bulunamazsa None döner."""
    return db.query(User).filter(User.email == email).first()
