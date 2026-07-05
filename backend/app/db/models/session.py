from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class SessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    abandoned = "abandoned"


class InterviewSession(Base):
    """
    Bir kullanıcının tek bir mülakat oturumu.
    CV yüklemesinden raporun oluşturulmasına kadar geçen süreyi kapsar.
    """
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # CV Analyzer Agent'a gidecek ham veriler
    cv_filename = Column(String, nullable=True)    # "ahmet_cv.pdf"
    cv_raw_text = Column(String, nullable=True)    # pdfplumber çıktısı (ham metin)

    status = Column(SAEnum(SessionStatus), default=SessionStatus.active, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # İlişkiler
    user = relationship("User", back_populates="sessions")
    cv_profile = relationship("CVProfile", back_populates="session", uselist=False)
    messages = relationship(
        "Message",
        back_populates="session",
        order_by="Message.created_at"   # hafıza için kronolojik sıra önemli
    )
    report = relationship("Report", back_populates="session", uselist=False)
