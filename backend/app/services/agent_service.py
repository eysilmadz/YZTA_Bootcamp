import os
import json
import random
from app.core.config import settings

# Initialize APIs
GEMINI_KEY = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)
GROQ_KEY = os.getenv("GROQ_API_KEY", settings.GROQ_API_KEY)

# Clean keys of placeholders
if GEMINI_KEY and ("buraya_kendi" in GEMINI_KEY or not GEMINI_KEY.strip()):
    GEMINI_KEY = None
if GROQ_KEY and ("buraya_kendi" in GROQ_KEY or not GROQ_KEY.strip()):
    GROQ_KEY = None

# Import LangChain components
try:
    from langchain_google_genai import ChatGoogleGenAI
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

# CV ANALYZER AGENT (LangChain + Gemini 1.5 Flash)
def analyze_cv_text(cv_text: str) -> dict:
    """
    Analyzes CV text to extract level, tech stack, strengths, and weaknesses using LangChain & Gemini.
    """
    if not GEMINI_KEY or not HAS_LANGCHAIN:
        return _mock_cv_analysis(cv_text, "Gemini API key or LangChain package not configured.")

    try:
        # Initialize LangChain LLM for Gemini
        llm = ChatGoogleGenAI(
            model="gemini-2.5-pro", 
            google_api_key=GEMINI_KEY, 
            temperature=0.0
        )
        
        prompt = ChatPromptTemplate.from_template(
            """Sisteme kayıtlı rolün: Bilgi Yakalama ve Profilleme Uzmanı (CV Analyzer Agent)
Kullandığın LLM: Gemini 2.5 Pro (Büyük veri okuma yeteneği için)
Girdi: pdfplumber tarafından çıkarılan ham CV metni.
Çıktı: Adayın yetkinlik matrisi (Teknoloji yığını, deneyim yılı, seviye tespiti, Europass formatında kişisel ve profesyonel detaylar).
Görev Tanımı (Task Description):
"Lokal parser'dan gelen ham metni oku. İlgili adayın yazılım geliştirme seviyesini (Junior/Entry-Level) doğrula. Özgeçmişte bahsedilen teknolojileri (Örn: Flutter, FastAPI, Docker) kategorize et, adayın güçlü/zayıf alanlarını belirle ve kişisel bilgiler, deneyimler ve eğitim geçmişi gibi Europass detaylarını yapılandırılmış bir JSON şemasına çıkart."

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
  }},
  "europass_data": {{
    "personal": {{
      "phone": "Adayın telefon numarası veya boş string",
      "title": "Ünvan / Meslek (Örn: Backend Developer)",
      "summary": "Kısa profil özeti veya kariyer hedefi",
      "linkedin": "Linkedin profil linki veya boş string",
      "github": "Github profil linki veya boş string",
      "website": "Kişisel web sitesi / Portfolyo linki veya boş string"
    }},
    "experience": [
      {{
        "title": "İş Ünvanı",
        "company": "Şirket Adı",
        "start_date": "Başlangıç Yılı/Ayı",
        "end_date": "Bitiş Yılı/Ayı veya Present / Devam Ediyor",
        "description": "Gerçekleştirilen görevlerin kısa açıklaması"
      }}
    ],
    "education": [
      {{
        "degree": "Bölüm / Derece",
        "school": "Okul / Üniversite Adı",
        "start_date": "Başlangıç Yılı",
        "end_date": "Bitiş Yılı veya Devam Ediyor"
      }}
    ]
  }}
}}

CV TEXT:
{cv_text}"""
        )
        
        # Define chain
        chain = prompt | llm | JsonOutputParser()
        result = chain.invoke({"cv_text": cv_text})
        result["raw_analysis"] = json.dumps(result)
        return result
    except Exception as e:
        print(f"⚠️ LangChain CV Analysis failed, using mock fallback: {e}")
        return _mock_cv_analysis(cv_text, f"LangChain error: {str(e)}")



