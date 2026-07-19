import os
import json
import re
import google.generativeai as genai
from groq import Groq
from app.core.config import settings

# Initialize APIs
GEMINI_KEY = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)
GROQ_KEY = os.getenv("GROQ_API_KEY", settings.GROQ_API_KEY)

# Clean keys of placeholders
if GEMINI_KEY and ("buraya_kendi" in GEMINI_KEY or not GEMINI_KEY.strip()):
    GEMINI_KEY = None
if GROQ_KEY and ("buraya_kendi" in GROQ_KEY or not GROQ_KEY.strip()):
    GROQ_KEY = None

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# CV ANALYZER AGENT (Gemini 1.5 Flash)
def analyze_cv_text(cv_text: str) -> dict:
    """
    Analyzes CV text to extract level, tech stack, strengths, and weaknesses.
    Falls back to a keyword-based analyzer if API keys are missing/invalid.
    """
    if not GEMINI_KEY:
        return _mock_cv_analysis(cv_text, "Gemini API key is not configured.")

    prompt = f"""
    Sisteme kayıtlı rolün: Bilgi Yakalama ve Profilleme Uzmanı (CV Analyzer Agent)
    Kullandığın LLM: Gemini 1.5 Flash (Büyük veri okuma yeteneği için)
    Girdi: pdfplumber tarafından çıkarılan ham CV metni.
    Çıktı: Adayın yetkinlik matrisi (Teknoloji yığını, deneyim yılı, seviye tespiti).
    Görev Tanımı (Task Description):
    "Lokal parser'dan gelen ham metni oku. İlgili adayın yazılım geliştirme seviyesini (Junior/Entry-Level) doğrula. Özgeçmişte bahsedilen teknolojileri (Örn: Flutter, FastAPI, Docker) kategorize et ve adayın güçlü/zayıf olabileceği teknik alanları mülakatçı ajana paslamak üzere yapılandırılmış bir ön rapor haline getir."

    Return ONLY a JSON object conforming exactly to this structure:
    {{
      "level": "Junior" | "Mid" | "Senior",
      "tech_stack": {{
        "languages": ["Python", "JavaScript", ...],
        "frameworks": ["FastAPI", "React", ...],
        "tools": ["Docker", "Git", ...],
        "databases": ["PostgreSQL", "MongoDB", ...]
      }},
      "strengths_weaknesses": {{
        "strong": ["REST API tasarımı", "Asenkron programlama"],
        "weak": ["Docker containerization", "Birim testler"]
      }}
    }}

    CV TEXT:
    {cv_text}
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        result = json.loads(response.text)
        result["raw_analysis"] = response.text
        return result
    except Exception as e:
        print(f"⚠️ Gemini CV Analysis failed, using mock fallback: {e}")
        return _mock_cv_analysis(cv_text, f"Gemini error: {str(e)}")


def _mock_cv_analysis(cv_text: str, reason: str) -> dict:
    """Rule-based mock extractor fallback when LLM is unavailable."""
    text_lower = cv_text.lower()
    
    # Simple keyword matches
    all_langs = ["python", "javascript", "typescript", "go", "java", "c#", "dart", "c++", "rust", "ruby", "php", "html", "css"]
    languages = [l.capitalize() for l in all_langs if l in text_lower]
    
    all_fws = ["fastapi", "django", "flask", "react", "vue", "angular", "flutter", "express", "spring", "laravel", "nextjs", "next.js"]
    frameworks = []
    for f in all_fws:
        if f in text_lower:
            if f == "react": frameworks.append("React.js")
            elif f == "nextjs" or f == "next.js": frameworks.append("Next.js")
            else: frameworks.append(f.capitalize())
            
    all_tools = ["docker", "kubernetes", "git", "jenkins", "aws", "gcp", "npm", "pip", "github", "gitlab", "ci/cd", "ansible"]
    tools = []
    for t in all_tools:
        if t in text_lower:
            if t == "aws": tools.append("AWS")
            elif t == "gcp": tools.append("GCP")
            elif t == "ci/cd": tools.append("CI/CD")
            else: tools.append(t.capitalize())

    all_dbs = ["postgresql", "mysql", "mongodb", "sqlite", "redis", "mariadb", "firebase", "cassandra"]
    databases = []
    for d in all_dbs:
        if d in text_lower:
            if d == "postgresql": databases.append("PostgreSQL")
            elif d == "sqlite": databases.append("SQLite")
            elif d == "mongodb": databases.append("MongoDB")
            else: databases.append(d.capitalize())

    # Sniff Level
    level = "Mid"
    if any(k in text_lower for k in ["junior", "intern", "entry", "stajyer", "staj"]):
        level = "Junior"
    elif any(k in text_lower for k in ["senior", "lead", "architect", "yönetici", "uzman"]):
        level = "Senior"

    # Default fallbacks if empty
    if not languages: languages = ["Python"]
    if not frameworks: frameworks = ["FastAPI"]
    if not tools: tools = ["Git"]
    if not databases: databases = ["PostgreSQL"]

    return {
        "level": level,
        "tech_stack": {
            "languages": languages,
            "frameworks": frameworks,
            "tools": tools,
            "databases": databases
        },
        "strengths_weaknesses": {
            "strong": [f"{frameworks[0]} development", f"{languages[0]} coding"],
            "weak": ["Cloud architecture details", "High coverage testing"]
        },
        "raw_analysis": f"LOCAL NLP FALLBACK. Reason: {reason}"
    }


# Pool of mock questions categorized by technology topic for offline/mock mode
MOCK_QUESTIONS_BY_TOPIC = {
    "Python": [
        "Python'da bellek yönetimini ve çöp toplayıcı (Garbage Collector) yükünü azaltmak için kod yazarken nelere dikkat edersiniz?",
        "Python async/await mekanizmasının arkasındaki Event Loop yapısını ve senkron kütüphanelerin asenkron fonksiyonda bloklanmaya nasıl sebep olduğunu açıklayabilir misiniz?",
        "Python'da generator'ları (yield) hangi senaryolarda tercih edersiniz? Bellek tüketimi açısından ne gibi avantajlar sağlarlar?",
        "Python'daki GIL (Global Interpreter Lock) kavramını ve çoklu CPU çekirdeklerinden yararlanmak için threading yerine neden multiprocessing tercih edildiğini açıklar mısınız?"
    ],
    "FastAPI": [
        "FastAPI'de dependency injection (Depends) mekanizmasını kullanarak veritabanı bağlantı havuzunu (Connection Pool) verimli şekilde nasıl yönetirsiniz?",
        "FastAPI ile geliştirdiğiniz bir API ucunun yavaş yanıt vermesi durumunda, sorunun I/O kaynaklı mı yoksa CPU-bound mu olduğunu nasıl analiz eder ve çözersiniz?",
        "FastAPI'de Background Tasks (arka plan işleri) hangi senaryolarda yeterlidir, hangi durumlarda Celery ve Redis gibi kuyruk yapılarına geçilmelidir?",
        "FastAPI'de Pydantic şemalarını kullanarak veri doğrulama ve API dokümantasyonunu nasıl özelleştirirsiniz?"
    ],
    "PostgreSQL": [
        "PostgreSQL'de yavaş çalışan karmaşık sorguları optimize etmek için hangi adımları izlersiniz? EXPLAIN ANALYZE çıktısında öncelikli olarak nelere bakarsınız?",
        "PostgreSQL'de bağlantı havuzu (connection pooling) limitlerine ulaşıldığında uygulamanın hata vermesini engellemek için mimaride ne gibi önlemler alırsınız?",
        "PostgreSQL'de B-Tree index ile GIN index arasındaki farklar nelerdir? Hangi veri tipleri ve arama senaryolarında hangisini tercih edersiniz?"
    ],
    "Docker": [
        "Docker imaj boyutlarını küçültmek için multi-stage build tekniğini nasıl uygularsınız? Örnek bir Dockerfile tasarımı paylaşabilir misiniz?",
        "Docker container'ları arasında yalıtılmış ve güvenli ağ iletişimi kurmak için hangi Docker network sürücülerini (Bridge, Overlay, Host) tercih edersiniz?",
        "Docker Compose kullanarak ayağa kaldırdığınız servislerin healthcheck ve başlatılma sırası bağımlılıklarını (depends_on condition) nasıl kurgularsınız?"
    ],
    "React.js": [
        "React'te gereksiz render'ları engellemek ve performansı artırmak için useMemo, useCallback ve React.memo kullanım kriterlerini nasıl belirlersiniz?",
        "React'te karmaşık state yönetimini context API yerine Redux Toolkit ile çözmenin mimari avantajları ve sınırları nelerdir?",
        "React component lifecycle'ında useEffect hook'unun cleanup (temizlik) fonksiyonunu hangi durumlarda kullanırsınız? Örnek verebilir misiniz?"
    ],
    "General": [
        "Mikroservis mimarisinde servisler arası veri tutarlılığını (Data Consistency) sağlamak için Saga orkestrasyon modelini nasıl tasarlarsınız?",
        "Bir web uygulamasında Redis önbellek (caching) katmanı tasarlarken, verinin eskimemesi ve tutarlı kalması için 'Cache Invalidation' problemlerini nasıl çözersiniz?",
        "Canlı ortamda (production) çalışan bir servis çöktüğünde (crash), hatanın kaynağını tespit etmek için loglama, metrik toplama ve hata izleme (monitoring) süreçlerini nasıl yönetirsiniz?"
    ]
}


# TECHNICAL INTERVIEWER AGENT (Groq Llama 3 / Gemini Fallback)
def generate_next_question(cv_profile: dict, history: list) -> str:
    """
    Generates the next technical interview question based on CV Profile and history.
    Uses Groq Llama 3, falls back to Gemini 1.5 Flash, then to mock local generator.
    """
    # Build System Prompt
    level = cv_profile.get("level", "Mid")
    tech_stack = cv_profile.get("tech_stack", {})
    sw = cv_profile.get("strengths_weaknesses", {})
    
    # Format details for prompt
    languages = ", ".join(tech_stack.get("languages", []))
    frameworks = ", ".join(tech_stack.get("frameworks", []))
    databases = ", ".join(tech_stack.get("databases", []))
    strong = ", ".join(sw.get("strong", []))
    weak = ", ".join(sw.get("weak", []))

    system_prompt = f"""Sisteme kayıtlı rolün: Canlı Sohbet ve Soru Simülatörü (Technical Interviewer Agent)
