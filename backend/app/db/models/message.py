from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class MessageRole(str, enum.Enum):
    interviewer = "interviewer"   # Technical Interviewer Agent (Groq/Llama 3)
    candidate = "candidate"       # Kullanıcının yazdığı cevaplar


class Message(Base):
    """
    Technical Interviewer Agent'ın konuşma hafızası.

    Her soru-cevap turu bu tabloya iki satır olarak düşer:
        - role=interviewer, content="Python'da GIL nedir?"
        - role=candidate,   content="Global Interpreter Lock..."

    LLM'e geçmiş gönderilirken:
        session.messages (order_by=created_at) → LangChain message formatına çevrilir
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    role = Column(SAEnum(MessageRole), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # İlişkiler
    session = relationship("InterviewSession", back_populates="messages")
