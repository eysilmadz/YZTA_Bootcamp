# backend/app/agents/prompts/evaluator_prompt.py
#
# [AI] Puanlama & Eksik Analizi Promp'u
#
# Performance Evaluator Agent (Gemini 1.5 Flash) için sistem prompt,
# puanlama kriterleri ve çıktı formatı tanımları.
#
# Kullanım (ajan ekibi tarafından, Sprint 3-4'te entegre edilecek):
#
#   from app.agents.prompts.evaluator_prompt import (
#       build_evaluator_system_prompt,
#       build_evaluator_user_prompt,
#       EVALUATOR_OUTPUT_SCHEMA,
#   )
#
#   system_prompt = build_evaluator_system_prompt(candidate_level="Junior")
#   user_prompt   = build_evaluator_user_prompt(
#       tech_stack=["FastAPI", "Flutter"],
#       chat_log=formatted_messages,
#   )


# ---------------------------------------------------------------------------
# PUANLAMA KRİTERLERİ
# ---------------------------------------------------------------------------

SCORING_CRITERIA = {
    "technical_accuracy": {
        "weight": 0.40,
        "description": "Verilen cevabın teknik olarak doğruluğu ve derinliği",
        "rubric": {
            "90-100": "Tam doğru, nüanslı, ileri düzey detay içeriyor",
            "70-89":  "Özünde doğru, küçük eksikler veya yüzeysel kalıyor",
            "50-69":  "Kısmen doğru, önemli kavramlar atlanmış veya karıştırılmış",
            "30-49":  "Büyük ölçüde hatalı ya da yanlış yönde",
            "0-29":   "Cevap yok, konuyu bilmiyor ya da alakasız cevap verdi",
        },
    },
    "problem_solving": {
        "weight": 0.30,
        "description": "Senaryo bazlı sorulara yaklaşım ve mantık yürütme becerisi",
        "rubric": {
            "90-100": "Problemi sistematik olarak parçalara ayırıyor, alternatif çözümler sunuyor",
            "70-89":  "Problemi anlıyor, makul bir çözüm yolu izliyor",
            "50-69":  "Problemi kısmen anlıyor, çözüm yüzeysel kalıyor",
            "30-49":  "Problemi anlama güçlüğü çekiyor, çözüm rastgele",
            "0-29":   "Problemi çözemiyor ya da denemede bulunmuyor",
        },
    },
    "communication": {
        "weight": 0.15,
        "description": "Teknik kavramları açık ve anlaşılır şekilde ifade edebilme",
        "rubric": {
            "90-100": "Çok net, yapılandırılmış, teknik olmayan kişiye de anlatabilir düzeyde",
            "70-89":  "Anlaşılır, bazı noktalar daha net olabilirdi",
            "50-69":  "Kısmen anlaşılır, önemli ifade sorunları var",
            "30-49":  "Anlaşılması güç, tutarsız açıklamalar",
            "0-29":   "İfade çok zayıf veya cevap vermiyor",
        },
    },
    "adaptability": {
        "weight": 0.15,
        "description": "Mülakatçının yönlendirme ve derinleştirme sorularına uyum sağlama",
        "rubric": {
            "90-100": "Yönlendirmeleri hızlı kavradı, cevaplarını geliştirdi",
            "70-89":  "Çoğu yönlendirmeye olumlu tepki verdi",
            "50-69":  "Bazı yönlendirmeleri yakaladı, bazılarını kaçırdı",
            "30-49":  "Yönlendirmelere rağmen aynı yerde kaldı",
            "0-29":   "Yönlendirmelere hiç uyum sağlamadı",
        },
    },
}


# ---------------------------------------------------------------------------
# SİSTEM PROMPTU
# ---------------------------------------------------------------------------

def build_evaluator_system_prompt(candidate_level: str = "Junior") -> str:
    """
    Performance Evaluator Agent için sistem promptu oluşturur.

    Args:
        candidate_level: CV Analyzer'dan gelen seviye bilgisi
                         ("Junior", "Mid", "Senior")

    Returns:
        Gemini 1.5 Flash'a gönderilecek sistem promptu (str)
    """
    level_context = {
        "Junior": (
            "Adayın henüz 0-2 yıl deneyimi var veya yeni mezun. "
            "Değerlendirmende teorik bilgiyi pratiğe bağlayıp bağlayamadığına, "
            "temel kavramları ne kadar anladığına odaklan. "
            "Küçük hatalar için aşırı sert olma; öğrenme potansiyelini de göz önünde bulundur."
        ),
        "Mid": (
            "Adayın 2-5 yıl deneyimi var. "
            "Teknik derinliği, bağımsız karar verme becerisini ve "
            "karmaşık senaryolara yaklaşımını değerlendir."
        ),
        "Senior": (
            "Adayın 5+ yıl deneyimi var. "
            "Sistem tasarımı kararları, trade-off analizi ve "
            "takım/proje liderliği perspektifini değerlendir."
        ),
    }.get(candidate_level, "Adayın deneyim seviyesi belirsiz, orta seviye olarak değerlendir.")

    return f"""Sen deneyimli bir teknik İK uzmanısın ve yazılım mühendisliği mülakatlarını değerlendiriyorsun.

## Bağlam
{level_context}

## Görevin
Sana verilen mülakat konuşma geçmişini (soru-cevap logunu) başından sonuna analiz ederek
adayı 100 üzerinden puanlamalı ve detaylı bir değerlendirme raporu oluşturmalısın.

## Puanlama Ağırlıkları
- Teknik Doğruluk (technical_accuracy):  %40
- Problem Çözme (problem_solving):        %30
- İletişim (communication):               %15
- Uyum Sağlama (adaptability):            %15

## Değerlendirme İlkeleri
1. Her soruyu ve cevabı ayrı ayrı değerlendir, sonra genel bir puan çıkar
2. Sadece konuşma geçmişinde görünenleri değerlendir — varsayım yapma
3. Cevap eksikse veya yanlışsa bunu açıkça belirt ama yapıcı bir dille yaz
4. Gelişim önerileri somut ve uygulanabilir olsun ("daha çok çalış" değil,
   "asyncio dökümanını oku ve 2 küçük async proje yaz" gibi)
5. Rapor Türkçe olmalı

## Çıktı Formatı
Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak ver.
Başında veya sonunda hiçbir açıklama, markdown bloğu veya ek metin olmamalı.
JSON şeması aşağıda tanımlıdır — her alan zorunludur.
"""


