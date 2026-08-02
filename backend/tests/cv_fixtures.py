# backend/tests/cv_fixtures.py
#
# [QA] CV Pipeline Testi — Fixture Verileri
#
# pdfplumber'ın gerçek bir PDF'den çıkaracağı ham metni simüle eder.
# Her senaryo farklı bir edge case'i temsil eder.

# ---------------------------------------------------------------------------
# SENARYO 1 — Standart Junior Backend CV
# Beklenen: level=Junior, tech_stack dolu, güçlü/zayıf alanlar net
# ---------------------------------------------------------------------------
CV_JUNIOR_BACKEND = """
Ahmet Yılmaz
Backend Developer
ahmet.yilmaz@email.com | github.com/ahmetyilmaz | İstanbul

ÖZET
Yazılım mühendisliği bölümü mezunu, 1 yıllık Python ve FastAPI deneyimi olan
backend geliştirici adayı.

DENEYİM
Junior Backend Developer — XYZ Startup (Haziran 2023 - Haziran 2024)
- FastAPI ile RESTful API geliştirdi
- PostgreSQL veritabanı tasarımı ve SQLAlchemy ORM kullandı
- Docker ile uygulama containerize etti
- Git ile versiyon kontrolü yönetti

Stajyer Yazılım Geliştirici — ABC Şirketi (Ocak 2023 - Mayıs 2023)
- Python ile veri işleme scriptleri yazdı
- MySQL sorguları yazdı

EĞİTİM
Bilgisayar Mühendisliği — İstanbul Teknik Üniversitesi (2019-2023)

TEKNİK BECERİLER
Diller: Python, SQL
Framework: FastAPI, SQLAlchemy
Araçlar: Docker, Git, Postman
Veritabanı: PostgreSQL, MySQL
"""

# ---------------------------------------------------------------------------
# SENARYO 2 — Full-Stack Mid-Level CV
# Beklenen: level=Mid, hem frontend hem backend teknolojiler, 3 yıl deneyim
# ---------------------------------------------------------------------------
CV_MID_FULLSTACK = """
Zeynep Kaya
Full Stack Developer
zeynep.kaya@email.com | linkedin.com/in/zeynepkaya | Ankara

ÖZET
3 yıl deneyimli full-stack geliştirici. React ve Node.js ile modern web
uygulamaları geliştiriyor, AWS üzerinde deploy ediyor.

DENEYİM
Mid-Level Full Stack Developer — DEF Teknoloji (Mart 2022 - Halen)
- React ile SPA uygulamaları geliştirdi
- Node.js/Express REST API'lar tasarladı
- MongoDB Atlas kullandı
- AWS EC2 ve S3 üzerinde deployment yaptı
- Jest ile unit test yazdı

Junior Developer — GHI Ajans (Temmuz 2021 - Mart 2022)
- Vue.js ile frontend geliştirdi
- PHP/Laravel ile backend API yazdı

EĞİTİM
Yazılım Mühendisliği — Orta Doğu Teknik Üniversitesi (2017-2021)

TEKNİK BECERİLER
Frontend: React, Vue.js, HTML5, CSS3, Tailwind
Backend: Node.js, Express, PHP, Laravel
Veritabanı: MongoDB, PostgreSQL
DevOps: AWS (EC2, S3), Docker
Test: Jest, Postman
"""

# ---------------------------------------------------------------------------
# SENARYO 3 — Mobile Developer CV (Flutter/Dart ağırlıklı)
# Beklenen: level=Junior/Mid, Flutter ve Dart dominant, backend bilgisi sınırlı
# ---------------------------------------------------------------------------
CV_MOBILE_FLUTTER = """
Mehmet Demir
Mobile Application Developer
mehmet.demir@email.com | İzmir

DENEYİM
Flutter Developer — JKL Mobil (Eylül 2022 - Halen)
- Flutter ile iOS ve Android uygulamaları geliştirdi
- Dart programlama dili kullandı
- Firebase Firestore ve Authentication entegrasyonu yaptı
- GetX ve Riverpod state management kütüphanelerini kullandı
- REST API entegrasyonları gerçekleştirdi

Stajyer — MNO Yazılım (Yaz 2022)
- Android Studio ile native Android uygulama geliştirdi
- Java kullandı

EĞİTİM
Bilgisayar Programcılığı — Ege Üniversitesi MYO (2020-2022)

TEKNİK BECERİLER
Diller: Dart, Java, Python (temel)
Framework: Flutter, GetX, Riverpod
Backend: Firebase, REST API
Araçlar: Git, Android Studio, Xcode
"""

