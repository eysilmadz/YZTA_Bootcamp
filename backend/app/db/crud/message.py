# backend/app/db/crud/message.py

from sqlalchemy.orm import Session
from app.db.models.message import Message, MessageRole


def add_message(
    db: Session,
    session_id: int,
    role: MessageRole,
    content: str,
) -> Message:
    """
    Konuşmaya yeni bir mesaj ekler.

    Her soru-cevap turu iki ayrı çağrı gerektirir:
        add_message(db, session_id, MessageRole.interviewer, "Python'da GIL nedir?")
        add_message(db, session_id, MessageRole.candidate,   "Global Interpreter Lock...")

    Mesajlar created_at ile sıralanır — LLM'e geçmiş gönderilirken
    kronolojik sıra korunmalı, bu yüzden insert sırası önemli.
    """
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_messages_by_session(db: Session, session_id: int) -> list[Message]:
    """
    Bir oturumun tüm konuşma geçmişini kronolojik sırayla getirir.

    Kullanım — LangChain mesaj formatına dönüştürme örneği:
        messages = get_messages_by_session(db, session_id)
        history = [
            HumanMessage(content=m.content) if m.role == MessageRole.candidate
            else AIMessage(content=m.content)
            for m in messages
        ]

    Bu liste hem Technical Interviewer Agent'a (bağlam için)
    hem de Performance Evaluator Agent'a (değerlendirme için) verilecek.
    """
    return (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )


def get_message_count(db: Session, session_id: int) -> int:
    """
    Bir oturumdaki toplam mesaj sayısını döner.
    Mülakat kaç tur sürdü gibi istatistikler için kullanılabilir.
    """
    return db.query(Message).filter(Message.session_id == session_id).count()
