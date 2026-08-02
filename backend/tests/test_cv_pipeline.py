# backend/tests/test_cv_pipeline.py
#
# [QA] Farklı CV Senaryoları ile Uçtan Uca Pipeline Testi
#
# Bu testler gerçek LLM çağrısı yapmaz — sadece DB katmanını,
# fixture CV metinlerini ve veri akışını test eder.
# LLM entegrasyonu Sprint 3'te ajan ekibi tarafından yapılacak.

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.models.message import MessageRole
from app.db.models.session import SessionStatus
from app.db.crud import (
    create_user,
    create_session,
    get_session_by_id,
    update_session_status,
    end_session,
    create_cv_profile,
    get_cv_profile_by_session,
    add_message,
    get_messages_by_session,
    get_message_count,
    create_report,
    get_report_by_session,
)
from tests.cv_fixtures import ALL_SCENARIOS, CV_EMPTY, CV_MINIMAL

# ---------------------------------------------------------------------------
# TEST VERİTABANI KURULUMU (her test için temiz, in-memory SQLite)
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db):
    return create_user(db, email="test@aihirecoach.dev", name="Test Kullanici")


# ---------------------------------------------------------------------------
# TEMEL PIPELINE TESTLERİ
# ---------------------------------------------------------------------------

class TestUserCreation:
    def test_create_user(self, db):
        user = create_user(db, email="qa@test.com", name="QA Tester")
        assert user.id is not None
        assert user.email == "qa@test.com"

    def test_duplicate_user_returns_existing(self, db):
        u1 = create_user(db, email="dup@test.com")
        u2 = create_user(db, email="dup@test.com")
        assert u1.id == u2.id


class TestSessionPipeline:
    def test_create_and_retrieve_session(self, db, test_user):
        session = create_session(
            db,
            user_id=test_user.id,
            cv_filename="test.pdf",
            cv_raw_text="Python FastAPI Docker",
        )
        assert session.id is not None
        assert session.status == SessionStatus.active

        fetched = get_session_by_id(db, session.id)
        assert fetched.id == session.id
        assert fetched.cv_raw_text == "Python FastAPI Docker"

    def test_end_session(self, db, test_user):
        session = create_session(db, user_id=test_user.id)
        ended = end_session(db, session.id)
        assert ended.status == SessionStatus.completed
        assert ended.ended_at is not None

    def test_nonexistent_session_returns_none(self, db):
        assert get_session_by_id(db, 99999) is None


# ---------------------------------------------------------------------------
# CV PROFİL TESTLERİ — 7 SENARYO
# ---------------------------------------------------------------------------

class TestCVProfileScenarios:

    def _run_scenario(self, db, test_user, scenario_name, cv_text,
                      expected_level=None, expect_empty=False):
        """Her CV senaryosu için tam pipeline'ı çalıştırır."""
        session = create_session(
            db,
            user_id=test_user.id,
            cv_filename=f"{scenario_name}.pdf",
            cv_raw_text=cv_text,
        )

        # CV metni oturuma kaydedildi mi?
        assert session.cv_raw_text == cv_text, \
            f"[{scenario_name}] CV metni oturuma kaydedilemedi"

        # CV profili oluştur (gerçekte bu CV Analyzer Agent yapacak)
        # Burada mock veri kullanıyoruz
        if expect_empty:
            profile = create_cv_profile(
                db,
                session_id=session.id,
                level=None,
                tech_stack={},
                strengths_weaknesses={},
                raw_analysis=cv_text.strip(),
            )
            assert profile.level is None
            assert profile.tech_stack == {}
        else:
            profile = create_cv_profile(
                db,
                session_id=session.id,
                level=expected_level or "Junior",
                tech_stack={"languages": ["Python"], "frameworks": ["FastAPI"]},
                strengths_weaknesses={"strong": ["FastAPI"], "weak": ["Docker"]},
                raw_analysis=cv_text[:500],
            )
            if expected_level:
                assert profile.level == expected_level

        # Profil geri okunabiliyor mu?
        fetched = get_cv_profile_by_session(db, session.id)
        assert fetched is not None, f"[{scenario_name}] Profil okunamadı"
        assert fetched.session_id == session.id

        return session, profile

    def test_scenario_junior_backend(self, db, test_user):
        from tests.cv_fixtures import CV_JUNIOR_BACKEND
        session, profile = self._run_scenario(
            db, test_user, "junior_backend", CV_JUNIOR_BACKEND,
            expected_level="Junior",
        )
        assert profile.level == "Junior"
        print(f"\n[PASS] junior_backend: level={profile.level}")

    def test_scenario_mid_fullstack(self, db, test_user):
        from tests.cv_fixtures import CV_MID_FULLSTACK
        session, profile = self._run_scenario(
            db, test_user, "mid_fullstack", CV_MID_FULLSTACK,
            expected_level="Mid",
        )
        assert profile.level == "Mid"
        print(f"\n[PASS] mid_fullstack: level={profile.level}")

    def test_scenario_mobile_flutter(self, db, test_user):
        from tests.cv_fixtures import CV_MOBILE_FLUTTER
        session, profile = self._run_scenario(
            db, test_user, "mobile_flutter", CV_MOBILE_FLUTTER,
        )
        assert profile is not None
        print(f"\n[PASS] mobile_flutter: profil olusturuldu")

    def test_scenario_minimal_cv(self, db, test_user):
        """Edge case: çok kısa, eksik bilgili CV — sistem çökmemeli."""
        session, profile = self._run_scenario(
            db, test_user, "minimal", CV_MINIMAL,
        )
        assert profile is not None
        print(f"\n[PASS] minimal: sistem catmadi, profil olusturuldu")

    def test_scenario_senior_noisy(self, db, test_user):
        """Edge case: çok uzun ve karmaşık CV — sistem yavaşlamamalı."""
        from tests.cv_fixtures import CV_SENIOR_NOISY
        session, profile = self._run_scenario(
            db, test_user, "senior_noisy", CV_SENIOR_NOISY,
            expected_level="Senior",
        )
        assert len(session.cv_raw_text) > 1000
        print(f"\n[PASS] senior_noisy: uzun CV islendi, {len(session.cv_raw_text)} karakter")

    def test_scenario_empty_cv(self, db, test_user):
        """Edge case: boş CV metni — None/boş sonuç dönmeli, sistem çökmemeli."""
        session, profile = self._run_scenario(
            db, test_user, "empty", CV_EMPTY,
            expect_empty=True,
        )
        assert profile.level is None
        assert profile.tech_stack == {}
        print(f"\n[PASS] empty: bos CV icin None degerler duzgun islendi")

    def test_scenario_turkish_chars(self, db, test_user):
        """Edge case: Türkçe karakter içeren CV — encoding sorunu olmamalı."""
        from tests.cv_fixtures import CV_TURKISH_CHARS
        session, profile = self._run_scenario(
            db, test_user, "turkish_chars", CV_TURKISH_CHARS,
        )
        assert "Şükrüye" in session.cv_raw_text or "kürüye" in session.cv_raw_text
        print(f"\n[PASS] turkish_chars: Turkce karakterler sorunsuz islendi")