def _mock_cv_analysis(cv_text: str, reason: str) -> dict:
    """Rule-based mock extractor fallback when LLM is unavailable.
    Parses real CV text for education, experience, about/summary, phone, and social links."""
    import re
    text_lower = cv_text.lower()
    lines = [line.strip() for line in cv_text.split('\n') if line.strip()]
    
    # ──────────── TECH STACK EXTRACTION ────────────
    all_langs = ["python", "javascript", "typescript", "go", "java", "c#", "dart", "c++", "rust", "ruby", "php", "html", "css", "swift", "kotlin", "sql"]
    languages = [l.capitalize() if l not in ["c#", "c++", "html", "css", "sql", "php"] else l.upper() for l in all_langs if l in text_lower]
    
    all_fws = ["fastapi", "django", "flask", "react", "vue", "angular", "flutter", "express", "spring", "laravel", "nextjs", "next.js", ".net", "node.js", "nodejs"]
    frameworks = []
    for f in all_fws:
        if f in text_lower:
            if f == "react": frameworks.append("React.js")
            elif f in ("nextjs", "next.js"): frameworks.append("Next.js")
            elif f in ("nodejs", "node.js"): frameworks.append("Node.js")
            elif f == ".net": frameworks.append(".NET")
            else: frameworks.append(f.capitalize())
            
    all_tools = ["docker", "kubernetes", "git", "jenkins", "aws", "gcp", "npm", "pip", "github", "gitlab", "ci/cd", "ansible", "terraform", "figma", "jira", "postman"]
    tools = []
    for t in all_tools:
        if t in text_lower:
            if t == "aws": tools.append("AWS")
            elif t == "gcp": tools.append("GCP")
            elif t == "ci/cd": tools.append("CI/CD")
            else: tools.append(t.capitalize())

    all_dbs = ["postgresql", "mysql", "mongodb", "sqlite", "redis", "mariadb", "firebase", "cassandra", "mssql"]
    databases = []
    for d in all_dbs:
        if d in text_lower:
            if d == "postgresql": databases.append("PostgreSQL")
            elif d == "sqlite": databases.append("SQLite")
            elif d == "mongodb": databases.append("MongoDB")
            elif d == "mssql": databases.append("MSSQL")
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

    # ──────────── SOCIAL LINKS ────────────
    github_match = re.search(r'(github\.com/[a-zA-Z0-9_.-]+)', cv_text, re.IGNORECASE)
    linkedin_match = re.search(r'(linkedin\.com/in/[a-zA-Z0-9_.-]+)', cv_text, re.IGNORECASE)
    website_match = re.search(r'(https?://(?!github\.com|linkedin\.com)[a-zA-Z0-9._-]+\.[a-z]{2,}[/a-zA-Z0-9._-]*)', cv_text, re.IGNORECASE)
    
    github = f"https://{github_match.group(1)}" if github_match else ""
    linkedin = f"https://{linkedin_match.group(1)}" if linkedin_match else ""
    website = website_match.group(1) if website_match else ""

    # ──────────── PHONE NUMBER ────────────
    phone_match = re.search(r'(\+?\d[\d\s\-()]{7,}\d)', cv_text)
    phone = phone_match.group(1).strip() if phone_match else ""

    # ──────────── SECTION BOUNDARY DETECTION ────────────
    # Turkish-safe lowercase: İ.lower() produces 'i̇' (i + combining dot above)
    # We need to normalize this to plain 'i' for matching
    import unicodedata
    def turkish_lower(text):
        """Lowercase that handles Turkish İ/I correctly."""
        # First do standard lower, then strip combining marks from i̇ → i
        lowered = text.lower()
        # Normalize to NFD (decompose), remove combining dot above (U+0307), then NFC
        nfd = unicodedata.normalize('NFD', lowered)
        cleaned = nfd.replace('\u0307', '')  # Remove combining dot above
        return unicodedata.normalize('NFC', cleaned)
    
    section_map = {}  # section_name -> start_line_index
    section_headers_map = {
        "about": ["hakkımda", "hakkimda", "hakkında", "hakkinda", "about", "summary", "profil özeti", "profil", "profile", "özet", "kariyer hedefi", "objective"],
        "education": ["eğitim", "egitim", "education", "öğrenim", "ogrenim", "akademik"],
        "experience": ["deneyim", "experience", "iş geçmişi", "is gecmisi", "work history", "çalışma geçmişi", "work experience", "iş deneyimi"],
        "skills": ["yetenek", "beceri", "skills", "teknik yetkinlik", "teknolojiler", "technologies"],
        "projects": ["proje", "project"],
        "certificates": ["sertifika", "certif"],
    }
    
    for i, line in enumerate(lines):
        line_normalized = turkish_lower(line).strip()
        for sec_name, headers in section_headers_map.items():
            if sec_name not in section_map:
                for h in headers:
                    if h in line_normalized:
                        section_map[sec_name] = i
                        break

    def get_section_end(sec_name):
        """Find where a section ends (= start of next section or end of file)."""
        start = section_map.get(sec_name)
        if start is None:
            return None
        next_starts = [v for k, v in section_map.items() if k != sec_name and v > start]
        return min(next_starts) if next_starts else len(lines)

    # ──────────── ABOUT / SUMMARY ────────────
    summary = ""
    if "about" in section_map:
        ab_start = section_map["about"] + 1
        ab_end = get_section_end("about")
        summary_lines = []
        for j in range(ab_start, min(ab_start + 10, ab_end)):
            summary_lines.append(lines[j])
        summary = " ".join(summary_lines).strip()

    # ──────────── TITLE / ROLE ────────────
    title = ""
    role_keywords = ["developer", "geliştirici", "mühendis", "engineer", "designer", "tasarımcı", "analyst", "analist", "specialist", "uzman", "intern", "stajyer"]
    for line in lines[:10]:  # Usually title is in first 10 lines
        if any(k in line.lower() for k in role_keywords):
            title = line.strip()
            break
    if not title:
        title = f"{level} Developer"

    # ──────────── EDUCATION ────────────
    education = []
    if "education" in section_map:
        edu_start = section_map["education"] + 1
        edu_end = get_section_end("education")
        
        current_edu = {}
        for j in range(edu_start, edu_end):
            line = lines[j]
            
            uni_keywords = ["üniversite", "universite", "university", "fakülte", "fakulte", "faculty", "okul", "school", "lisesi", "lise", "enstitü", "institute", "akademi", "academy", "koleji", "college"]
            date_match = re.search(r'(\d{4})\s*[-–]\s*(\d{4}|[Dd]evam|[Pp]resent|[Hh]alen|[Gg]ünümüz)', line)
            
            is_school_line = any(uk in line.lower() for uk in uni_keywords)
            
            if is_school_line or date_match:
                # If we detect a school name or a date line, process it
                school_name = ""
                if is_school_line:
                    # Clean the date part from school name
                    school_name = re.sub(r'\d{4}\s*[-–]\s*(\d{4}|[Dd]evam|[Pp]resent|[Hh]alen|[Gg]ünümüz)', '', line).strip()
                
                if is_school_line:
                    # Save previous entry if exists
                    if current_edu.get("school"):
                        education.append(current_edu)
                    current_edu = {"degree": "", "school": school_name, "start_date": "", "end_date": ""}
                
                if date_match and current_edu:
                    current_edu["start_date"] = date_match.group(1)
                    current_edu["end_date"] = date_match.group(2)
                    # If no school yet, line without date might be school
                    if not current_edu.get("school"):
                        cleaned = re.sub(r'\d{4}\s*[-–]\s*(\d{4}|[Dd]evam|[Pp]resent|[Hh]alen|[Gg]ünümüz)', '', line).strip()
                        if cleaned:
                            if current_edu.get("school"):
                                current_edu["degree"] = cleaned
                            else:
                                current_edu["school"] = cleaned
            elif current_edu.get("school") and not current_edu.get("degree") and line and len(line) < 80:
                current_edu["degree"] = line.strip()
        
        if current_edu.get("school"):
            education.append(current_edu)

    # ──────────── EXPERIENCE ────────────
    experience = []
    if "experience" in section_map:
        exp_start = section_map["experience"] + 1
        exp_end = get_section_end("experience")
        
        company_keywords = ["a.ş.", "ltd", "inc", "corp", "şirketi", "yazılım", "teknoloji", "bilişim", "company", "studio", "danışmanlık"]
        
        current_exp = {}
        for j in range(exp_start, exp_end):
            line = lines[j]
            
            date_match = re.search(r'(\d{4})\s*[-–]\s*(\d{4}|[Dd]evam|[Pp]resent|[Hh]alen|[Gg]ünümüz)', line)
            is_company_line = any(ck in line.lower() for ck in company_keywords)
            
            if date_match or is_company_line:
                if current_exp.get("title") or current_exp.get("company"):
                    experience.append(current_exp)
                
                current_exp = {"title": "", "company": "", "start_date": "", "end_date": "", "description": ""}
                
                if date_match:
                    current_exp["start_date"] = date_match.group(1)
                    current_exp["end_date"] = date_match.group(2)
                    cleaned = re.sub(r'\d{4}\s*[-–]\s*(\d{4}|[Dd]evam|[Pp]resent|[Hh]alen|[Gg]ünümüz)', '', line).strip().strip('-–| ')
                    if cleaned:
                        if is_company_line:
                            current_exp["company"] = cleaned
                        else:
                            current_exp["company"] = cleaned  # First dated line is usually company
                elif is_company_line:
                    current_exp["company"] = line.strip()
            elif current_exp:
                if not current_exp.get("title") and any(rk in line.lower() for rk in role_keywords):
                    current_exp["title"] = line.strip()
                else:
                    if current_exp.get("description"):
                        current_exp["description"] += " " + line.strip()
                    else:
                        current_exp["description"] = line.strip()
        
        if current_exp.get("title") or current_exp.get("company"):
            experience.append(current_exp)

    # ──────────── STRENGTHS / WEAKNESSES ────────────
    strong = [f"{frameworks[0]} development" if frameworks else "Web geliştirme"]
    if len(languages) > 1:
        strong.append(f"{languages[0]} & {languages[1]} programlama")
    else:
        strong.append(f"{languages[0]} programlama")
    if tools:
        strong.append(f"{tools[0]} kullanımı")
    
    weak = []
    weak_check = {"docker": "Konteyner teknolojileri", "kubernetes": "Orkestrasyon", "aws": "Bulut mimarisi", "gcp": "Bulut mimarisi", "test": "Birim test yazımı", "ci/cd": "CI/CD süreçleri"}
    for wk, wv in weak_check.items():
        if wk not in text_lower and wv not in weak:
            weak.append(wv)
        if len(weak) >= 2:
            break
    if not weak:
        weak = ["Cloud architecture", "High coverage testing"]

    return {
        "level": level,
        "tech_stack": {
            "languages": languages,
            "frameworks": frameworks,
            "tools": tools,
            "databases": databases
        },
        "strengths_weaknesses": {
            "strong": strong,
            "weak": weak
        },
        "europass_data": {
            "personal": {
                "phone": phone,
                "title": title,
                "summary": summary,
                "linkedin": linkedin,
                "github": github,
                "website": website
            },
            "experience": experience if experience else [],
            "education": education if education else []
        },
        "raw_analysis": f"LOCAL NLP FALLBACK. Reason: {reason}"
    }