Kullandığın LLM: Groq / Llama 3 (Ultra düşük gecikme süresi ve hız için)
Girdi: CV Analizörünün raporu + Adayın anlık yazdığı cevaplar + Chat geçmişi.
Çıktı: Adaya yöneltilecek bir sonraki interaktif, kısa ve nokta atışı teknik soru.
Görev Tanımı (Task Description):
"Adayın profilini baz alarak mülakatı başlat. Adaya teorik ezber soruları yerine, projelerinde kullandığı teknolojilere dair senaryo bazlı (scenario-based) ve mantık yürütmesini gerektiren sorular sor. Aday cevap verdikten sonra cevabı analiz et; eğer cevap eksikse derinleştir, doğruysa bir sonraki konuya geç. Sohbetin canlı akışını korumak için yanıtları tek seferde tek bir soru olacak şekilde kısa tut."

Candidate Profile:
- Seniority Level: {level}
- Languages: {languages}
- Frameworks: {frameworks}
- Databases: {databases}
- Identified Strengths: {strong}
- Areas for Growth: {weak}

Ek Kurallar:
1. Kesinlikle tek seferde TEK BİR soru sor. Uzun paragraflar, gereksiz karşılamalar veya laf kalabalığı yapma.
2. Sorular doğrudan aday tarafından kullanılan teknolojilerle ilgili pratik senaryoları, problem gidermeyi ve sistem tasarımını içermelidir. Teorik ezber tanımlar sorma.
3. Mülakatı başlatırken çok kısa bir selamlamadan sonra ilk senaryo sorusunu sor.
4. Yanıtların tamamen Türkçe olmalıdır.
5. Her mülakat oturumunda farklı konulardan başla, klişe sorulardan kaçın ve adayın profilindeki farklı teknolojileri sorgulayarak çeşitlilik sağla. Aynı mülakatta veya farklı mülakatlarda üst üste benzer sorular sorma.
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Format history
    # role can be "interviewer" (assistant) or "candidate" (user)
    for msg in history:
        role = "assistant" if msg["role"] in ["interviewer", "assistant"] else "user"
        messages.append({"role": role, "content": msg["content"]})

    # Try Groq
    if GROQ_KEY:
        try:
            client = Groq(api_key=GROQ_KEY)
            # Use llama-3.1-8b-instant with high temperature for diversity
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.9,
                max_tokens=250
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"⚠️ Groq question generation failed, falling back to Gemini: {e}")

    # Fallback to Gemini 1.5 Flash
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_prompt
            )
            # Convert messages to Gemini format: role user/model
            gemini_messages = []
            for msg in history:
                role = "model" if msg["role"] in ["interviewer", "assistant"] else "user"
                gemini_messages.append({"role": role, "parts": [msg["content"]]})
                
            config = {"temperature": 0.9}
            if not gemini_messages:
                # First question
                response = model.generate_content("Mülakata başla ve aday için benzersiz, özgün bir giriş teknik sorusu sor.", generation_config=config)
            else:
                chat = model.start_chat(history=gemini_messages[:-1])
                response = chat.send_message(gemini_messages[-1]["parts"][0], generation_config=config)
            return response.text.strip()
        except Exception as e:
            print(f"⚠️ Gemini question generation failed: {e}")

    # Final Local Mock Fallback
    return _generate_mock_question(cv_profile, history)


