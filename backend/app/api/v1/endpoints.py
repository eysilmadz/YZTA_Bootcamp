from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.session import SessionStatus
from app.db.models.message import MessageRole

# Import CRUD functions
from app.db.crud import (
    create_user,
    get_user_by_email,
    create_session,
    get_session_by_id,
    create_cv_profile,
    get_cv_profile_by_session,
    add_message,
    get_messages_by_session,
    end_session,
    create_report,
    get_report_by_session,
)

# Import Services
from app.services.cv_parser import extract_text_from_pdf_bytes
from app.services.agent_service import (
    analyze_cv_text,
    generate_next_question,
    evaluate_interview,
)

from pydantic import BaseModel

router = APIRouter()

# Target Q&A round count (how many questions the AI asks)
MAX_INTERVIEW_QUESTIONS = 5


# Request schemas
class StartRequest(BaseModel):
    session_id: int


class AnswerRequest(BaseModel):
    session_id: int
    answer: str


class EndRequest(BaseModel):
    session_id: int


@router.post("/upload-cv", status_code=status.HTTP_201_CREATED)
async def upload_cv(
    email: str = Form(...),
    name: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Accepts candidate PDF resume, extracts the raw text, starts a new interview session,
    analyzes it using the CV Analyzer Agent, and saves the competency matrix.
    """
    # 1. Validate PDF file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnızca PDF formatındaki CV dosyaları desteklenmektedir.",
        )

    try:
        pdf_bytes = await file.read()
        cv_text = extract_text_from_pdf_bytes(pdf_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF metni ayrıştırılamadı: {str(e)}",
        )

    if not cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seçilen PDF dosyasından metin çıkartılamadı. Dosyanın boş olmadığından emin olun.",
        )

    # 2. Create or fetch candidate user
    user = create_user(db, email=email, name=name)

    # 3. Initialize interview session
    session = create_session(
        db, user_id=user.id, cv_filename=file.filename, cv_raw_text=cv_text
    )

    # 4. Trigger CV Analyzer Agent (Gemini 1.5 Flash)
    analysis = analyze_cv_text(cv_text)

    # 5. Save CV Profile/Competency Matrix to database
    cv_profile = create_cv_profile(
        db,
        session_id=session.id,
        level=analysis.get("level", "Mid"),
        tech_stack=analysis.get("tech_stack", {}),
        strengths_weaknesses=analysis.get("strengths_weaknesses", {}),
        raw_analysis=analysis.get("raw_analysis", ""),
    )

    return {
        "message": "CV başarıyla yüklendi ve analiz edildi.",
        "session_id": session.id,
        "user_id": user.id,
        "cv_profile": {
            "level": cv_profile.level,
            "tech_stack": cv_profile.tech_stack,
            "strengths_weaknesses": cv_profile.strengths_weaknesses,
        },
    }


@router.post("/interview/start")
def interview_start(payload: StartRequest, db: Session = Depends(get_db)):
    """
    Starts the interview by generating the first technical question.
    """
    session = get_session_by_id(db, payload.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mülakat oturumu bulunamadı.",
        )

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu mülakat oturumu aktif değil.",
        )

    # Retrieve CV competency matrix
    cv_profile = get_cv_profile_by_session(db, payload.session_id)
    if not cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu oturum için analiz edilmiş CV profili bulunamadı.",
        )

    # Check if there are already questions in the history to avoid duplicate startup
    history = get_messages_by_session(db, payload.session_id)
    questions = [m for m in history if m.role == MessageRole.interviewer]
    if len(questions) > 0:
        return {
            "question": questions[0].content,
            "question_number": 1,
            "total_questions": MAX_INTERVIEW_QUESTIONS,
        }

    # Generate first question (empty history)
    profile_data = {
        "level": cv_profile.level,
        "tech_stack": cv_profile.tech_stack,
        "strengths_weaknesses": cv_profile.strengths_weaknesses,
        "session_id": session.id,
    }
    
    first_question = generate_next_question(profile_data, [])
    
    # Save interviewer message
    add_message(
        db,
        session_id=session.id,
        role=MessageRole.interviewer,
        content=first_question,
    )

    return {
        "question": first_question,
        "question_number": 1,
        "total_questions": MAX_INTERVIEW_QUESTIONS,
    }


@router.post("/interview/answer")
def interview_answer(payload: AnswerRequest, db: Session = Depends(get_db)):
    """
    Submits candidate's answer, and generates the next question.
    If the max question count is reached, it instructs the candidate to finish.
    """
    session = get_session_by_id(db, payload.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mülakat oturumu bulunamadı.",
        )

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mülakat oturumu aktif değil.",
        )

    cv_profile = get_cv_profile_by_session(db, payload.session_id)
    if not cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV profili bulunamadı.",
        )

    # 1. Save user's answer
    add_message(
        db,
        session_id=session.id,
        role=MessageRole.candidate,
        content=payload.answer.strip(),
    )

    # Get updated message history
    history = get_messages_by_session(db, payload.session_id)
    history_list = [{"role": m.role.value, "content": m.content} for m in history]

    # Calculate question count
    asked_questions = [m for m in history if m.role == MessageRole.interviewer]
    q_count = len(asked_questions)

    # 2. Check if we reached the maximum questions limit
    if q_count >= MAX_INTERVIEW_QUESTIONS:
        return {
            "question": None,
            "interview_completed": True,
            "message": "Tebrikler, mülakat aşaması tamamlandı! Sonuçlarınızı ve performans raporunuzu görmek için lütfen mülakatı sonlandırın.",
        }

    # 3. Generate next question
    profile_data = {
        "level": cv_profile.level,
        "tech_stack": cv_profile.tech_stack,
        "strengths_weaknesses": cv_profile.strengths_weaknesses,
        "session_id": session.id,
    }
    
    next_q = generate_next_question(profile_data, history_list)

    # 4. Save question
    add_message(
        db,
        session_id=session.id,
        role=MessageRole.interviewer,
        content=next_q,
    )

    return {
        "question": next_q,
        "question_number": q_count + 1,
        "total_questions": MAX_INTERVIEW_QUESTIONS,
        "interview_completed": False,
    }


@router.post("/interview/end")
def interview_end(payload: EndRequest, db: Session = Depends(get_db)):
    """
    Completes the session, evaluates the transcript using the Performance Evaluator Agent,
    saves the final scorecard report to the database, and returns it.
    """
    session = get_session_by_id(db, payload.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mülakat oturumu bulunamadı.",
        )

    # Get CV Profile
    cv_profile = get_cv_profile_by_session(db, payload.session_id)
    if not cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CV profili bulunamadı.",
        )

    # check if report already exists
    existing_report = get_report_by_session(db, payload.session_id)
    if existing_report:
        # Mark as completed just in case
        if session.status != SessionStatus.completed:
            end_session(db, payload.session_id)
        return existing_report

    # End the session
    end_session(db, payload.session_id)

    # Fetch dialogue history
    history = get_messages_by_session(db, payload.session_id)
    history_list = [{"role": m.role.value, "content": m.content} for m in history]

    # Generate Performance Report
    profile_data = {
        "level": cv_profile.level,
        "tech_stack": cv_profile.tech_stack,
    }
    
    evaluation = evaluate_interview(profile_data, history_list)

    # Save report to DB
    report_db = create_report(
        db,
        session_id=session.id,
        overall_score=evaluation.get("overall_score", 70.0),
        category_scores=evaluation.get("category_scores", {}),
        strong_topics=evaluation.get("strong_topics", []),
        weak_topics=evaluation.get("weak_topics", []),
        full_report=evaluation.get("full_report", {}),
    )

    return report_db


@router.get("/interview/report/{session_id}")
def interview_report(session_id: int, db: Session = Depends(get_db)):
    """
    Fetches the completed performance evaluation report for a given session.
    """
    report = get_report_by_session(db, session_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu oturum için henüz bir performans raporu oluşturulmamış.",
        )
    return report


class NewFromExistingRequest(BaseModel):
    email: str


@router.get("/user/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """
    Finds user by email, returns their profile details, latest CV profile,
    and list of past completed interview reports for the dashboard history.
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return {"exists": False}

    # Find latest session and its CV profile
    latest_session = None
    latest_cv_profile = None
    
    sorted_sessions = sorted(user.sessions, key=lambda s: s.started_at, reverse=True)
    for sess in sorted_sessions:
        cv_prof = get_cv_profile_by_session(db, sess.id)
        if cv_prof:
            latest_session = sess
            latest_cv_profile = cv_prof
            break

    # Gather past reports for Recent Performances
    recent_performances = []
    for sess in sorted_sessions:
        report_db = get_report_by_session(db, sess.id)
        if report_db:
            role_name = "Teknik Mülakat Simülasyonu"
            if latest_cv_profile and latest_cv_profile.tech_stack:
                fws = latest_cv_profile.tech_stack.get("frameworks", [])
                langs = latest_cv_profile.tech_stack.get("languages", [])
                if fws:
                    role_name = f"{fws[0]} Geliştirici Mülakatı"
                elif langs:
                    role_name = f"{langs[0]} Geliştirici Mülakatı"

            recent_performances.append({
                "session_id": sess.id,
                "role": role_name,
                "score": report_db.overall_score,
                "date": sess.ended_at.strftime("%Y-%m-%d") if sess.ended_at else sess.started_at.strftime("%Y-%m-%d"),
                "status": "Completed"
            })

    cv_profile_data = None
    if latest_cv_profile:
        cv_profile_data = {
            "level": latest_cv_profile.level,
            "tech_stack": latest_cv_profile.tech_stack,
            "strengths_weaknesses": latest_cv_profile.strengths_weaknesses,
        }

    return {
        "exists": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        },
        "latest_session_id": latest_session.id if latest_session else None,
        "cv_profile": cv_profile_data,
        "recent_performances": recent_performances
    }


