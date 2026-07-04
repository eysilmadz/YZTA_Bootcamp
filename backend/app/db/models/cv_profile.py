from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import JSON
from app.db.base import Base


class CVProfile(Base):
    """
    CV Analyzer Agent (Gemini 1.5 Flash) çıktısı.
    Mülakatçı ajana paslanacak yetkinlik matrisi burada saklanır.

    tech_stack örnek:
        {
            "languages": ["Python", "Dart"],
            "frameworks": ["FastAPI", "Flutter"],
            "tools": ["Docker", "Git"],
            "databases": ["PostgreSQL"]
        }

    strengths_weaknesses örnek:
        {
            "strong": ["FastAPI", "REST API tasarımı"],
            "weak": ["Docker networking", "test yazma"]
        }
    """
    __tablename__ = "cv_profiles"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), unique=True, nullable=False)

    level = Column(String, nullable=True)              # "Junior" / "Mid" / "Senior"
    tech_stack = Column(JSON, nullable=True)           # yukarıdaki örnek yapı
    strengths_weaknesses = Column(JSON, nullable=True) # yukarıdaki örnek yapı
    raw_analysis = Column(String, nullable=True)       # ajanın tam metin ham çıktısı

    # İlişkiler
    session = relationship("InterviewSession", back_populates="cv_profile")
