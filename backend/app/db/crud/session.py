# backend/app/db/crud/session.py

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models.session import InterviewSession, SessionStatus


def create_session(
    db: Session,
    user_id: int,
    cv_filename: str | None = None,
    cv_raw_text: str | None = None,
) -> InterviewSession:
    """
    Yeni mülakat oturumu başlatır.
    cv_raw_text: pdfplumber'dan gelen ham metin (CV Analyzer Agent bunu okuyacak)
    """
    session = InterviewSession(
        user_id=user_id,
        cv_filename=cv_filename,
        cv_raw_text=cv_raw_text,
        status=SessionStatus.active,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_id(db: Session, session_id: int) -> InterviewSession | None:
    """Session ID ile oturum getirir. Bulunamazsa None döner."""
    return db.query(InterviewSession).filter(InterviewSession.id == session_id).first()


def update_session_status(
    db: Session,
    session_id: int,
    status: SessionStatus,
) -> InterviewSession | None:
    """
    Oturum durumunu günceller.
    Geçerli değerler: SessionStatus.active / .completed / .abandoned
    """
    session = get_session_by_id(db, session_id)
    if not session:
        return None

    session.status = status
    db.commit()
    db.refresh(session)
    return session


def end_session(db: Session, session_id: int) -> InterviewSession | None:
    """
    Mülakatı bitirir:
    - Status'u 'completed' yapar
    - ended_at'ı şimdiki zamanla doldurur
    Performance Evaluator Agent, mülakat bitmeden rapor üretemez —
    bu fonksiyon çağrıldıktan sonra rapor oluşturma süreci başlar.
    """
    session = get_session_by_id(db, session_id)
    if not session:
        return None

    session.status = SessionStatus.completed
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session