# ---------------------------------------------------------------------------
# SENARYO 4 — EDGE CASE: Çok Kısa ve Bilgi Eksik CV
# Beklenen: sistem hata vermemeli, eksik alanlar None/boş dönmeli
# ---------------------------------------------------------------------------
CV_MINIMAL = """
Ali Veli
ali@email.com

Python biliyorum. Biraz web sitesi yaptım. Üniversite öğrencisiyim.
"""

# ---------------------------------------------------------------------------
# SENARYO 5 — EDGE CASE: Çok Uzun ve Gürültülü CV (10+ yıl deneyim, karmaşık)
# Beklenen: sistem yavaşlamamalı, en güncel/önemli teknolojileri yakalamalı
# ---------------------------------------------------------------------------
CV_SENIOR_NOISY = """
Dr. Fatma Şahin — Senior Software Architect & Tech Lead
fatma.sahin@email.com | github.com/fatmasahin | linkedin.com/in/fatmasahin

ÖZET
15 yıllık yazılım geliştirme, mimari tasarım ve takım liderliği deneyimi.
Fintech, e-ticaret ve sağlık sektörlerinde büyük ölçekli sistemler kurdu.

DENEYİM (Kronolojik, en yeniden eskiye)

Principal Software Architect — PQR Fintech (2020-Halen)
- Microservices mimarisine geçiş liderliği (15 monolitik servisi 60 microservice'e böldü)
- Kubernetes (EKS) orchestration kurdu, %99.99 uptime sağladı
- Kafka ile event-driven architecture tasarladı, günlük 50M mesaj işlendi
- Python, Go, Java polyglot ortamını yönetti
- Platform engineering ekibini (12 kişi) yönetti
- gRPC ile inter-service iletişim standardize etti

Senior Backend Developer — STU E-ticaret (2016-2020)
- Django ve DRF ile monolitik e-ticaret platformunu yönetti
- Redis caching ile response time'ı %70 düşürdü
- Celery ile asenkron görev kuyruğu kurdu
- PostgreSQL optimizasyonu, query tuning, index stratejileri
- Elasticsearch ile ürün arama motoru geliştirdi

Backend Developer — VWX Sağlık (2013-2016)
- Java Spring Boot ile HL7 FHIR uyumlu sağlık API'ları geliştirdi
- Oracle DB yönetimi
- HIPAA uyumluluk gereksinimleri

Junior Developer — YZ Ajans (2009-2013)
- PHP, MySQL, jQuery ile web siteleri geliştirdi
- Linux server yönetimi öğrendi

EĞİTİM
Bilgisayar Mühendisliği Doktorası — Boğaziçi Üniversitesi (2009-2014)
Bilgisayar Mühendisliği Lisans — Boğaziçi Üniversitesi (2005-2009)

TEKNİK BECERİLER
Diller: Python, Go, Java, PHP (eski), SQL
Backend: Django, FastAPI, Spring Boot, gRPC
Mesajlaşma: Kafka, RabbitMQ, Redis
DevOps: Kubernetes, Docker, Terraform, AWS, GCP
Veritabanı: PostgreSQL, Redis, Elasticsearch, Oracle, MongoDB
Araçlar: Git, Jenkins, GitHub Actions, Grafana, Prometheus
"""

# ---------------------------------------------------------------------------
# SENARYO 6 — EDGE CASE: Tamamen Boş / Sadece Boşluk
# Beklenen: sistem çökmemeli, None/boş sonuç dönmeli
# ---------------------------------------------------------------------------
CV_EMPTY = "   \n\n\t\n   "

# ---------------------------------------------------------------------------
# SENARYO 7 — EDGE CASE: Türkçe Karakter ve Özel Format
# Beklenen: encoding sorunları olmadan doğru parse edilmeli
# ---------------------------------------------------------------------------
CV_TURKISH_CHARS = """
Şükrüye Öztürk
şükrüye.öztürk@email.com | İstanbul

DENEYİM
Yazılım Geliştirici — Çınar Teknoloji Çözümleri AŞ (2022-2024)
- İleri düzey Python geliştirme
- Veri çözümleme ve görselleştirme (Pandas, NumPy, Matplotlib)
- Makine öğrenmesi modelleri (Scikit-learn, TensorFlow)
- REST API geliştirme (Flask)

EĞİTİM
İstatistik — Ankara Üniversitesi (2018-2022)

BECERİLER: Python, Pandas, NumPy, Scikit-learn, TensorFlow, Flask, SQL, Git
"""

ALL_SCENARIOS = {
    "junior_backend": CV_JUNIOR_BACKEND,
    "mid_fullstack": CV_MID_FULLSTACK,
    "mobile_flutter": CV_MOBILE_FLUTTER,
    "minimal": CV_MINIMAL,
    "senior_noisy": CV_SENIOR_NOISY,
    "empty": CV_EMPTY,
    "turkish_chars": CV_TURKISH_CHARS,
}
