# backend/app/agents/prompts/interviewer_prompt.py
#
# [AI] Teknik Mülakatçı Ajan Prompt Matrisi
#
# Technical Interviewer Agent (Groq/Llama 3) için sistem promptu,
# soru üretim kuralları ve tutarlılık mekanizmaları.
#
# Kullanım (ajan ekibi tarafından Sprint 3'te entegre edilecek):
#
#   from app.agents.prompts.interviewer_prompt import (
#       build_interviewer_system_prompt,
#       build_interviewer_user_prompt,
#       QUESTION_TYPES,
#   )


# ---------------------------------------------------------------------------
# SORU TİPLERİ MATRİSİ
# ---------------------------------------------------------------------------

QUESTION_TYPES = {
    "conceptual": {
        "description": "Temel kavramın ne olduğunu sorar",
        "example": "FastAPI'de dependency injection ne işe yarar?",
        "when_to_use": "İlk turlar, kavram bilgisini ölçmek için",
        "weight": 0.20,
    },
    "scenario_based": {
        "description": "Gerçek hayat senaryosunda ne yapardın sorar",
        "example": (
            "API'ına saniyede 10.000 istek geldiğinde ve veritabanın "
            "yavaşladığında ilk 3 adımın ne olur?"
        ),
        "when_to_use": "Orta turlar, problem çözme becerisini ölçmek için",
        "weight": 0.40,
    },
    "debugging": {
        "description": "Hatalı kod veya yanlış konfigürasyonu buldurur",
        "example": (
            "Docker container'ın başlatılıyor ama hemen kapanıyor. "
            "Sebebini nasıl bulursun?"
        ),
        "when_to_use": "Orta-son turlar, pratik becerileri ölçmek için",
        "weight": 0.25,
    },
    "trade_off": {
        "description": "İki yaklaşım arasında seçim ve gerekçe sorar",
        "example": "Bu proje için SQL mi NoSQL mi kullanırdın, neden?",
        "when_to_use": "Son turlar, karar verme ve olgunluk ölçmek için",
        "weight": 0.15,
    },
}


# ---------------------------------------------------------------------------
# TUTARLILIK KONTROLÜ — Soru tekrarını önlemek için izleme listesi
# ---------------------------------------------------------------------------

def build_asked_topics_note(asked_topics: list[str]) -> str:
    """
    Daha önce sorulan konuların listesini prompta ekler.
    Ajanın aynı konuyu tekrar sormasını önler.

    Args:
        asked_topics: Daha önce sorulan konuların listesi
                      Örnek: ["GIL", "async/await", "Docker networking"]

    Returns:
        Prompta eklenecek not metni
    """
    if not asked_topics:
        return ""
    topics_str = ", ".join(asked_topics)
    return f"""
## Daha Önce Sorulan Konular (Tekrarlama!)
Şu konularda soru SORMA, zaten ele alındı: {topics_str}
Farklı bir konu veya farklı bir açıdan devam et.
"""


# ---------------------------------------------------------------------------
# SİSTEM PROMPTU
# ---------------------------------------------------------------------------

def build_interviewer_system_prompt(
    candidate_level: str = "Junior",
    interview_round: int = 1,
    total_rounds: int = 6,
) -> str:
    """
    Technical Interviewer Agent için sistem promptu oluşturur.

    Args:
        candidate_level:  CV Analyzer'dan gelen seviye ("Junior", "Mid", "Senior")
        interview_round:  Kaçıncı soruda olduğumuz (1'den başlar)
        total_rounds:     Toplam kaç soru sorulacak (varsayılan 6)

    Returns:
        Groq/Llama 3'e gönderilecek sistem promptu (str)
    """
    level_style = {
        "Junior": (
            "Adayın Junior/yeni mezun olduğunu unutma. Çok ileri sorular sormak yerine "
            "temel kavramları gerçek hayata nasıl uyguladığını anlamaya çalış. "
            "Aday bilmediğini söylediğinde, konuyu biraz daha açarak ipucu ver — "
            "bu bir öğrenme fırsatı olabilir."
        ),
        "Mid": (
            "Aday 2-5 yıl deneyimli. Senaryo bazlı ve debug sorularını ağırlıklı kullan. "
            "Yüzeysel cevaplarda derinleştirme sorusu sor."
        ),
        "Senior": (
            "Aday 5+ yıl deneyimli. Trade-off ve mimari kararlarına odaklan. "
            "Her cevabın arkasındaki 'neden' sorusunu sor."
        ),
    }.get(candidate_level, "Orta seviye bir aday gibi değerlendir.")

    round_guidance = ""
    if interview_round == 1:
        round_guidance = "Bu ilk soru. Isındırma sorusuyla başla — kavramsal ve sıcak bir soru sor."
    elif interview_round == total_rounds:
        round_guidance = (
            f"Bu son soru ({total_rounds}/{total_rounds}). "
            "Genel bir kapanış sorusu sor veya adaya 'merak ettiğin bir şey var mı?' de."
        )
    elif interview_round > total_rounds // 2:
        round_guidance = (
            f"Mülakatın ikinci yarısındayız ({interview_round}/{total_rounds}). "
            "Senaryo bazlı veya trade-off soruları sor."
        )
    else:
        round_guidance = (
            f"Mülakatın ortasındayız ({interview_round}/{total_rounds}). "
            "Önceki cevaba göre konuyu derinleştir veya yeni bir konuya geç."
        )

    return f"""Sen deneyimli bir teknik mülakatçısın. Yazılım mühendisliği pozisyonu için
mülakat yapıyorsun. Görevin adaya tek bir teknik soru sormak.

## Aday Profili
Seviye: {candidate_level}
{level_style}

## Mülakat Durumu
{round_guidance}

## Soru Üretim Kuralları
1. Her yanıtta sadece BİR soru sor — birden fazla soru sorma
2. Soru kısa ve net olsun — maksimum 3 cümle
3. Ezber gerektiren sorular yerine senaryo bazlı veya mantık yürütme gerektiren sorular sor
4. Adayın CV'sinde geçen teknolojilere öncelik ver
5. Cevap doğruysa bir sonraki konuya geç; eksikse aynı konuda derinleştirme sorusu sor
6. Derinleştirme sorusunu aynı konuda en fazla bir kez sor, sonra yeni konuya geç

## Tutarlılık Kuralları
- Aynı soruyu farklı kelimelerle tekrarlama
- "Peki ya..." ile başlayan çok fazla derinleştirme sorusu sormaktan kaçın
- Adayın kullandığı teknolojiyi bilmediğini anlarssan o konuyu bırak, başka konuya geç

## Cevap Formatı
Sadece soruyu yaz. Hiçbir ön açıklama, selamlama veya "Şimdi sana şunu soracağım"
gibi giriş cümlesi ekleme. Direkt soruyla başla.
"""


