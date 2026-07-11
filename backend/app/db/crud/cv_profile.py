# backend/app/db/crud/cv_profile.py

from sqlalchemy.orm import Session
from app.db.models.cv_profile import CVProfile


def create_cv_profile(
    db: Session,
    session_id: int,
    level: str | None = None,
    tech_stack: dict | None = None,
    strengths_weaknesses: dict | None = None,
    raw_analysis: str | None = None,
) -> CVProfile:
    """
    CV Analyzer Agent (Gemini 1.5 Flash) çıktısını kaydeder.

    Örnek tech_stack:
        {
            "languages": ["Python", "Dart"],
            "frameworks": ["FastAPI", "Flutter"],
            "tools": ["Docker", "Git"],
            "databases": ["PostgreSQL"]
        }

    Örnek strengths_weaknesses:
        {
            "strong": ["FastAPI", "REST API tasarımı"],
            "weak": ["Docker networking", "test yazma"]
        }

    Bu veriler Technical Interviewer Agent'a paslanacak —
    ajan buradan hangi konularda soru soracağına karar verecek.
    """
    profile = CVProfile(
        session_id=session_id,
        level=level,
        tech_stack=tech_stack,
        strengths_weaknesses=strengths_weaknesses,
        raw_analysis=raw_analysis,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_cv_profile_by_session(db: Session, session_id: int) -> CVProfile | None:
    """
    Session ID ile CV profilini getirir.
    Technical Interviewer Agent her mülakat başında bunu çağırır.
    """
    return db.query(CVProfile).filter(CVProfile.session_id == session_id).first()