# Pool of mock questions categorized by technology topic for offline/mock mode
MOCK_QUESTIONS_BY_TOPIC = {
    "Python": [
        "Python'da bellek yönetimini ve çöp toplayıcı (Garbage Collector) yükünü azaltmak için kod yazarken nelere dikkat edersiniz?",
        "Python async/await mekanizmasının arkasındaki Event Loop yapısını ve senkron kütüphanelerin asenkron fonksiyonda bloklanmaya nasıl sebep olduğunu açıklayabilir misiniz?",
        "Python'da generator'ları (yield) hangi senaryolarda tercih edersiniz? Bellek tüketimi açısından ne gibi avantajlar sağlarlar?",
        "Python'daki GIL (Global Interpreter Lock) kavramını ve çoklu CPU çekirdeklerinden yararlanmak için threading yerine neden multiprocessing tercih edildiğini açıklar mısınız?",
        "[KOD SORUSU] Python'da verilen bir listedeki mükerrer elemanları kaldıran ve sırasını koruyan bir fonksiyonu soldaki kod editörünü kullanarak yazar mısınız?",
        "[KOD SORUSU] Python'da büyük bir dosyayı bellek dostu (memory-efficient) şekilde satır satır okuyan bir generator fonksiyonu soldaki editörde yazıp gönderir misiniz?"
    ],
    "FastAPI": [
        "FastAPI'de dependency injection (Depends) mekanizmasını kullanarak veritabanı bağlantı havuzunu (Connection Pool) verimli şekilde nasıl yönetirsiniz?",
        "FastAPI ile geliştirdiğiniz bir API ucunun yavaş yanıt vermesi durumunda, sorunun I/O kaynaklı mı yoksa CPU-bound mu olduğunu nasıl analiz eder ve çözersiniz?",
        "FastAPI'de Background Tasks (arka plan işleri) hangi senaryolarda yeterlidir, hangi durumlarda Celery ve Redis gibi kuyruk yapılarına geçilmelidir?",
        "FastAPI'de Pydantic şemalarını kullanarak veri doğrulama ve API dokümantasyonunu nasıl özelleştirirsiniz?",
        "[KOD SORUSU] FastAPI'de '/items' endpoint'ine gelen isteklerden 'limit' ve 'offset' query parametrelerini doğrulayarak alan basit bir GET rotasını soldaki editörde yazar mısınız?",
        "[KOD SORUSU] FastAPI ve Pydantic kullanarak, 'email' alanının geçerli bir e-posta olduğunu ve 'sifre' alanının en az 8 karakter olduğunu doğrulayan bir User şemasını soldaki editörde yazar mısınız?"
    ],
    "PostgreSQL": [
        "PostgreSQL'de yavaş çalışan karmaşık sorguları optimize etmek için hangi adımları izlersiniz? EXPLAIN ANALYZE çıktısında öncelikli olarak nelere bakarsınız?",
        "PostgreSQL'de bağlantı havuzu (connection pooling) limitlerine ulaşıldığında uygulamanın hata vermesini engellemek için mimaride ne gibi önlemler alırsınız?",
        "PostgreSQL'de B-Tree index ile GIN index arasındaki farklar nelerdir? Hangi veri tipleri ve arama senaryolarında hangisini tercih edersiniz?",
        "[KOD SORUSU] PostgreSQL'de 'users' tablosundaki kullanıcıların yaş ortalamasını bulup, yaş ortalaması 25'ten büyük olan şehirleri gruplayan SQL sorgusunu soldaki editörde yazar mısınız?",
        "[KOD SORUSU] Bir e-ticaret veritabanında 'orders' (siparişler) tablosundan en çok harcama yapan ilk 3 müşterinin ID'sini ve toplam harcamasını getiren SQL sorgusunu soldaki editörde yazar mısınız?"
    ],
    "Docker": [
        "Docker imaj boyutlarını küçültmek için multi-stage build tekniğini nasıl uygularsınız? Örnek bir Dockerfile tasarımı paylaşabilir misiniz?",
        "Docker container'ları arasında yalıtılmış ve güvenli ağ iletişimi kurmak için hangi Docker network sürücülerini (Bridge, Overlay, Host) tercih edersiniz?",
        "Docker Compose kullanarak ayağa kaldırdığınız servislerin healthcheck ve başlatılma sırası bağımlılıklarını (depends_on condition) nasıl kurgularsınız?"
    ],
    "React.js": [
        "React'te gereksiz render'ları engellemek ve performansı artırmak için useMemo, useCallback ve React.memo kullanım kriterlerini nasıl belirlersiniz?",
        "React'te karmaşık state yönetimini context API yerine Redux Toolkit ile çözmenin mimari avantajları ve sınırları nelerdir?",
        "React component lifecycle'ında useEffect hook'unun cleanup (temizlik) fonksiyonunu hangi durumlarda kullanırsınız? Örnek verebilir misiniz?",
        "[KOD SORUSU] React'te butona her tıklandığında sayacı 1 artıran ve butonda gösteren basit bir Counter componentini soldaki editörde yazar mısınız?",
        "[KOD SORUSU] React'te fetch ile api'den veri çekip listeyen ve component unmount olduğunda iptal işlemi yapan basit bir component kodunu soldaki editörde yazar mısınız?"
    ],
    "General": [
        "Mikroservis mimarisinde servisler arası veri tutarlılığını (Data Consistency) sağlamak için Saga orkestrasyon modelini nasıl tasarlarsınız?",
        "Bir web uygulamasında Redis önbellek (caching) katmanı tasarlarken, verinin eskimemesi ve tutarlı kalması için 'Cache Invalidation' problemlerini nasıl çözersiniz?",
        "Canlı ortamda (production) çalışan bir servis çöktüğünde (crash), hatanın kaynağını tespit etmek için loglama, metrik toplama ve hata izleme (monitoring) süreçlerini nasıl yönetirsiniz?",
        "[KOD SORUSU] Python'da bir string'in palindrom (tersten okunuşu da aynı olan, örn: 'ece') olup olmadığını kontrol eden fonksiyonu soldaki editörde yazar mısınız?",
        "[KOD SORUSU] SQL'de 'employees' tablosundan maaşı en yüksek 2. kişiyi getiren sorguyu soldaki editörde yazar mısınız?"
    ]
}


