import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  Wand2, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Play,
  LogOut
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form & File States
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // Drag & Drop style trigger
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  // Backend Response States
  const [sessionId, setSessionId] = useState(null);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [recentPerformances, setRecentPerformances] = useState([]);

  // Auto-load profile on mount if email exists in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("candidate_email");
    if (savedEmail) {
      setEmail(savedEmail);
      autoLoadProfile(savedEmail);
    }
  }, []);

  const autoLoadProfile = async (savedEmail) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/user/profile?email=${encodeURIComponent(savedEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setName(data.user.name || '');
          setExtractedProfile(data.cv_profile);
          setRecentPerformances(data.recent_performances || []);
        }
      }
    } catch (err) {
      console.error("Otomatik profil yükleme başarısız:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setInfoMessage('');
    }
  };

  // Drag & Drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      // Validate PDF format
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
        setError('');
        setInfoMessage('');
      } else {
        setError("Yalnızca PDF biçimindeki CV dosyaları desteklenmektedir.");
      }
    }
  };

  // Load profile by email manually
  const handleLoadProfile = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Lütfen profili yüklemek için geçerli bir e-posta adresi girin.");
      return;
    }

    setError('');
    setInfoMessage('');
    setIsAnalyzing(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/user/profile?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error("Profil yüklenemedi.");
      }

      const data = await response.json();
      
      if (data.exists) {
        setName(data.user.name || '');
        setExtractedProfile(data.cv_profile);
        setRecentPerformances(data.recent_performances || []);
        localStorage.setItem("candidate_email", email.trim());
        setInfoMessage("Kayıtlı profiliniz başarıyla yüklendi!");
      } else {
        setExtractedProfile(null);
        setRecentPerformances([]);
        setError("Bu e-posta adresiyle kayıtlı bir profil bulunamadı. Lütfen yeni bir CV yükleyin.");
      }
    } catch (err) {
      setError("Sunucudan profil bilgileri alınırken bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload and analyze CV
  const handleAnalyze = async () => {
    if (!file) {
      setError("Lütfen analiz için bir CV PDF dosyası seçin.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setError('');
    setInfoMessage('');
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", name || "Aday");
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "CV analizi başarısız oldu.");
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setExtractedProfile(data.cv_profile);
      setFile(null); // Clear file input state
      
      // Save email to localStorage
      localStorage.setItem("candidate_email", email.trim());
      
      // Refresh profile to pull historical reports
      await autoLoadProfile(email.trim());
      setInfoMessage("CV başarıyla analiz edildi ve profilinize kaydedildi!");
    } catch (err) {
      setError(err.message || "Sunucuyla haberleşirken bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start new interview using already stored CV profile
  const handleStartWithExisting = async () => {
    if (!email.trim()) return;
    setError('');
    setIsAnalyzing(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/new-from-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Yeni mülakat oturumu başlatılamadı.");
      }

      const data = await response.json();
      navigate(`/interview?session_id=${data.session_id}`);
    } catch (err) {
      setError(err.message || "Mülakat başlatılırken bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sign out / Clear saved profile
  const handleSignOut = () => {
    localStorage.removeItem("candidate_email");
    setEmail('');
    setName('');
    setExtractedProfile(null);
    setRecentPerformances([]);
    setSessionId(null);
    setInfoMessage('');
    setError('');
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 overflow-y-auto custom-scrollbar">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-between w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-400 text-xs font-medium">
            <Sparkles size={14} />
            AI Interview Coach
          </div>
          {extractedProfile && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-full text-xs font-medium transition-all"
            >
              <LogOut size={12} />
              Çıkış Yap
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold mt-4 mb-2 tracking-tight">
          Welcome back{name ? `, ${name}` : ', Guest'}
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          E-posta adresinizle giriş yaparak kayıtlı CV yetkinliklerinizi yükleyebilir veya yeni bir PDF CV yükleyerek hemen başlayabilirsiniz.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload CV Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold mb-1">Candidate Profile & CV Ingestion</h2>
            <p className="text-gray-400 text-sm mb-6">Mülakat sorularını kişiselleştirmek için bilgilerinizi yükleyin.</p>
            
            {/* Input fields for Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address *</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="e.g. ahmet@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="flex-1 bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                    required
                  />
                  <button 
                    type="button"
                    onClick={handleLoadProfile}
                    disabled={isAnalyzing || !email.trim() || !email.includes("@")}
                    className="px-4 py-2 bg-[#1a2035] hover:bg-[#232a42] border border-gray-800 text-gray-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Profili Yükle
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ahmet Yılmaz" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-all placeholder-gray-600"
                />
              </div>
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept=".pdf" 
            />

            {/* Dropzone Card with Drag & Drop Event Handlers */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                  : 'border-gray-700 hover:border-blue-500/50 bg-[#0b0f19]/50'
              }`}
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                <UploadCloud size={20} />
              </div>
              <h3 className="font-medium mb-1 text-sm group-hover:text-blue-400 transition-colors duration-200">
                {file ? file.name : "Yeni bir CV sürükleyin veya tıklayarak dosya seçin"}
              </h3>
              <p className="text-gray-500 text-xs mb-4">PDF formatında CV dosyası (max. 10MB).</p>
              
              <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#111827] border border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-800 transition-all duration-200">
                <FileText size={14} className="text-gray-400" />
                Browse files
              </button>
            </div>

            {/* Feedback Messages */}
            {error && (
              <p className="text-red-400 text-xs mt-3">{error}</p>
            )}
            {infoMessage && (
              <p className="text-emerald-400 text-xs mt-3">{infoMessage}</p>
            )}

            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-500 text-xs">Verileriniz güvenli veritabanımızda şifreli saklanır.</p>
              
              <div className="flex items-center gap-3">
                {file && (
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !email}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                  >
                    <Wand2 size={16} className={isAnalyzing ? "animate-spin" : ""} />
                    {isAnalyzing ? "Analyzing..." : "Analyze & Save CV"}
                  </button>
                )}

                {extractedProfile && (
                  <button 
                    onClick={handleStartWithExisting}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                  >
                    <Play size={16} />
                    Start Interview
                  </button>
                )}
              </div>
            </div>
          </div>
 
          {/* Extracted Tech Stack Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">CV Competency Matrix</h2>
                <p className="text-gray-400 text-sm">
                  {extractedProfile ? "Sistem hafızasında kayıtlı olan yetkinlikleriniz" : "Kayıtlı CV yüklendiğinde yetkinlik detayları burada görüntülenecektir"}
                </p>
              </div>
              <div className={`px-2.5 py-1 border rounded text-xs font-medium ${extractedProfile ? "bg-green-900/20 border-green-800/30 text-green-400" : "bg-gray-900/20 border-gray-800/30 text-gray-500"}`}>
                {extractedProfile ? "Parsed & Stored" : "Empty"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {extractedProfile ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 border border-blue-800/30 rounded-full text-sm">
                    <span className="font-semibold text-blue-400">Seniority:</span>
                    <span className="text-gray-200">{extractedProfile.level}</span>
                  </div>
                  
                  {Object.entries(extractedProfile.tech_stack || {}).flatMap(([category, techs]) => 
                    (techs || []).map(tech => ({ name: tech, category: category }))
                  ).map((tech) => (
                    <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-gray-800 rounded-full text-sm hover:border-gray-600 transition-colors duration-200 cursor-default">
                      <span className="font-medium text-gray-200">{tech.name}</span>
                      <span className="text-gray-500 text-xs">{tech.category}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-sm">
                  E-posta adresinizi yazıp "Profili Yükle" diyebilir veya yeni bir CV yükleyerek yetkinliklerinizi belirleyebilirsiniz.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400">
                  <Trophy size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold mb-0.5">
                  {recentPerformances.length > 0 
                    ? Math.round(recentPerformances.reduce((acc, curr) => acc + curr.score, 0) / recentPerformances.length)
                    : 0}
                  <span className="text-gray-500 text-xs font-medium">/100</span>
                </div>
                <div className="text-gray-400 text-xs">Avg. Score</div>
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900/20 flex items-center justify-center text-indigo-400">
                  <Target size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold mb-0.5">{recentPerformances.length}</div>
                <div className="text-gray-400 text-xs">Interviews</div>
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400">
                  <Clock size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold mb-0.5">{recentPerformances.length * 15}m</div>
                <div className="text-gray-400 text-xs">Practice</div>
              </div>
            </div>
          </div>

          {/* Recent Performances Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20 flex flex-col h-[calc(100%-116px)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold">Recent Performances</h2>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {recentPerformances.length > 0 ? (
                recentPerformances.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/interview?session_id=${item.session_id}`)}
                    className={`flex items-center justify-between group cursor-pointer ${idx !== recentPerformances.length - 1 ? 'pb-4 border-b border-gray-800/60' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm
                        ${item.score >= 80 ? 'bg-green-900/20 text-green-500 border border-green-900/50' :
                          item.score >= 60 ? 'bg-amber-900/20 text-amber-500 border border-amber-900/50' :
                            'bg-red-900/20 text-red-500 border border-red-900/50'}`}
                      >
                        {item.score}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-gray-200 group-hover:text-blue-400 transition-colors duration-200">{item.role}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{item.date} · {item.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-300 transition-colors duration-200" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center py-8 leading-relaxed">
                  Geçmiş mülakat geçmişiniz bulunmuyor. E-postanızı girip "Profili Yükle" diyebilir veya yeni bir CV yükleyerek başlayabilirsiniz.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Dashboard;