def _generate_mock_question(cv_profile: dict, history: list) -> str:
    """Returns local predefined questions when APIs are offline, randomized based on session_id."""
    import random
    session_id = cv_profile.get("session_id", 42)
    q_count = len([m for m in history if m["role"] == "interviewer"])

    if q_count >= 5:
        return "Mülakat sorularımız tamamlanmıştır. Raporunuzu hazırlamam için mülakatı sonlandırabilirsiniz."

    # Grab candidate technologies
    tech_stack = cv_profile.get("tech_stack", {})
    all_techs = []
    for category, techs in tech_stack.items():
        if techs:
            all_techs.extend(techs)

    # Collect matching questions from pool based on tech stack
    pool = []
    for tech in all_techs:
        matched_key = None
        for key in MOCK_QUESTIONS_BY_TOPIC.keys():
            if key.lower() in tech.lower() or tech.lower() in key.lower():
                matched_key = key
                break
        if matched_key:
            pool.extend(MOCK_QUESTIONS_BY_TOPIC[matched_key])

    # Add general questions as baseline
    pool.extend(MOCK_QUESTIONS_BY_TOPIC["General"])

    # Remove duplicates while maintaining a stable sorted order for seed consistency
    pool = sorted(list(set(pool)))

    # Use session_id + q_count as a random seed to pick a question
    # This guarantees different sessions get different questions, but the same session gets the same question on refresh/state update.
    rng = random.Random(session_id + q_count * 100)
    
    if pool:
        picked_q = rng.choice(pool)
        return picked_q
    
    # Absolute fallback default list
    default_questions = [
        "Hoş geldiniz. Son geliştirdiğiniz projede karşılaştığınız en büyük teknik zorluk neydi ve bunu nasıl çözdünüz?",
        "Uygulamalarınızda veri tabanı optimizasyonunu sağlamak için ne tür indeksleme ve sorgu iyileştirme teknikleri kullanırsınız?",
        "Mikroservis veya çoklu servis yapılarında asenkron haberleşme ve kuyruk yönetimi süreçlerini nasıl kurgularsınız?",
        "Docker container'larının imaj boyutlarını optimize etmek ve güvenliği artırmak için ne gibi önlemler alırsınız?",
        "Canlı ortama (production) kod çıkarken hata izleme (monitoring) ve CI/CD süreçlerini nasıl yönetirsiniz?"
    ]
    return default_questions[q_count]