# TECHNICAL INTERVIEWER AGENT (LangChain + Groq / Gemini Fallback)
def generate_next_question(cv_profile: dict, history: list) -> str:
    """
    Generates the next technical interview question based on CV Profile and history using LangChain.
    """
    if len(history) == 0:
        return (
            "Merhaba! Ben sizin yapay zeka teknik mülakat simülatörünüzüm. Bugün profilinize özel, "
            "senaryo bazlı ve mantık yürütmenizi gerektiren 5 adet teknik soru yönelteceğim.\n\n"
            "Mülakat boyunca sağ taraftaki kod editörünü dilediğiniz dili seçerek kod yazmak için kullanabilir "
            "ve 'Submit Code' butonu ile çözümlerinizi bana doğrudan iletebilirsiniz. Cevaplarınızın derinliğini, "
            "teknik yaklaşımınızı değerlendirip mülakat sonunda size özel bir İK Performans Karnesi oluşturacağım.\n\n"
            "Hazırsanız başlayalım mı?"
        )

    if not HAS_LANGCHAIN:
        return _generate_mock_question(cv_profile, history)


    # Build System Prompt
    level = cv_profile.get("level", "Mid")
    tech_stack = cv_profile.get("tech_stack", {})
    sw = cv_profile.get("strengths_weaknesses", {})
    
    # Format details for prompt
    europass_data = cv_profile.get("europass_data", {}) or {}
    personal = europass_data.get("personal", {}) or {}
    about = personal.get("summary", "Belirtilmemiş")

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
- About/Summary: {about}
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
6. Mülakat esnasında (örneğin 2. ve 4. sorularda), adayın CV'sindeki programlama dilleri veya framework'lerle ilgili kesinlikle en az 1 ya da 2 adet pratik kod yazma sorusu sor! Adaya soldaki kod editörünü kullanmasını hatırlat ve kod yazmasını iste (Örn: "Python'da verilen listenin elemanlarını tersine çeviren bir fonksiyon yazıp sol taraftaki kod editöründen gönderebilir misin?").
"""

    # Format history to LangChain message formats
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in history:
        if msg["role"] in ["interviewer", "assistant"]:
            lc_messages.append(AIMessage(content=msg["content"]))
        else:
            lc_messages.append(HumanMessage(content=msg["content"]))

    # Try Groq with ChatGroq
    if GROQ_KEY:
        try:
            chat = ChatGroq(
                model="llama-3.1-8b-instant", 
                groq_api_key=GROQ_KEY, 
                temperature=0.9
            )
            response = chat.invoke(lc_messages)
            return response.content.strip()
        except Exception as e:
            print(f"⚠️ LangChain ChatGroq failed, falling back to ChatGoogleGenAI: {e}")

    # Fallback to Gemini with ChatGoogleGenAI
    if GEMINI_KEY:
        try:
            chat = ChatGoogleGenAI(
                model="gemini-2.5-pro", 
                google_api_key=GEMINI_KEY, 
                temperature=0.9
            )
            response = chat.invoke(lc_messages)
            return response.content.strip()
        except Exception as e:
            print(f"⚠️ LangChain ChatGoogleGenAI question generation failed: {e}")

    # Final Local Mock Fallback
    return _generate_mock_question(cv_profile, history)


def _generate_mock_question(cv_profile: dict, history: list) -> str:
    """Returns local predefined questions when APIs are offline, randomized based on session_id."""
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

    # Determine if this should be a coding question
    # Ask coding questions at question index 1 and 3 (i.e. 2nd and 4th questions)
    is_coding_round = (q_count in [1, 3])
    
    if is_coding_round:
        pool = [q for q in pool if q.startswith("[KOD SORUSU]")]
    else:
        pool = [q for q in pool if not q.startswith("[KOD SORUSU]")]

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
        "[KOD SORUSU] Python'da bir string'in palindrom olup olmadığını kontrol eden fonksiyonu soldaki editörde yazar mısınız?",
        "Uygulamalarınızda veri tabanı optimizasyonunu sağlamak için ne tür indeksleme ve sorgu iyileştirme teknikleri kullanırsınız?",
        "[KOD SORUSU] SQL'de 'employees' tablosundan maaşı en yüksek 2. kişiyi getiren sorguyu soldaki editörde yazar mısınız?",
        "Canlı ortama (production) kod çıkarken hata izleme (monitoring) ve CI/CD süreçlerini nasıl yönetirsiniz?"
    ]
    return default_questions[q_count]


# PERFORMANCE EVALUATOR AGENT (LangChain + Gemini 1.5 Flash)
def evaluate_interview(cv_profile: dict, history: list) -> dict:
    """
    Evaluates the complete interview transcript and returns structured scoring & roadmap using LangChain.
    """
    if not GEMINI_KEY or not HAS_LANGCHAIN:
        return _mock_evaluation(history, "Gemini API key or LangChain package not configured.")

    # Format transcript
    transcript = ""
    for msg in history:
        sender = "Mülakatçı (AI)" if msg["role"] == "interviewer" else "Aday"
        transcript += f"{sender}: {msg['content']}\n\n"

    try:
        # Initialize LangChain model
        llm = ChatGoogleGenAI(
            model="gemini-2.5-pro", 
            google_api_key=GEMINI_KEY, 
            temperature=0.0
        )
        
        prompt = ChatPromptTemplate.from_template(
            """Sisteme kayıtlı rolün: İK Raporlama ve Analitik Uzmanı (Performance Evaluator Agent)
