import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Loader2,
  FileText,
  Play
} from 'lucide-react';

const EvaluationScreen = () => {
  const navigate = useNavigate();

  // Read session ID from URL query
  const query = new URLSearchParams(window.location.search);
  const urlSessionId = query.get("session_id");

  // Retrieve logged-in user
  const userStr = localStorage.getItem("candidate_user");
  const user = userStr ? JSON.parse(userStr) : null;

  // States
  const [sessionId, setSessionId] = useState(urlSessionId || '');
  const [report, setReport] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    initializeEvaluation();
  }, [urlSessionId]);

  const initializeEvaluation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let targetSessionId = urlSessionId;

      // If no session_id is in URL, fetch user's latest completed session ID from profile history
      if (!targetSessionId) {
        const profileRes = await fetch(`http://127.0.0.1:8000/api/v1/user/profile?email=${encodeURIComponent(user.email)}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.recent_performances && profileData.recent_performances.length > 0) {
            targetSessionId = profileData.recent_performances[0].session_id.toString();
            setSessionId(targetSessionId);
          }
        }
      }

      if (!targetSessionId) {
        // No session completed yet
        setIsLoading(false);
        return;
      }

      // Fetch Report & Session Details in parallel
      const [reportRes, sessionRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/v1/interview/report/${targetSessionId}`),
        fetch(`http://127.0.0.1:8000/api/v1/interview/session/${targetSessionId}`)
      ]);

      if (!reportRes.ok) {
        throw new Error("Değerlendirme raporu bulunamadı.");
      }

      const reportData = await reportRes.json();
      setReport(reportData);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionInfo(sessionData);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Rapor bilgileri yüklenirken bir sunucu hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Retake Interview with the same CV Profile
  const handleRetake = async () => {
    if (!user || !sessionInfo) return;
    setIsLoading(true);
    try {
      // Find CV profile by session info or default user profile
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/new-from-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email
        }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/interview?session_id=${data.session_id}`);
      } else {
        alert("Yeni mülakat başlatılamadı.");
      }
    } catch (err) {
      alert("Sunucu hatası.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#0b0f19] flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-gray-400 text-xs">Değerlendirme karneniz hazırlanıyor...</p>
      </div>
    );
  }

  // EMPTY STATE: No completed interviews
  if (!report) {
    return (
      <div className="flex-1 bg-[#0b0f19] text-gray-200 font-sans p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/10">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mülakat Değerlendirmeniz Hazır Değil</h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            Henüz tamamlanmış bir teknik mülakat simülasyonunuz bulunmuyor. Mülakatı tamamladıktan sonra güçlü yönlerinizi, gelişim alanlarınızı ve yapay zeka çalışma önerilerinizi içeren analiz raporuna buradan ulaşabilirsiniz.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/20 cursor-pointer"
            >
              <Play size={14} />
              İlk Mülakatı Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = report.overall_score || 0;
  const categoryScores = report.category_scores || {};
  const strongTopics = report.strong_topics || [];
  const weakTopics = report.weak_topics || [];
  
  const fullReport = report.full_report || {};
  const summary = fullReport.summary || "Mülakat başarıyla tamamlandı.";
  const strongAreas = fullReport.strong_areas || [];
  const improvementAreas = fullReport.improvement_areas || [];
  const recommendations = fullReport.recommendations || [];

  // Determine Signal Label
  let signalText = "Gelişime Açık";
  let signalBg = "bg-amber-900/30 text-amber-400 border-amber-800/30";
  let signalBadgeColor = "text-amber-400";
  if (overallScore >= 85) {
    signalText = "Mükemmel Aday";
    signalBg = "bg-emerald-900/30 text-emerald-400 border-emerald-800/30";
    signalBadgeColor = "text-emerald-400";
  } else if (overallScore >= 70) {
    signalText = "Güçlü Aday Sinyali";
    signalBg = "bg-blue-900/30 text-blue-400 border-blue-800/50";
    signalBadgeColor = "text-blue-400";
  }

  return (
    <div className="flex-1 bg-[#0b0f19] text-gray-200 font-sans p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-5 mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${signalBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${overallScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {signalText}
                </span>
                <span className="text-xs text-gray-400">
                  {sessionInfo?.cv_filename ? `${sessionInfo.cv_filename.replace('.pdf', '')} Mülakatı #${sessionInfo.attempt_number || 1}` : "Teknik Mülakat Raporu"}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Performans Değerlendirmesi</h1>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-3">
              <a 
                href={`http://127.0.0.1:8000/api/v1/interview/report/${sessionId}?format=pdf`} 
                download
                className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                PDF Raporu İndir
              </a>
              <button 
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-400 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (Assessment & Skills) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Score Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-black/20">
              
              {/* Circular Progress */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle 
                    className="text-blue-500 stroke-current" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                  ></circle> 
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{overallScore}</span>
                  <span className="text-[10px] text-gray-500 mt-1">/ 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-purple-900/20 text-purple-400 rounded-md text-xs font-semibold border border-purple-800/30 mb-3">
                  Genel Performans Karnesi
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {overallScore >= 85 
                    ? "Mükemmel bir teknik derinlik gösterdiniz" 
                    : overallScore >= 70 
                      ? "Ortalamanın üzerinde bir başarı gösterdiniz" 
                      : "Kendinizi geliştirmeniz gereken konular mevcut"}
                </h2>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                  {summary}
                </p>
                
                {/* Quick Metrics */}
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-lg font-bold text-emerald-400">
                      {overallScore >= 90 ? "Top 5%" : overallScore >= 80 ? "Top 15%" : overallScore >= 70 ? "Top 25%" : "Top 50%"}
                    </div>
                    <div className="text-[10px] text-gray-500">Yüzdelik Dilim</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">5/5</div>
                    <div className="text-[10px] text-gray-500">Sorular Cevaplandı</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">~15 Dk</div>
                    <div className="text-[10px] text-gray-500">Mülakat Süresi</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competency Breakdown Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-8 shadow-xl shadow-black/20">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Yetkinlik Analizi</h3>
                <p className="text-xs text-gray-400">Üç ana değerlendirme kriterine göre skor dağılımınız</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-300">Teknik Derinlik (Technical Depth)</span>
                    <span className="text-sm font-bold text-gray-100">{categoryScores.technical_depth || 70}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${categoryScores.technical_depth || 70}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-300">Problem Çözme Yeteneği (Problem Solving)</span>
                    <span className="text-sm font-bold text-gray-100">{categoryScores.problem_solving || 75}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${categoryScores.problem_solving || 75}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-300">İletişim ve İfade Gücü (Communication)</span>
                    <span className="text-sm font-bold text-gray-100">{categoryScores.communication || 70}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${categoryScores.communication || 70}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Grid (Strengths & Improvements) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Strengths */}
              <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-1.5 bg-emerald-900/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-white">Güçlü Yönleriniz</h3>
                </div>
                <ul className="space-y-4">
                  {strongAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                  {strongAreas.length === 0 && (
                    <li className="text-gray-500 text-xs italic">Belirlenmiş güçlü yön bulunmamaktadır.</li>
                  )}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-1.5 bg-amber-900/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-white">Gelişim Alanları</h3>
                </div>
                <ul className="space-y-4">
                  {improvementAreas.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-gray-400">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500/80 mt-0.5 flex-shrink-0"></div>
                      <span>{area}</span>
                    </li>
                  ))}
                  {improvementAreas.length === 0 && (
                    <li className="text-gray-500 text-xs italic">Belirlenmiş gelişim alanı bulunmamaktadır.</li>
                  )}
                </ul>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Learning & Evolution) */}
          <div className="lg:col-span-1">
            {/* AI Study Roadmap Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col h-full">
              
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 bg-blue-900/20 rounded-lg border border-blue-900/50 mt-1">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Gelişim Yol Haritası</h2>
                  <p className="text-xs text-gray-400">Performansınıza göre özel üretilen öneriler</p>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-[#0d111d] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors group animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-800/50">
                          {idx + 1}
                        </div>
                        <h4 className="font-semibold text-gray-200 text-xs truncate max-w-[180px]">Öneri #{idx + 1}</h4>
                      </div>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-800/50">Öncelikli</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed ml-9">
                      {rec}
                    </p>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <p className="text-gray-500 text-xs italic text-center py-12">Yol haritası önerisi bulunmamaktadır.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EvaluationScreen;
export { EvaluationScreen };