@router.post("/interview/new-from-existing")
def new_from_existing(payload: NewFromExistingRequest, db: Session = Depends(get_db)):
    """
    Starts a new interview session using the user's latest stored CV profile
    so they don't have to upload their PDF resume again.
    """
    user = get_user_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı. Lütfen önce CV yükleyerek kayıt oluşturun.",
        )

    # Find user's latest CV profile
    latest_cv_profile = None
    latest_cv_filename = "stored_cv.pdf"
    latest_cv_raw_text = ""
    
    sorted_sessions = sorted(user.sessions, key=lambda s: s.started_at, reverse=True)
    for sess in sorted_sessions:
        cv_prof = get_cv_profile_by_session(db, sess.id)
        if cv_prof:
            latest_cv_profile = cv_prof
            latest_cv_filename = sess.cv_filename
            latest_cv_raw_text = sess.cv_raw_text
            break

    if not latest_cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcıya ait kayıtlı bir CV profili bulunamadı. Lütfen önce CV yükleyin.",
        )

    # Create new interview session
    new_session = create_session(
        db, user_id=user.id, cv_filename=latest_cv_filename, cv_raw_text=latest_cv_raw_text
    )

    # Duplicate the CV profile for the new session
    cv_profile = create_cv_profile(
        db,
        session_id=new_session.id,
        level=latest_cv_profile.level,
        tech_stack=latest_cv_profile.tech_stack,
        strengths_weaknesses=latest_cv_profile.strengths_weaknesses,
        raw_analysis=latest_cv_profile.raw_analysis,
    )

    return {
        "message": "Yeni mülakat oturumu başarıyla oluşturuldu.",
        "session_id": new_session.id,
        "user_id": user.id,
        "cv_profile": {
            "level": cv_profile.level,
            "tech_stack": cv_profile.tech_stack,
            "strengths_weaknesses": cv_profile.strengths_weaknesses,
        },
    }

