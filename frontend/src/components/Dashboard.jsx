import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  Wand2, 
  Play, 
  ChevronRight, 
  Trophy, 
  Target, 
  Clock, 
  ArrowUpRight,
  AlertTriangle,
  FolderOpen,
  User
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Retrieve logged-in user
  const userStr = localStorage.getItem("candidate_user");
  const user = userStr ? JSON.parse(userStr) : null;

  // States
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [cvProfile, setCvProfile] = useState(null);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [recentPerformances, setRecentPerformances] = useState([]);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load user CV & stats on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserProfileData();
  }, []);

  const loadUserProfileData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/user/profile?email=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          if (data.cv_profile) {
            setCvProfile(data.cv_profile);
            setSelectedCvId(data.cv_profile.id.toString());
          } else {
            setCvProfile(null);
            setSelectedCvId('');
          }
          setRecentPerformances(data.recent_performances || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMessage('');
      setInfoMessage('');
    }
  };

  // Drag & Drop
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
      if (droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
        setErrorMessage('');
        setInfoMessage('');
      } else {
        setErrorMessage("Lütfen sadece PDF formatında CV dosyası seçin.");
      }
    }
  };

  // Upload and parse new CV
  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setErrorMessage('');
    setInfoMessage('');

    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("name", user.name);
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("CV analiz edilip yüklenemedi.");
      }

      const data = await response.json();
      setFile(null);
      setInfoMessage("CV başarıyla yüklendi, analiz edildi ve profilinize kaydedildi! Profilinizi incelemek için Profile sayfasına yönlendiriliyorsunuz...");

      // Reload profile
      await loadUserProfileData();

      // Navigate to Profile page to show the analyzed CV data
      setTimeout(() => {
        navigate('/profile?cv-updated=true');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "Ayrıştırma hatası oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start interview session with primary CV
  const handleStartWithExisting = async (overrideCvId = null) => {
    const cvId = overrideCvId || selectedCvId;
    if (!cvId) {
      setErrorMessage("Lütfen mülakata başlamak için önce bir CV yükleyin veya profil sayfasından oluşturun.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const cvProfileId = typeof cvId === 'string' ? parseInt(cvId) : cvId;
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/new-from-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          cv_profile_id: cvProfileId
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Yeni mülakat oturumu başlatılamadı.");
      }

      const data = await response.json();
      if (data.session_id) {
        navigate(`/interview?session_id=${data.session_id}`);
      } else {
        throw new Error("Mülakat oturumu ID'si alınamadı.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Mülakat başlatılırken sunucu hatası oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="flex-1 bg-[#0b0f19] text-gray-200 p-8 overflow-y-auto custom-scrollbar">
      
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          AI-Hire Coach Dashboard
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Hoş Geldiniz, {user?.name || "Aday"}</h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Mülakata girmek istediğiniz özgeçmişinizi aşağıdan yönetebilir, PDF CV yükleyerek yapay zeka analizini anında başlatabilirsiniz.
        </p>
      </div>

      {/* Warning if no CV uploaded */}
      {!cvProfile && (
        <div className="mb-6 bg-amber-950/20 border border-amber-900/30 rounded-2xl p-5 flex gap-4 items-start animate-fade-in select-none">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-amber-400">Henüz Bir CV Yüklemediniz!</h3>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              Yapay zeka mülakatçısının size özel teknik senaryolar hazırlayabilmesi için öncelikle bir özgeçmişe ihtiyacımız var. Aşağıdaki alandan bir PDF yükleyebilir ya da <Link to="/profile" className="text-purple-400 hover:underline font-bold">Profil Sayfanızdan</Link> adım adım Europass özgeçmişinizi oluşturabilirsiniz.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: CV Management Dropzone & Tech Stack Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CV Selector & Ingestion */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 select-none">
              <div>
                <h2 className="text-lg font-semibold mb-1">Mülakat Özgeçmişiniz</h2>
                <p className="text-gray-400 text-sm">Mülakatta kullanılacak aktif tekil CV profiliniz.</p>
              </div>

              {cvProfile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/15 border border-purple-500/25 rounded-xl text-xs font-semibold text-purple-400">
                  <FolderOpen size={14} />
                  Aktif CV Kaydı Yüklü
                </div>
              )}
            </div>

            {/* Display Active CV Info Header if Loaded */}
            {cvProfile && (
              <div className="p-4 bg-[#0b0f19]/45 border border-purple-500/15 rounded-xl flex items-center justify-between gap-4 mb-6 select-none animate-fade-in">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-900/40 text-purple-400 border border-purple-800/25 px-2.5 py-0.5 rounded">
                    {cvProfile.level || 'Mid'}
                  </span>
                  <h3 className="text-sm font-bold text-gray-200 mt-2">
                    {cvProfile.europass_data?.personal?.title || 'Yazılım Geliştirici'}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 truncate max-w-[400px]">
                    {cvProfile.tech_stack?.languages?.concat(cvProfile.tech_stack?.frameworks || []).slice(0, 6).join(', ') || 'Yetenekler listelenmemiş'}
                  </p>
                </div>
                <Link 
                  to="/profile" 
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline shrink-0"
                >
                  Düzenle
                </Link>
              </div>
            )}

            {/* Dropzone Card */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 hover:border-blue-500/50 bg-[#0b0f19]/50'
              }`}
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <UploadCloud size={24} />
              </div>
              <h3 className="font-medium mb-1 group-hover:text-blue-400 transition-colors duration-200">
                {file ? file.name : "Yeni bir CV sürükleyin veya tıklayarak seçin"}
              </h3>
              <p className="text-gray-500 text-xs mb-6">
                {file ? "PDF Seçildi. Mülakata gitmek için yüklemeyi başlatın." : "PDF biçiminde maksimum 10MB."}
              </p>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileSelect();
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-[#111827] border border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-800 transition-all duration-200 cursor-pointer"
              >
                <FileText size={14} className="text-gray-400" />
                Dosya Seç
              </button>
            </div>

            {/* Messages */}
            {errorMessage && <p className="text-red-400 text-xs mt-3">{errorMessage}</p>}
            {infoMessage && <p className="text-emerald-400 text-xs mt-3">{infoMessage}</p>}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              className="hidden" 
            />

            <div className="flex items-center justify-between mt-6 select-none">
              <p className="text-gray-500 text-xs">Yeni CV yüklemek mevcut mülakat profilinizi günceller.</p>
              <div className="flex gap-3">
                {file && (
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-900/20 cursor-pointer"
                  >
                    <Wand2 size={16} className={isAnalyzing ? "animate-spin" : ""} />
                    {isAnalyzing ? "Analiz Ediliyor..." : "CV Yükle & Analiz Et"}
                  </button>
                )}

                {cvProfile && !file && (
                  <button 
                    onClick={() => handleStartWithExisting()}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-lg shadow-purple-900/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={16} />
                    Mülakatı Başlat
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Extracted Tech Stack Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between mb-4 select-none">
              <div>
                <h2 className="text-lg font-semibold mb-1">Seçili Yetkinlik Matrisi</h2>
                <p className="text-gray-400 text-sm">
                  {cvProfile ? "Özgeçmişinizden çözümlenen yetkinlik listesi" : "Özgeçmiş yüklendiğinde yetkinlikler burada görüntülenecektir"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cvProfile ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 border border-blue-800/30 rounded-full text-sm select-none">
                    <span className="font-semibold text-blue-400">Level:</span>
                    <span className="text-gray-200">{cvProfile.level}</span>
                  </div>
                  {Object.entries(cvProfile.tech_stack || {}).flatMap(([category, techs]) => 
                    (techs || []).map(tech => ({ name: tech, level: category }))
                  ).map((tech) => (
                    <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-gray-800 rounded-full text-sm hover:border-gray-650 transition-colors duration-200 cursor-default select-none">
                      <span className="font-medium text-gray-200">{tech.name}</span>
                      <span className="text-purple-400 text-xs">{tech.level}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-sm py-4 select-none italic">Mevcut bir CV kaydı bulunmuyor. Lütfen mülakat için bir PDF yükleyin.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Performance Stats & Recent Performances */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 select-none">
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-black/20">
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
                  <span className="text-gray-550 text-xs font-medium">/100</span>
                </div>
                <div className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">Avg. Score</div>
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900/20 flex items-center justify-center text-indigo-400">
                  <Target size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold mb-0.5">{recentPerformances.length}</div>
                <div className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">Interviews</div>
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400">
                  <Clock size={16} />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold mb-0.5">{recentPerformances.length * 15}m</div>
                <div className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">Practice</div>
              </div>
            </div>
          </div>

          {/* Recent Performances Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 flex flex-col h-[calc(100%-116px)] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-6 select-none">
              <h2 className="text-sm font-semibold">Son Mülakatlarım</h2>
              <span className="text-[10px] uppercase font-bold text-gray-500">Geçmiş Raporlar</span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {recentPerformances.length > 0 ? (
                recentPerformances.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/evaluation?session_id=${item.session_id}`)}
                    className="flex items-center justify-between group cursor-pointer pb-2 border-b border-gray-850/40 hover:border-gray-800 transition-colors"
                    title="Performans Raporunu Gör"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs bg-blue-900/20 text-blue-400 border border-blue-900/50">
                        {item.score}
                      </div>
                      <div>
                        <h3 className="font-medium text-xs text-gray-200 group-hover:text-purple-400 transition-colors duration-200">{item.role}</h3>
                        <p className="text-gray-500 text-[10px] mt-0.5">{item.date} · Completed</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center py-8 italic select-none">Tamamlanmış mülakat geçmişiniz bulunmuyor.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Dashboard;
export { Dashboard };