# ---------------------------------------------------------------------------
# KULLANICI PROMPTU — Her tur için dinamik
# ---------------------------------------------------------------------------

def build_interviewer_user_prompt(
    tech_stack: list[str],
    candidate_level: str,
    chat_history: str,
    last_answer: str,
    asked_topics: list[str] | None = None,
    interview_round: int = 1,
    total_rounds: int = 6,
) -> str:
    """
    Her soru turu için dinamik mülakatçı promptu oluşturur.

    Args:
        tech_stack:       CV'den gelen teknoloji listesi
        candidate_level:  Aday seviyesi
        chat_history:     Şimdiye kadarki konuşma geçmişi (format_chat_log çıktısı)
        last_answer:      Adayın verdiği son cevap
        asked_topics:     Daha önce sorulan konular (tekrar önleme)
        interview_round:  Kaçıncı soru
        total_rounds:     Toplam soru sayısı

    Returns:
        Groq/Llama 3'e gönderilecek kullanıcı promptu (str)
    """
    tech_str = ", ".join(tech_stack) if tech_stack else "Belirtilmemiş"
    asked_note = build_asked_topics_note(asked_topics or [])

    history_section = ""
    if chat_history:
        history_section = f"""
## Konuşma Geçmişi
{chat_history}
"""

    last_answer_section = ""
    if last_answer and interview_round > 1:
        last_answer_section = f"""
## Adayın Son Cevabı
{last_answer}

Bu cevabı değerlendir:
- Tam ve doğruysa → yeni bir konuya geç
- Eksikse → aynı konuda bir derinleştirme sorusu sor (sadece bir kez)
- Yanlışsa → nazikçe yönlendir ve farklı bir konuya geç
"""

    return f"""## Aday Bilgileri
- Seviye: {candidate_level}
- CV Teknolojileri: {tech_str}
- Mülakat Turu: {interview_round}/{total_rounds}
{asked_note}
{history_section}
{last_answer_section}
Şimdi uygun bir teknik soru sor.
"""


# ---------------------------------------------------------------------------
# YARDIMCI FONKSİYON: Sorulan konuları güncelle
# ---------------------------------------------------------------------------

def extract_topic_from_question(question: str) -> str:
    """
    Sorudan konu etiketini çıkarır.
    Basit keyword bazlı yaklaşım — ajan ekibi gerekirse geliştirebilir.

    Args:
        question: Sorulan soru metni

    Returns:
        Konu etiketi (str), bulamazsa sorunun ilk 5 kelimesi
    """
    keywords = [
        "async", "await", "GIL", "Docker", "Kubernetes", "PostgreSQL",
        "Redis", "FastAPI", "Django", "Flask", "SQLAlchemy", "Alembic",
        "React", "Flutter", "Dart", "Python", "JavaScript", "TypeScript",
        "REST", "GraphQL", "gRPC", "microservice", "monolith",
        "index", "query", "join", "transaction", "ACID",
        "JWT", "OAuth", "authentication", "authorization",
        "cache", "CDN", "load balancer", "rate limit",
        "test", "mock", "fixture", "coverage",
    ]
    question_lower = question.lower()
    for kw in keywords:
        if kw.lower() in question_lower:
            return kw
    # Eşleşme yoksa sorunun ilk 5 kelimesini döndür
    return " ".join(question.split()[:5])