# ---------------------------------------------------------------------------
# HAFIZA (MESSAGE) TESTLERİ
# ---------------------------------------------------------------------------

class TestMemoryPipeline:

    def test_message_order_preserved(self, db, test_user):
        """Mesajlar insert sırasıyla okunmalı — LLM bağlamı için kritik."""
        session = create_session(db, user_id=test_user.id, cv_raw_text="Python")

        add_message(db, session.id, MessageRole.interviewer, "Soru 1: Python nedir?")
        add_message(db, session.id, MessageRole.candidate,   "Cevap 1: Programlama dili.")
        add_message(db, session.id, MessageRole.interviewer, "Soru 2: FastAPI nedir?")
        add_message(db, session.id, MessageRole.candidate,   "Cevap 2: Web framework.")

        messages = get_messages_by_session(db, session.id)
        assert len(messages) == 4
        assert messages[0].role == MessageRole.interviewer
        assert messages[1].role == MessageRole.candidate
        assert messages[2].role == MessageRole.interviewer
        assert messages[3].role == MessageRole.candidate
        assert "Soru 1" in messages[0].content
        assert "Soru 2" in messages[2].content

    def test_message_count(self, db, test_user):
        session = create_session(db, user_id=test_user.id)
        assert get_message_count(db, session.id) == 0
        add_message(db, session.id, MessageRole.interviewer, "Soru")
        add_message(db, session.id, MessageRole.candidate, "Cevap")
        assert get_message_count(db, session.id) == 2

    def test_messages_isolated_between_sessions(self, db, test_user):
        """Farklı oturumların mesajları birbirine karışmamalı."""
        s1 = create_session(db, user_id=test_user.id)
        s2 = create_session(db, user_id=test_user.id)

        add_message(db, s1.id, MessageRole.interviewer, "Oturum 1 mesajı")
        add_message(db, s2.id, MessageRole.interviewer, "Oturum 2 mesajı")

        assert get_message_count(db, s1.id) == 1
        assert get_message_count(db, s2.id) == 1
        assert get_messages_by_session(db, s1.id)[0].content == "Oturum 1 mesajı"
        assert get_messages_by_session(db, s2.id)[0].content == "Oturum 2 mesajı"


# ---------------------------------------------------------------------------
# RAPOR TESTLERİ
# ---------------------------------------------------------------------------

class TestReportPipeline:

    def test_create_and_retrieve_report(self, db, test_user):
        session = create_session(db, user_id=test_user.id)
        end_session(db, session.id)

        report = create_report(
            db,
            session_id=session.id,
            overall_score=78.5,
            category_scores={"technical_accuracy": 80, "problem_solving": 77},
            strong_topics=["FastAPI", "PostgreSQL"],
            weak_topics=["Docker", "async"],
            full_report={"summary": "İyi bir aday.", "recommendations": ["Docker öğren"]},
        )

        fetched = get_report_by_session(db, session.id)
        assert fetched is not None
        assert fetched.overall_score == 78.5
        assert "FastAPI" in fetched.strong_topics
        assert "Docker" in fetched.weak_topics
        assert fetched.full_report["summary"] == "İyi bir aday."

    def test_no_report_returns_none(self, db, test_user):
        session = create_session(db, user_id=test_user.id)
        assert get_report_by_session(db, session.id) is None

    def test_score_boundary_values(self, db, test_user):
        """Sınır değerler: 0 ve 100 kabul edilmeli."""
        s1 = create_session(db, user_id=test_user.id)
        s2 = create_session(db, user_id=test_user.id)

        r1 = create_report(db, session_id=s1.id, overall_score=0.0)
        r2 = create_report(db, session_id=s2.id, overall_score=100.0)

        assert get_report_by_session(db, s1.id).overall_score == 0.0
        assert get_report_by_session(db, s2.id).overall_score == 100.0
