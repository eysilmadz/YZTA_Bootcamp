# backend/app/db/crud/cv_profile.py

from sqlalchemy.orm import Session
from app.db.models.cv_profile import CVProfile


def create_cv_profile(
    db: Session,
    session_id: int | None = None,
    user_id: int | None = None,
    level: str | None = None,
    tech_stack: dict | None = None,
    strengths_weaknesses: dict | None = None,
    raw_analysis: str | None = None,
    europass_data: dict | None = None,
) -> CVProfile:
    """
    CV Analyzer Agent (Gemini 1.5 Flash) çıktısını kaydeder.
    """
    profile = CVProfile(
        session_id=session_id,
        user_id=user_id,
        level=level,
        tech_stack=tech_stack,
        strengths_weaknesses=strengths_weaknesses,
        raw_analysis=raw_analysis,
        europass_data=europass_data,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_cv_profile_by_id(db: Session, cv_id: int) -> CVProfile | None:
    """ID ile CV profilini getirir."""
    return db.query(CVProfile).filter(CVProfile.id == cv_id).first()


def get_cv_profiles_by_user(db: Session, user_id: int) -> list[CVProfile]:
    """Kullanıcı ID'si ile tüm CV profillerini getirir."""
    return db.query(CVProfile).filter(CVProfile.user_id == user_id).all()


def update_cv_profile(
    db: Session,
    cv_id: int,
    level: str | None = None,
    tech_stack: dict | None = None,
    strengths_weaknesses: dict | None = None,
    raw_analysis: str | None = None,
    europass_data: dict | None = None,
) -> CVProfile | None:
    """Mevcut CV profilini günceller."""
    profile = get_cv_profile_by_id(db, cv_id)
    if not profile:
        return None
    if level is not None:
        profile.level = level
    if tech_stack is not None:
        profile.tech_stack = tech_stack
    if strengths_weaknesses is not None:
        profile.strengths_weaknesses = strengths_weaknesses
    if raw_analysis is not None:
        profile.raw_analysis = raw_analysis
    if europass_data is not None:
        profile.europass_data = europass_data
    db.commit()
    db.refresh(profile)
    return profile



def get_cv_profile_by_session(db: Session, session_id: int) -> CVProfile | None:
    """
    Session ID ile CV profilini getirir.
    Technical Interviewer Agent her mülakat başında bunu çağırır.
    """
    return db.query(CVProfile).filter(CVProfile.session_id == session_id).first()


def delete_cv_profile(db: Session, cv_id: int) -> bool:
    """CV profilini siler. Başarılıysa True, bulunamadıysa False döner."""
    profile = get_cv_profile_by_id(db, cv_id)
    if not profile:
        return False
    db.delete(profile)
    db.commit()
    return True