Kullandığın LLM: Gemini 2.5 Pro (Tüm konuşma geçmişini tek seferde hazmetmesi için)
Girdi: Mülakat bitene kadar biriken tüm Chat logları (Konuşma geçmişi).
Çıktı: Markdown veya JSON formatında adaya özel karne (Puanlama ve Gelişim Yol Haritası).
Görev Tanımı (Task Description):
"Mülakatın başından sonuna kadar üretilen tüm konuşma geçmişini derinlemesine incele. Adayın sorulara verdiği yanıtların doğruluk payını, teknik derinliğini ve problem çözme yaklaşımını değerlendir. Adayı 100 üzerinden puanla. Hangi konularda mükemmel olduğunu, hangi konularda ise kesinlikle kendini geliştirmesi gerektiğini detaylandırarak profesyonel bir İK raporu oluştur."

Candidate Profile:
- Level: {level}
- Tech Stack: {tech_stack}

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
}}"""
        )
        
        # Construct chain
        chain = prompt | llm | JsonOutputParser()
        result = chain.invoke({
            "level": cv_profile.get("level", "Mid"),
            "tech_stack": json.dumps(cv_profile.get("tech_stack", {})),
            "transcript": transcript
        })
        return result
    except Exception as e:
        print(f"⚠️ LangChain Gemini Evaluation failed, using mock fallback: {e}")
        return _mock_evaluation(history, f"LangChain error: {str(e)}")


def _mock_evaluation(history: list, reason: str = "Gemini API offline") -> dict:
    """
    Smarter mock evaluation fallback when LLM is offline.
    Analyzes the actual Q&A transcript dynamically to determine the user's
    technical depth, strong/weak areas, and tailored recommendations.
    """
    # Identify Q&A pairs from history
    pairs = []
    current_q = None
    for msg in history:
        if msg["role"] == "interviewer":
            current_q = msg["content"]
        elif msg["role"] == "candidate" and current_q:
            pairs.append((current_q, msg["content"]))
            current_q = None

    # Topic keyword detector
    topic_keywords = [
        ("yield", "Python Generators (yield)"),
        ("generator", "Python Generators (yield)"),
        ("decorator", "Python Decorators"),
        ("fastapi", "FastAPI Web Hizmetleri"),
        ("router", "API Yönlendirme (Routing)"),
        ("docker", "Docker Konteynerleştirme"),
        ("async", "Asenkron Programlama (async/await)"),
        ("asenkron", "Asenkron Programlama (async/await)"),
        ("sql", "Veritabanı Sorguları ve SQL"),
        ("join", "Veritabanı Sorguları ve SQL"),
        ("query", "Veritabanı Sorguları ve SQL"),
        ("postgresql", "PostgreSQL Veritabanı"),
        ("sqlite", "SQLite Veritabanı"),
        ("test", "Birim Testler (Unit Testing)"),
        ("pytest", "Birim Testler (Unit Testing)"),
        ("git", "Git Versiyon Kontrolü"),
        ("design pattern", "Yazılım Tasarım Kalıpları"),
        ("singleton", "Yazılım Tasarım Kalıpları"),
        ("concurrency", "Eşzamanlılık (Concurrency)"),
        ("thread", "Thread ve Multiprocessing"),
        ("oop", "Nesne Yönelimli Programlama (OOP)"),
        ("nesne", "Nesne Yönelimli Programlama (OOP)"),
    ]

    def detect_topic(question_text):
        q_lower = question_text.lower()
        for kw, name in topic_keywords:
            if kw in q_lower:
                return name
        return "Genel Teknik Konular"

    strong_topics = []
    weak_topics = []
    strong_areas = []
    improvement_areas = []
    recommendations = []
    
    total_q = len(pairs)
    success_count = 0

    for q, a in pairs:
        topic = detect_topic(q)
        a_lower = a.lower()
        
        # Check if they answered "bilmiyorum" or similar or empty/short
        is_dont_know = any(k in a_lower for k in [
            "bilmiyorum", "bilgim yok", "fikrim yok", "emin degilim", 
            "emin değilim", "hatirlamiyorum", "hatırlamıyorum", 
            "gec", "geç", "atla", "atlayalım", "bilgi sahibi değilim"
        ])
        is_short = len(a.strip()) < 15
        
        if is_dont_know or is_short:
            # Failed answer
            if topic not in weak_topics:
                weak_topics.append(topic)
            improvement_areas.append(f"{topic} sorusuna yeterli teknik açıklama sunulamamış veya bilgi eksikliği belirtilmiştir.")
            rec = f"{topic} konusundaki temel ve orta düzey konseptleri, pratik kodlama örnekleriyle tekrar çalışın."
            if rec not in recommendations:
                recommendations.append(rec)
        else:
            # Successful answer
            success_count += 1
            if topic not in strong_topics:
                strong_topics.append(topic)
            strong_areas.append(f"{topic} konusunda sorulan soruya açıklayıcı ve teknik terimlerle doğru yanıt verilmiştir.")

    # Calculate score based on actual answers
    if total_q > 0:
        overall_score = round((success_count / total_q) * 100.0)
    else:
        overall_score = 50.0

    # Ensure we have at least some default strong/weak topics if lists are empty
    if not strong_topics:
        strong_topics = ["Genel Yazılım Geliştirme Mantığı"]
        strong_areas = ["Mülakata katılım gösterme ve soruları yanıtlama isteği."]
    if not weak_topics:
        weak_topics = ["İleri Düzey Sistem Mimarisi"]
        improvement_areas = ["Sistem tasarımı ve ölçeklenebilirlik konularında pratik yapılması önerilir."]
        recommendations = ["Büyük ölçekli web uygulamalarında sistem optimizasyonu pratikleri gerçekleştirin."]

    # Category scores
    technical_depth = min(100, max(20, int(overall_score * 0.95)))
    problem_solving = min(100, max(20, int(overall_score * 1.0)))
    communication = min(100, max(30, 85 if success_count > 0 else 40))

    summary = f"Mülakat değerlendirmesi yerel sistem tarafından aday yanıtlarının dinamik analiziyle yapılmıştır ({reason})."
    if overall_score < 50:
        summary += " Aday, sorulan teknik konularda bazı eksikliklere sahip olup temel düzeyde bilgilere odaklanmalıdır."
    else:
        summary += " Aday, teknik mülakatta sorulan soruların çoğuna başarılı bir şekilde yanıt vererek teknik birikimini göstermiştir."

    return {
        "overall_score": overall_score,
        "category_scores": {
            "technical_depth": technical_depth,
            "problem_solving": problem_solving,
            "communication": communication
        },
        "strong_topics": strong_topics[:4],
        "weak_topics": weak_topics[:4],
        "full_report": {
            "summary": summary,
            "strong_areas": strong_areas[:3],
            "improvement_areas": improvement_areas[:3],
            "recommendations": recommendations[:3]
        }
    }
