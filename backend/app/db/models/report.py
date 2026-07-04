from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import JSON
from app.db.base import Base


class Report(Base):
    """
    Performance Evaluator Agent (Gemini 1.5 Flash) çıktısı.
    Mülakat tamamlandığında tüm chat logu analiz edilerek buraya yazılır.

    category_scores örnek:
        {
            "technical_depth": 72,
            "problem_solving": 85,
            "communication": 68
        }

    full_report örnek yapı:
        {
            "summary": "...",
            "strong_areas": ["...", "..."],
            "improvement_areas": ["...", "..."],
            "recommendations": ["...", "..."]
        }
    """
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), unique=True, nullable=False)

    overall_score = Column(Float, nullable=True)        # 0-100 arası
    category_scores = Column(JSON, nullable=True)       # yukarıdaki örnek
    strong_topics = Column(JSON, nullable=True)         # ["FastAPI", "REST tasarımı"]
    weak_topics = Column(JSON, nullable=True)           # ["async", "Docker"]
    full_report = Column(JSON, nullable=True)           # detaylı rapor içeriği
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # İlişkiler
    session = relationship("InterviewSession", back_populates="report")
