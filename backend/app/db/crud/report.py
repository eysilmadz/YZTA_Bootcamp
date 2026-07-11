# backend/app/db/crud/report.py

from sqlalchemy.orm import Session
from app.db.models.report import Report


def create_report(
    db: Session,
    session_id: int,
    overall_score: float | None = None,
    category_scores: dict | None = None,
    strong_topics: list | None = None,
    weak_topics: list | None = None,
    full_report: dict | None = None,
) -> Report:
    """
    Performance Evaluator Agent (Gemini 1.5 Flash) çıktısını kaydeder.
    end_session() çağrıldıktan sonra bu fonksiyon tetiklenir.

    Örnek category_scores:
        {
            "technical_depth": 72,
            "problem_solving": 85,
            "communication": 68
        }

    Örnek full_report:
        {
            "summary": "Aday FastAPI konusunda güçlü...",
            "strong_areas": ["REST tasarımı", "ORM kullanımı"],
            "improvement_areas": ["async yapılar", "Docker"],
            "recommendations": ["asyncio dökümanını oku", "Docker Compose dene"]
        }
    """
    report = Report(
        session_id=session_id,
        overall_score=overall_score,
        category_scores=category_scores,
        strong_topics=strong_topics,
        weak_topics=weak_topics,
        full_report=full_report,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report_by_session(db: Session, session_id: int) -> Report | None:
    """
    Session ID ile raporu getirir.
    Frontend rapor ekranında bunu çağırır.
    """
    return db.query(Report).filter(Report.session_id == session_id).first()
