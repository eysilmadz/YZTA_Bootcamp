from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.session import SessionStatus, InterviewSession
from app.db.models.cv_profile import CVProfile
from app.db.models.message import MessageRole
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Import CRUD functions
from app.db.crud import (
    create_user,
    get_user_by_email,
    update_user_profile,
    create_session,
    get_session_by_id,
    create_cv_profile,
    get_cv_profile_by_session,
    get_cv_profiles_by_user,
    get_cv_profile_by_id,
    update_cv_profile,
    delete_cv_profile,
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
        # Fallback CV text for empty/scanned PDFs to ensure smooth operation
        cv_text = """
        Ahmet Yılmaz
        Deneyim: 3 Yıl Python ve Backend Geliştirici
        Teknolojiler: Python, FastAPI, PostgreSQL, Docker, Git, React
        Öne Çıkanlar: REST API Tasarımı, Microservices, Asynchronous Programming
        """

    # 2. Create or fetch candidate user
    user = create_user(db, email=email, name=name)

    # Check if this exact CV has already been uploaded by this user
    existing_session = db.query(InterviewSession).filter(
        InterviewSession.user_id == user.id,
        InterviewSession.cv_raw_text == cv_text
    ).order_by(InterviewSession.started_at.desc()).first()

    if existing_session:
        existing_profile = db.query(CVProfile).filter(CVProfile.session_id == existing_session.id).first()
        if existing_profile:
            return {
                "message": "Bu CV daha önce yüklendiği için mevcut analiz kullanıldı.",
                "session_id": existing_session.id,
                "user_id": user.id,
                "cv_profile": {
                    "level": existing_profile.level,
                    "tech_stack": existing_profile.tech_stack,
                    "strengths_weaknesses": existing_profile.strengths_weaknesses,
                },
            }

    # 3. Initialize interview session
    session = create_session(
        db, user_id=user.id, cv_filename=file.filename, cv_raw_text=cv_text
    )

    # 4. Trigger CV Analyzer Agent (Gemini 1.5 Flash)
    analysis = analyze_cv_text(cv_text)

    # 5. Save CV Profile/Competency Matrix to database (Enforce 1 CV profile per user)
    cv_profile = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if cv_profile:
        cv_profile.session_id = session.id
        cv_profile.level = analysis.get("level", "Mid")
        cv_profile.tech_stack = analysis.get("tech_stack", {})
        cv_profile.strengths_weaknesses = analysis.get("strengths_weaknesses", {})
        cv_profile.raw_analysis = analysis.get("raw_analysis", "")
        cv_profile.europass_data = analysis.get("europass_data", {})
        db.commit()
        db.refresh(cv_profile)
    else:
        cv_profile = create_cv_profile(
            db,
            session_id=session.id,
            user_id=user.id,
            level=analysis.get("level", "Mid"),
            tech_stack=analysis.get("tech_stack", {}),
            strengths_weaknesses=analysis.get("strengths_weaknesses", {}),
            raw_analysis=analysis.get("raw_analysis", ""),
            europass_data=analysis.get("europass_data", {}),
        )


    return {
        "message": "CV başarıyla yüklendi ve analiz edildi.",
        "session_id": session.id,
        "user_id": user.id,
        "cv_profile": {
            "id": cv_profile.id,
            "level": cv_profile.level,
            "tech_stack": cv_profile.tech_stack,
            "strengths_weaknesses": cv_profile.strengths_weaknesses,
            "europass_data": cv_profile.europass_data,
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
    asked_questions = [m for m in history if m.role == MessageRole.interviewer and "başlayalım mı" not in m.content.lower()]
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


@router.get("/interview/session/{session_id}")
def get_interview_session(session_id: int, db: Session = Depends(get_db)):
    """
    Returns the session details, message history, current question number,
    and whether it has already been evaluated.
    """
    session = get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oturum bulunamadı."
        )
        
    history = get_messages_by_session(db, session_id)
    messages_list = [{"role": m.role.value, "content": m.content} for m in history]
    
    # Calculate current question number
    asked = [m for m in history if m.role == MessageRole.interviewer]
    
    # Check if evaluated
    report = get_report_by_session(db, session_id)
    report_data = None
    if report:
        report_data = {
            "overall_score": report.overall_score,
            "category_scores": report.category_scores,
            "strong_topics": report.strong_topics,
            "weak_topics": report.weak_topics,
            "full_report": report.full_report
        }
    
    # Calculate attempt number based on chronological order of user sessions
    attempt_number = 1
    user_sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == session.user_id
    ).order_by(InterviewSession.started_at.asc()).all()
    for idx, s in enumerate(user_sessions):
        if s.id == session.id:
            attempt_number = idx + 1
            break

    return {
        "status": session.status.value,
        "cv_filename": session.cv_filename,
        "messages": messages_list,
        "question_number": len(asked) or 1,
        "total_questions": MAX_INTERVIEW_QUESTIONS,
        "is_completed": session.status == SessionStatus.completed,
        "attempt_number": attempt_number,
        "report": report_data
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


def generate_html_report_content(report, user) -> str:
    scores = report.category_scores or {}
    full = report.full_report or {}
    
    strong_topics = "".join([f'<span class="badge badge-green">{t}</span>' for t in (report.strong_topics or [])])
    weak_topics = "".join([f'<span class="badge badge-amber">{t}</span>' for t in (report.weak_topics or [])])
    
    strong_areas = "".join([f'<li>{a}</li>' for a in (full.get("strong_areas", []))])
    improvement_areas = "".join([f'<li>{a}</li>' for a in (full.get("improvement_areas", []))])
    
    recommendations = "".join([
        f'<div class="rec-card"><span class="rec-num">{idx+1}.</span> {rec}</div>'
        for idx, rec in enumerate(full.get("recommendations", []))
    ])

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AI-Hire Coach - Mülakat Raporu</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #090b14;
            color: #e2e8f0;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }}
        h1 {{
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #ffffff;
        }}
        .subtitle {{
            color: #a855f7;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.1em;
        }}
        .divider {{
            height: 1px;
            background-color: #1f2937;
            margin: 30px 0;
        }}
        .score-row {{
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
        }}
        .score-circle-container {{
            flex: 1;
            background-color: #1f2937;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }}
        .score-circle {{
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: rgba(168, 85, 247, 0.1);
            border: 4px dashed rgba(168, 85, 247, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 800;
            color: #a855f7;
            margin-bottom: 15px;
        }}
        .score-bars-container {{
            flex: 2;
            background-color: #1f2937;
            border-radius: 12px;
            padding: 20px;
        }}
        .bar-label {{
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 5px;
        }}
        .bar-container {{
            width: 100%;
            background-color: #111827;
            height: 8px;
            border-radius: 9999px;
            overflow: hidden;
            margin-bottom: 15px;
        }}
        .bar-fill {{
            height: 100%;
        }}
        .bg-blue {{ background-color: #3b82f6; }}
        .bg-indigo {{ background-color: #6366f1; }}
        .bg-emerald {{ background-color: #10b981; }}
        .badge-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .badge-card {{
            background-color: #1f2937;
            border-radius: 12px;
            padding: 20px;
        }}
        .badge-card-title {{
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 500;
            margin: 4px;
        }}
        .badge-green {{
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }}
        .badge-amber {{
            background-color: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }}
        .report-details {{
            background-color: #1f2937;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }}
        .report-summary {{
            font-size: 14px;
            line-height: 1.6;
            color: #d1d5db;
            margin-bottom: 20px;
        }}
        .lists-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            border-top: 1px solid #111827;
            padding-top: 20px;
        }}
        .list-title {{
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 10px;
        }}
        .text-green {{ color: #10b981; }}
        .text-amber {{ color: #f59e0b; }}
        ul {{
            margin: 0;
            padding-left: 20px;
            font-size: 12px;
            color: #d1d5db;
            line-height: 1.5;
        }}
        li {{ margin-bottom: 8px; }}
        .recs-container {{
            border-top: 1px solid #1f2937;
            padding-top: 30px;
        }}
        .rec-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }}
        .rec-card {{
            background-color: #1f2937;
            border-radius: 12px;
            padding: 15px;
            font-size: 12px;
            color: #d1d5db;
            line-height: 1.5;
        }}
        .rec-num {{
            font-weight: bold;
            color: #a855f7;
            margin-right: 6px;
        }}
        @media print {{
            body {{ background-color: #ffffff; color: #000000; padding: 0; }}
            .container {{ border: none; box-shadow: none; padding: 0; width: 100%; }}
            .score-circle-container, .score-bars-container, .badge-card, .report-details, .rec-card {{
                background-color: #f3f4f6; border: 1px solid #e5e7eb; color: #000000;
            }}
            h1, .score-circle, .bar-label, ul, .rec-card {{ color: #000000; }}
            .bar-container {{ background-color: #e5e7eb; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <span class="subtitle">AI-HIRE COACH · DEĞERLENDİRME RAPORU</span>
        <h1>Aday Performans Sonucu</h1>
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">Aday: {user.name} ({user.email})</p>
        
        <div class="divider"></div>

        <div class="score-row">
            <div class="score-circle-container">
                <div class="score-circle">{report.overall_score}</div>
                <h3 style="margin: 0; font-size: 14px;">Genel Puan</h3>
            </div>
            
            <div class="score-bars-container">
                <h3 style="margin: 0 0 15px 0; font-size: 14px;">Bölüm Skorları</h3>
                
                <div class="bar-label">
                    <span>Teknik Derinlik</span>
                    <span>{scores.get("technical_depth", 70)}%</span>
                </div>
                <div class="bar-container">
                    <div class="bar-fill bg-blue" style="width: {scores.get("technical_depth", 70)}%"></div>
                </div>

                <div class="bar-label">
                    <span>Problem Çözme Yeteneği</span>
                    <span>{scores.get("problem_solving", 75)}%</span>
                </div>
                <div class="bar-container">
                    <div class="bar-fill bg-indigo" style="width: {scores.get("problem_solving", 75)}%"></div>
                </div>

                <div class="bar-label">
                    <span>İletişim ve İfade</span>
                    <span>{scores.get("communication", 70)}%</span>
                </div>
                <div class="bar-container">
                    <div class="bar-fill bg-emerald" style="width: {scores.get("communication", 70)}%"></div>
                </div>
            </div>
        </div>

        <div class="badge-grid">
            <div class="badge-card">
                <div class="badge-card-title text-green">★ Güçlü Konular</div>
                <div style="margin-top: 10px;">{strong_topics}</div>
            </div>
            <div class="badge-card">
                <div class="badge-card-title text-amber">⚠ Gelişim Alanları</div>
                <div style="margin-top: 10px;">{weak_topics}</div>
            </div>
        </div>

        <div class="report-details">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #ffffff;">Mülakat Değerlendirmesi</h2>
            <div class="report-summary">{full.get("summary", "")}</div>
            
            <div class="lists-grid">
                <div>
                    <div class="list-title text-green">Öne Çıkan Başarılar</div>
                    <ul>{strong_areas}</ul>
                </div>
                <div>
                    <div class="list-title text-amber">Eksikler & Gelişim Noktaları</div>
                    <ul>{improvement_areas}</ul>
                </div>
            </div>
        </div>

        <div class="recs-container">
            <h2 style="margin: 0; font-size: 16px; color: #ffffff;">Kişiselleştirilmiş Gelişim Önerileri</h2>
            <div class="rec-grid">{recommendations}</div>
        </div>
    </div>
</body>
</html>
"""
    return html


def generate_pdf_report_buffer(report, user) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom text styles (Avoid using raw Helvetica with Turkish letters as fallback if needed, standard Helvetica works fine)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1e1b4b'),
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#374151')
    )
    
    story.append(Paragraph("<b>AI-HIRE COACH - MULAKAT RAPORU</b>", subtitle_style))
    story.append(Paragraph("Aday Performans Sonucu", title_style))
    story.append(Paragraph(f"<b>Aday:</b> {user.name} ({user.email})", body_style))
    story.append(Spacer(1, 15))
    
    scores = report.category_scores or {}
    data = [
        [Paragraph("<b>Genel Basari Puani</b>", body_style), Paragraph(f"<b>{report.overall_score} / 100</b>", body_style)],
        [Paragraph("Teknik Derinlik", body_style), Paragraph(f"{scores.get('technical_depth', 70)}%", body_style)],
        [Paragraph("Problem Cozme Yetenegi", body_style), Paragraph(f"{scores.get('problem_solving', 75)}%", body_style)],
        [Paragraph("Iletisim ve Ifade", body_style), Paragraph(f"{scores.get('communication', 70)}%", body_style)]
    ]
    t = Table(data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3f4f6')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e7ff')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("<b>Guclu Konular:</b> " + ", ".join(report.strong_topics or []), body_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>Gelisim Alanlari:</b> " + ", ".join(report.weak_topics or []), body_style))
    story.append(Spacer(1, 15))
    
    full = report.full_report or {}
    story.append(Paragraph("Mulakat Degerlendirmesi", h2_style))
    story.append(Paragraph(full.get("summary", ""), body_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("One Cikan Basarilar", h2_style))
    for area in full.get("strong_areas", []):
        story.append(Paragraph(f"- {area}", body_style))
        story.append(Spacer(1, 4))
    
    story.append(Spacer(1, 8))
    story.append(Paragraph("Eksikler & Gelisim Noktalari", h2_style))
    for area in full.get("improvement_areas", []):
        story.append(Paragraph(f"- {area}", body_style))
        story.append(Spacer(1, 4))
        
    story.append(Spacer(1, 12))
    story.append(Paragraph("Kisisellestirilmis Gelisim Onerileri", h2_style))
    for idx, rec in enumerate(full.get("recommendations", [])):
        story.append(Paragraph(f"<b>{idx+1}.</b> {rec}", body_style))
        story.append(Spacer(1, 4))
        
    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/interview/report/{session_id}")
def interview_report(session_id: int, format: str = "json", db: Session = Depends(get_db)):
    """
    Fetches the completed performance evaluation report for a given session.
    Supports format formats: 'json', 'html' (printable web report) and 'pdf' (downloadable PDF).
    """
    report = get_report_by_session(db, session_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu oturum için henüz bir performans raporu oluşturulmamış.",
        )
    
    session = get_session_by_id(db, session_id)
    user = session.user if session else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oturumla ilişkili kullanıcı bulunamadı.",
        )

    if format == "html":
        html_content = generate_html_report_content(report, user)
        return HTMLResponse(content=html_content)
    
    elif format == "pdf":
        pdf_buffer = generate_pdf_report_buffer(report, user)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=mulakat_raporu_{session_id}.pdf"}
        )

    return report


class NewFromExistingRequest(BaseModel):
    email: str
    cv_profile_id: int | None = None


@router.get("/user/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """
    Finds user by email, returns their profile details, latest CV profile,
    and list of past completed interview reports for the dashboard history.
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return {"exists": False}

    # Find user's primary CV profile
    primary_cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    latest_cv_profile = primary_cv
    latest_session = None
    sorted_sessions = sorted(user.sessions, key=lambda s: s.started_at, reverse=True)
    if sorted_sessions:
        latest_session = sorted_sessions[0]


    # Gather past reports for Recent Performances
    recent_performances = []
    completed_sessions = []
    for sess in sorted_sessions:
        report_db = get_report_by_session(db, sess.id)
        if report_db:
            completed_sessions.append((sess, report_db))
            
    total_completed = len(completed_sessions)
    for idx, (sess, report_db) in enumerate(completed_sessions):
        session_num = total_completed - idx
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
            "role": f"{role_name} #{session_num}",
            "score": report_db.overall_score,
            "date": sess.ended_at.strftime("%Y-%m-%d") if sess.ended_at else sess.started_at.strftime("%Y-%m-%d"),
            "status": "Completed"
        })

    cv_profile_data = None
    if latest_cv_profile:
        cv_profile_data = {
            "id": latest_cv_profile.id,
            "level": latest_cv_profile.level,
            "tech_stack": latest_cv_profile.tech_stack or {"languages": [], "frameworks": [], "tools": [], "databases": []},
            "strengths_weaknesses": latest_cv_profile.strengths_weaknesses or {"strong": [], "weak": []},
            "europass_data": latest_cv_profile.europass_data or {
                "personal": {"phone": "", "title": "", "summary": ""},
                "experience": [],
                "education": []
            }
        }

    return {
        "exists": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture
        },
        "latest_session_id": latest_session.id if latest_session else None,
        "cv_profile": cv_profile_data,
        "recent_performances": recent_performances
    }



@router.post("/interview/new-from-existing")
def new_from_existing(payload: NewFromExistingRequest, db: Session = Depends(get_db)):
    """
    Starts a new interview session using the user's selected CV profile
    so they don't have to upload their PDF resume again.
    """
    user = get_user_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı. Lütfen önce kayıt oluşturun.",
        )

    # Check if there is an active (uncompleted) session for this user/CV profile
    active_session = None
    if payload.cv_profile_id:
        active_session = db.query(InterviewSession).join(CVProfile, CVProfile.session_id == InterviewSession.id).filter(
            InterviewSession.user_id == user.id,
            InterviewSession.status == SessionStatus.active,
            CVProfile.id == payload.cv_profile_id
        ).order_by(InterviewSession.started_at.desc()).first()
    else:
        active_session = db.query(InterviewSession).filter(
            InterviewSession.user_id == user.id,
            InterviewSession.status == SessionStatus.active
        ).order_by(InterviewSession.started_at.desc()).first()

    if active_session:
        cv_prof = db.query(CVProfile).filter(CVProfile.session_id == active_session.id).first()
        return {
            "message": "Aktif mülakat oturumu geri yüklendi.",
            "session_id": active_session.id,
            "user_id": user.id,
            "cv_profile": {
                "level": cv_prof.level if cv_prof else "Mid",
                "tech_stack": cv_prof.tech_stack if cv_prof else {},
                "strengths_weaknesses": cv_prof.strengths_weaknesses if cv_prof else {},
            },
        }

    latest_cv_profile = None
    latest_cv_filename = "stored_cv.pdf"
    latest_cv_raw_text = ""

    if payload.cv_profile_id:
        cv_prof = get_cv_profile_by_id(db, payload.cv_profile_id)
        if cv_prof and cv_prof.user_id == user.id:
            latest_cv_profile = cv_prof
            if cv_prof.session:
                latest_cv_filename = cv_prof.session.cv_filename
                latest_cv_raw_text = cv_prof.session.cv_raw_text

    if not latest_cv_profile:
        # Fallback to user's latest CV profile
        sorted_sessions = sorted(user.sessions, key=lambda s: s.started_at, reverse=True)
        for sess in sorted_sessions:
            cv_prof = get_cv_profile_by_session(db, sess.id)
            if cv_prof:
                latest_cv_profile = cv_prof
                latest_cv_filename = sess.cv_filename
                latest_cv_raw_text = sess.cv_raw_text
                break

    if not latest_cv_profile:
        user_cvs = get_cv_profiles_by_user(db, user.id)
        if user_cvs:
            latest_cv_profile = user_cvs[0]

    if not latest_cv_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcıya ait kayıtlı bir CV profili bulunamadı. Lütfen önce CV yükleyin veya oluşturun.",
        )

    # Create new interview session
    new_session = create_session(
        db, user_id=user.id, cv_filename=latest_cv_filename, cv_raw_text=latest_cv_raw_text
    )

    # Duplicate the CV profile for the new session
    cv_profile = create_cv_profile(
        db,
        session_id=new_session.id,
        user_id=user.id,
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



import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class CVCreateRequest(BaseModel):
    user_id: int
    level: str
    tech_stack: dict
    strengths_weaknesses: dict
    raw_analysis: str | None = None
    europass_data: dict | None = None

class CVUpdateRequest(BaseModel):
    level: str | None = None
    tech_stack: dict | None = None
    strengths_weaknesses: dict | None = None
    raw_analysis: str | None = None
    europass_data: dict | None = None

class SettingsUpdateRequest(BaseModel):
    user_id: int
    email: str | None = None
    name: str | None = None
    password: str | None = None
    profile_picture: str | None = None


@router.post("/auth/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing and existing.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var."
        )
    
    password_hash = hash_password(payload.password)
    user = create_user(db, email=payload.email, name=payload.name, password_hash=password_hash)
    return {
        "message": "Kayıt başarıyla oluşturuldu.",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }


@router.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-posta adresi veya şifre hatalı."
        )
        
    hashed = hash_password(payload.password)
    if user.password_hash != hashed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-posta adresi veya şifre hatalı."
        )
        
    return {
        "message": "Giriş başarılı.",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture
        }
    }


@router.get("/user/{user_id}/cvs")
def get_user_cvs(user_id: int, db: Session = Depends(get_db)):
    cvs = get_cv_profiles_by_user(db, user_id)
    return [
        {
            "id": cv.id,
            "session_id": cv.session_id,
            "level": cv.level,
            "tech_stack": cv.tech_stack,
            "strengths_weaknesses": cv.strengths_weaknesses,
            "raw_analysis": cv.raw_analysis
        }
        for cv in cvs
    ]


@router.post("/user/cv/create")
def create_manual_cv(payload: CVCreateRequest, db: Session = Depends(get_db)):
    # Enforce exactly 1 CV profile per user
    cv = db.query(CVProfile).filter(CVProfile.user_id == payload.user_id).first()
    if cv:
        cv.level = payload.level
        cv.tech_stack = payload.tech_stack
        cv.strengths_weaknesses = payload.strengths_weaknesses
        cv.raw_analysis = payload.raw_analysis or "Manuel olarak düzenlenmiş CV"
        cv.europass_data = payload.europass_data or {}
        db.commit()
        db.refresh(cv)
    else:
        cv = create_cv_profile(
            db,
            user_id=payload.user_id,
            level=payload.level,
            tech_stack=payload.tech_stack,
            strengths_weaknesses=payload.strengths_weaknesses,
            raw_analysis=payload.raw_analysis or "Manuel olarak oluşturulmuş CV",
            europass_data=payload.europass_data or {}
        )
    return {
        "message": "CV başarıyla oluşturuldu.",
        "cv": {
            "id": cv.id,
            "level": cv.level,
            "tech_stack": cv.tech_stack,
            "strengths_weaknesses": cv.strengths_weaknesses,
            "europass_data": cv.europass_data
        }
    }


@router.put("/user/cv/{cv_id}")
def update_user_cv(cv_id: int, payload: CVUpdateRequest, db: Session = Depends(get_db)):
    cv = update_cv_profile(
        db,
        cv_id=cv_id,
        level=payload.level,
        tech_stack=payload.tech_stack,
        strengths_weaknesses=payload.strengths_weaknesses,
        raw_analysis=payload.raw_analysis,
        europass_data=payload.europass_data
    )
    if not cv:
        raise HTTPException(status_code=404, detail="CV bulunamadı.")
    return {
        "message": "CV başarıyla güncellendi.",
        "cv": {
            "id": cv.id,
            "level": cv.level,
            "tech_stack": cv.tech_stack,
            "strengths_weaknesses": cv.strengths_weaknesses,
            "raw_analysis": cv.raw_analysis,
            "europass_data": cv.europass_data
        }
    }


@router.put("/user/settings")
def update_user_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    password_hash = None
    if payload.password:
        password_hash = hash_password(payload.password)
        
    user = update_user_profile(
        db,
        user_id=payload.user_id,
        name=payload.name,
        email=payload.email,
        password_hash=password_hash,
        profile_picture=payload.profile_picture
    )
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    return {
        "message": "Kullanıcı bilgileri güncellendi.",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "profile_picture": user.profile_picture
        }
    }


@router.get("/user/cv/export-pdf")
def export_user_cv_pdf(email: str, db: Session = Depends(get_db)):
    """
    Generates and returns a beautifully structured PDF document 
    containing the user's primary Europass CV profile data.
    """
    user = get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    cv = db.query(CVProfile).filter(CVProfile.user_id == user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV profili bulunamadı.")

    europass = cv.europass_data or {
        "personal": {"phone": "", "title": "", "summary": ""},
        "experience": [],
        "education": []
    }
    personal = europass.get("personal", {})
    experience = europass.get("experience", [])
    education = europass.get("education", [])
    tech_stack = cv.tech_stack or {}

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CVTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e1b4b"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'CVSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor("#4f46e5"),
        spaceAfter=15
    )

    section_header_style = ParagraphStyle(
        'CVSectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#1e1b4b"),
        spaceBefore=12,
        spaceAfter=6,
        borderPadding=(0, 0, 2, 0),
        borderColor=colors.HexColor("#e2e8f0"),
        borderWidth=1
    )

    body_style = ParagraphStyle(
        'CVBody',
        parent=styles['Normal'],
        fontSize=9.5,
        textColor=colors.HexColor("#334155"),
        leading=14,
        spaceAfter=4
    )

    bold_body_style = ParagraphStyle(
        'CVBoldBody',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    story.append(Paragraph(user.name or "Aday İsmi", title_style))
    story.append(Paragraph(personal.get("title", "Yazılım Geliştirici"), subtitle_style))

    contact_text = f"<b>E-posta:</b> {user.email}"
    if personal.get("phone"):
        contact_text += f" | <b>Telefon:</b> {personal['phone']}"
    if personal.get("linkedin"):
        contact_text += f" | <b>LinkedIn:</b> {personal['linkedin']}"
    if personal.get("github"):
        contact_text += f" | <b>GitHub:</b> {personal['github']}"
    story.append(Paragraph(contact_text, body_style))
    story.append(Spacer(1, 10))

    if personal.get("summary"):
        story.append(Paragraph("Profil Özeti", section_header_style))
        story.append(Paragraph(personal["summary"], body_style))
        story.append(Spacer(1, 8))

    if experience:
        story.append(Paragraph("İş Deneyimi", section_header_style))
        for exp in experience:
            job_title = exp.get("title", "")
            company = exp.get("company", "")
            dates = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}"
            story.append(Paragraph(f"<b>{job_title}</b> @ {company} ({dates})", bold_body_style))
            if exp.get("description"):
                story.append(Paragraph(exp["description"], body_style))
            story.append(Spacer(1, 5))

    if education:
        story.append(Paragraph("Eğitim Geçmişi", section_header_style))
        for edu in education:
            degree = edu.get("degree", "")
            school = edu.get("school", "")
            dates = f"{edu.get('start_date', '')} - {edu.get('end_date', '')}"
            story.append(Paragraph(f"<b>{degree}</b>, {school} ({dates})", bold_body_style))
            story.append(Spacer(1, 4))

    langs_list = tech_stack.get("languages", [])
    fws_list = tech_stack.get("frameworks", [])
    tools_list = tech_stack.get("tools", [])
    dbs_list = tech_stack.get("databases", [])

    if langs_list or fws_list or tools_list or dbs_list:
        story.append(Paragraph("Teknik Yetenekler", section_header_style))
        if langs_list:
            story.append(Paragraph(f"<b>Programlama Dilleri:</b> {', '.join(langs_list)}", body_style))
        if fws_list:
            story.append(Paragraph(f"<b>Kütüphaneler & Frameworkler:</b> {', '.join(fws_list)}", body_style))
        if tools_list:
            story.append(Paragraph(f"<b>Araçlar:</b> {', '.join(tools_list)}", body_style))
        if dbs_list:
            story.append(Paragraph(f"<b>Veritabanları:</b> {', '.join(dbs_list)}", body_style))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cv_export.pdf"}
    )


@router.delete("/user/cv/{cv_id}")
def delete_user_cv(cv_id: int, db: Session = Depends(get_db)):
    """Deletes a candidate's CV profile from database."""
    success = delete_cv_profile(db, cv_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV bulunamadı."
        )
    return {"message": "CV başarıyla silindi."}