# PERFORMANCE EVALUATOR AGENT (Gemini 1.5 Flash)
def evaluate_interview(cv_profile: dict, history: list) -> dict:
    """
    Evaluates the complete interview transcript and returns structured scoring & roadmap.
    """
    if not GEMINI_KEY:
        return _mock_evaluation(history, "Gemini API key is not configured.")

    # Format transcript
    transcript = ""
    for msg in history:
        sender = "Mülakatçı (AI)" if msg["role"] == "interviewer" else "Aday"
        transcript += f"{sender}: {msg['content']}\n\n"

    prompt = f"""
    Sisteme kayıtlı rolün: İK Raporlama ve Analitik Uzmanı (Performance Evaluator Agent)
    Kullandığın LLM: Gemini 1.5 Flash (Tüm konuşma geçmişini tek seferde hazmetmesi için)
    Girdi: Mülakat bitene kadar biriken tüm Chat logları (Konuşma geçmişi).
    Çıktı: Markdown veya JSON formatında adaya özel karne (Puanlama ve Gelişim Yol Haritası).
    Görev Tanımı (Task Description):
    "Mülakatın başından sonuna kadar üretilen tüm konuşma geçmişini derinlemesine incele. Adayın sorulara verdiği yanıtların doğruluk payını, teknik derinliğini ve problem çözme yaklaşımını değerlendir. Adayı 100 üzerinden puanla. Hangi konularda mükemmel olduğunu, hangi konularda ise kesinlikle kendini geliştirmesi gerektiğini detaylandırarak profesyonel bir İK raporu oluştur."

    Candidate Profile:
    - Level: {cv_profile.get("level", "Mid")}
    - Tech Stack: {cv_profile.get("tech_stack", {})}

    INTERVIEW TRANSCRIPT:
    {transcript}

    Return ONLY a JSON object conforming exactly to this structure:
    {{
      "overall_score": 78.5,
      "category_scores": {{
        "technical_depth": 80,
        "problem_solving": 75,
        "communication": 82
      }},
      "strong_topics": ["FastAPI dependency injection", "Database index optimization"],
      "weak_topics": ["Docker multi-stage builds", "Asynchronous error handling"],
      "full_report": {{
        "summary": "Aday genel olarak teknik konularda yetkin, ancak...",
        "strong_areas": [
          "FastAPI konusundaki pratik deneyimi güçlü.",
          "Sorulara dürüst ve net cevaplar veriyor."
        ],
        "improvement_areas": [
          "Concurrency ve asenkron kodlama kavramlarını derinlemesine incelemeli.",
          "Dockerize etme aşamalarında pratik eksikliği var."
        ],
        "recommendations": [
          "Python asyncio dokümantasyonunu baştan sona okuyun.",
          "Docker networking ve multi-stage build konularında küçük bir deneme projesi yapın."
        ]
      }}
    }}
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"⚠️ Gemini Evaluation failed, using mock fallback: {e}")
        return _mock_evaluation(history, f"Gemini error: {str(e)}")


def _mock_evaluation(history: list, reason: str = "Gemini API offline") -> dict:
    """Smarter mock evaluation fallback when LLM is offline."""
    # Analyze if user answered "bilmiyorum" or had empty/short answers
    candidate_msgs = [m["content"].lower() for m in history if m["role"] == "candidate"]
    
    total_answers = len(candidate_msgs)
    i_dont_know_count = 0
    for msg in candidate_msgs:
        # Detect typical turkish phrases for 'don't know'
        if any(k in msg for k in ["bilmiyorum", "bilgim yok", "fikrim yok", "emin degilim", "emin değilim", "hatirlamiyorum", "hatırlamıyorum"]):
            i_dont_know_count += 1
        elif len(msg.strip()) < 8:  # Very short answers or empty spaces
            i_dont_know_count += 1
            
    # Calculate dynamic mock score
    if total_answers > 0:
        ratio = (total_answers - i_dont_know_count) / total_answers
        score = round(ratio * 75.0, 1)  # maximum 75.0 for mock, down to 0
    else:
        score = 0.0

    technical_depth = max(10, int(score * 0.9))
    problem_solving = max(10, int(score * 1.0))
    communication = max(20, 80 if total_answers > 0 and i_dont_know_count < total_answers else 30)

    summary = f"Mülakat değerlendirmesi yerel sistem tarafından gerçekleştirilmiştir ({reason})."
    if score < 20:
        summary += " Aday sorulan teknik soruların çoğuna cevap verememiş veya bilgisi olmadığını belirtmiştir. Teknik derinlik bu pozisyon gereksinimleri için yetersizdir."
        strong_topics = ["Dürüstlük"]
        weak_topics = ["FastAPI", "Python", "Veritabanları", "Mikroservisler"]
        strong_areas = ["Mülakat sorularını dürüstçe yanıtlaması ve bilmediği konuları açıkça belirtmesi."]
        improvement_areas = ["Temel programlama kavramları, seçtiği framework'ler ve SQL gibi veritabanı temelleri üzerinde çalışmalıdır."]
        recommendations = [
            "Seçtiğiniz yazılım dilinin (örn: Python) temel ve orta düzey konseptlerini çalışın.",
            "Kullanmak istediğiniz web framework'ünün (örn: FastAPI) başlangıç dokümantasyonunu inceleyin.",
            "Veritabanı temel sorguları ve SQL pratikleri gerçekleştirin."
        ]
    else:
        summary += " Aday mülakatı tamamlamış ve genel teknik konularda temel seviyede bilgi paylaşmıştır."
        strong_topics = ["Temel programlama mantığı", "Proje deneyimi"]
        weak_topics = ["İleri seviye mimari konular", "Sistem tasarımı optimizasyonu"]
        strong_areas = [
            "Sorulara hızlı ve doğrudan cevap vermesi.",
            "Kullandığı kütüphanelerin temel özelliklerine hakim olması."
        ]
        improvement_areas = [
            "Hata ayıklama (error handling) ve production optimizasyonları.",
            "Asenkron programlama mantığı."
        ]
        recommendations = [
            "Gerçek hayat senaryoları üzerine pratik yapın.",
            "Web framework'lerinin iç mekanizmalarını araştırın."
        ]

    return {
        "overall_score": score,
        "category_scores": {
            "technical_depth": technical_depth,
            "problem_solving": problem_solving,
            "communication": communication
        },
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "full_report": {
            "summary": summary,
            "strong_areas": strong_areas,
            "improvement_areas": improvement_areas,
            "recommendations": recommendations
        }
    }