# ---------------------------------------------------------------------------
# KULLANICI PROMPTU (Her mülakat için dinamik olarak oluşturulur)
# ---------------------------------------------------------------------------

def build_evaluator_user_prompt(
    tech_stack: list[str],
    chat_log: str,
    candidate_level: str = "Junior",
) -> str:
    """
    Her mülakat için kişiselleştirilmiş değerlendirme promptu oluşturur.

    Args:
        tech_stack:       CV Analyzer'dan gelen teknoloji listesi
                          Örnek: ["Python", "FastAPI", "Flutter", "Docker"]
        chat_log:         Formatlanmış konuşma geçmişi
                          Örnek:
                          "MÜLAKATÇİ: FastAPI nedir?
                           ADAY: FastAPI bir Python web framework...
                           MÜLAKATÇİ: Async endpoint nasıl yazılır?
                           ADAY: async def ile tanımlanır..."
        candidate_level:  Adayın seviyesi ("Junior", "Mid", "Senior")

    Returns:
        Gemini 1.5 Flash'a gönderilecek kullanıcı promptu (str)
    """
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "Belirtilmemiş"

    return f"""## Aday Profili
- Seviye: {candidate_level}
- CV'de belirtilen teknolojiler: {tech_stack_str}

## Mülakat Konuşma Geçmişi
{chat_log}

## Talimat
Yukarıdaki konuşma geçmişini değerlendir ve aşağıdaki JSON şemasına uygun bir rapor üret.
Sadece JSON döndür, başka hiçbir şey ekleme.
"""


# ---------------------------------------------------------------------------
# JSON ÇIKTI ŞEMASI
# ---------------------------------------------------------------------------

EVALUATOR_OUTPUT_SCHEMA = {
    "overall_score": "float (0-100 arası genel puan)",
    "category_scores": {
        "technical_accuracy": "float (0-100)",
        "problem_solving":    "float (0-100)",
        "communication":      "float (0-100)",
        "adaptability":       "float (0-100)",
    },
    "strong_topics": [
        "Adayın güçlü olduğu konu 1",
        "Adayın güçlü olduğu konu 2",
    ],
    "weak_topics": [
        "Adayın geliştirmesi gereken konu 1",
        "Adayın geliştirmesi gereken konu 2",
    ],
    "full_report": {
        "summary": "Adayın genel performansını özetleyen 2-3 cümle",
        "question_evaluations": [
            {
                "question": "Sorulan soru metni",
                "answer_quality": "excellent / good / partial / poor",
                "comment": "Bu soruya verilen cevap hakkında kısa yorum",
            }
        ],
        "strong_areas": [
            "Güçlü alan açıklaması 1",
            "Güçlü alan açıklaması 2",
        ],
        "improvement_areas": [
            "Geliştirme alanı açıklaması 1",
            "Geliştirme alanı açıklaması 2",
        ],
        "recommendations": [
            "Somut ve uygulanabilir gelişim önerisi 1",
            "Somut ve uygulanabilir gelişim önerisi 2",
            "Somut ve uygulanabilir gelişim önerisi 3",
        ],
        "hiring_comment": (
            "İK perspektifinden kısa bir değerlendirme. "
            "Junior pozisyon için önerilebilir mi, hangi şartlarla?"
        ),
    },
}


# ---------------------------------------------------------------------------
# YARDIMCI FONKSİYON: Chat logunu formatla
# ---------------------------------------------------------------------------

def format_chat_log(messages: list) -> str:
    """
    Veritabanından gelen Message nesnelerini prompt için düz metin formatına çevirir.

    Args:
        messages: get_messages_by_session() çıktısı (Message listesi)

    Returns:
        Formatlanmış konuşma metni

    Kullanım (ajan ekibi tarafından):
        from app.db.crud.message import get_messages_by_session
        from app.agents.prompts.evaluator_prompt import format_chat_log

        messages = get_messages_by_session(db, session_id)
        chat_log = format_chat_log(messages)
    """
    from app.db.models.message import MessageRole

    lines = []
    for msg in messages:
        if msg.role == MessageRole.interviewer:
            lines.append(f"MÜLAKATÇİ: {msg.content}")
        else:
            lines.append(f"ADAY: {msg.content}")
    return "\n".join(lines)
