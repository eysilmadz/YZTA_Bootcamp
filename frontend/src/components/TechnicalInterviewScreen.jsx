import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Play, CheckCircle, ChevronDown, Terminal, ArrowLeft, Loader2, Award, BookOpen, AlertTriangle } from 'lucide-react';

const TechnicalInterviewScreen = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // URL Session Parameter
  const [sessionId, setSessionId] = useState(null);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Progress Stats
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [report, setReport] = useState(null);

  // Parse session_id on mount
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("session_id");
    if (!id) {
      setError("Mülakat oturumu bulunamadı. Lütfen önce CV yükleyiniz.");
      setLoading(false);
      return;
    }
    setSessionId(id);
    startInterview(id);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async (sessId) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: parseInt(sessId) }),
      });

      if (!response.ok) {
        throw new Error("Mülakat başlatılamadı.");
      }

      const data = await response.json();
      setMessages([{ role: "interviewer", content: data.question }]);
      setQuestionNumber(data.question_number || 1);
      setTotalQuestions(data.total_questions || 5);
    } catch (err) {
      setError("Mülakat başlatılırken sunucudan cevap alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending || interviewCompleted) return;

    const candidateAnswer = inputText.trim();
    setInputText("");
    setIsSending(true);

    // 1. Add user answer to chat
    setMessages((prev) => [...prev, { role: "candidate", content: candidateAnswer }]);

    try {
      // 2. Send answer to backend
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: parseInt(sessionId),
          answer: candidateAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Cevap iletme hatası.");
      }

      const data = await response.json();

      if (data.interview_completed) {
        setInterviewCompleted(true);
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: data.question },
        ]);
        setQuestionNumber(data.question_number);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "interviewer", content: "⚠️ Cevabınız alınamadı, lütfen tekrar deneyin veya internet bağlantınızı kontrol edin." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndInterview = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: parseInt(sessionId) }),
      });

      if (!response.ok) {
        throw new Error("Değerlendirme raporu oluşturulamadı.");
      }

      const reportData = await response.json();
      setReport(reportData);
    } catch (err) {
      alert("Değerlendirme raporu hazırlanırken bir hata oluştu: " + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBack = () => {
    if (report) {
      navigate('/');
      return;
    }
    const isConfirmed = window.confirm("Mülakatı yarıda kesmek istediğinize emin misiniz? İlerlemeniz kaydedilmeyebilir.");
    if (isConfirmed) {
      navigate('/');
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#090b14] text-white">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Mülakat oturumu hazırlanıyor, lütfen bekleyin...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#090b14] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-900/50">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Hata Oluştu</h2>
        <p className="text-gray-400 text-sm max-w-md mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // 3. AI Evaluation Report Screen
  if (report) {
    const scores = report.category_scores || {};
    const full = report.full_report || {};
    
    return (
      <div className="flex-1 overflow-y-auto bg-[#090b14] text-white p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800/60 pb-6">
            <div>
              <span className="text-xs text-purple-400 font-semibold tracking-wider uppercase">Değerlendirme Raporu</span>
              <h1 className="text-3xl font-bold mt-1 tracking-tight">Teknik Mülakat Sonucu</h1>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              Ana Panele Dön
            </button>
          </div>

          {/* Core Stats / Score Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Overall Score Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full bg-purple-500/10 border-4 border-dashed border-purple-500/20"></div>
                <div className="text-3xl font-extrabold text-purple-400">{report.overall_score || 0}</div>
              </div>
              <h3 className="font-semibold text-gray-200">Genel Puan</h3>
              <p className="text-xs text-gray-400 mt-1">100 üzerinden başarı skoru</p>
            </div>

            {/* Category Scores Card */}
            <div className="md:col-span-2 bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-semibold text-gray-200">Bölüm Bazlı Puanlar</h3>
              
              <div className="space-y-3">
                {[
                  { name: "Teknik Derinlik", key: "technical_depth", val: scores.technical_depth || 70, color: "bg-blue-500" },
                  { name: "Problem Çözme Yeteneği", key: "problem_solving", val: scores.problem_solving || 75, color: "bg-indigo-500" },
                  { name: "İletişim ve İfade", key: "communication", val: scores.communication || 70, color: "bg-emerald-500" }
                ].map((cat) => (
                  <div key={cat.key}>
                    <div className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                      <span>{cat.name}</span>
                      <span>{cat.val}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className={`${cat.color} h-full transition-all duration-500`} style={{ width: `${cat.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Topics & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strong Topics */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold">
                <Award size={18} />
                <span>Güçlü Konular</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(report.strong_topics || []).map((t, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-900/20 border border-green-800/30 text-green-400 rounded-full text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Weak Topics */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold">
                <AlertTriangle size={18} />
                <span>Geliştirilmesi Gereken Konular</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(report.weak_topics || []).map((t, idx) => (
                  <span key={idx} className="px-3 py-1 bg-amber-900/20 border border-amber-800/30 text-amber-400 rounded-full text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Detailed Summary Report */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Detaylı Değerlendirme Raporu</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{full.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-800/60 pt-6">
              
              {/* Strong Areas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-emerald-400 text-sm">Öne Çıkan Başarılar</h3>
                <ul className="list-disc list-inside text-gray-300 text-xs space-y-2 leading-relaxed">
                  {(full.strong_areas || []).map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-400 text-sm">Gelişim Alanları</h3>
                <ul className="list-disc list-inside text-gray-300 text-xs space-y-2 leading-relaxed">
                  {(full.improvement_areas || []).map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Recommendations */}
            <div className="border-t border-gray-800/60 pt-6 space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <BookOpen size={18} />
                <span>Kişiselleştirilmiş Gelişim Önerileri</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(full.recommendations || []).map((rec, idx) => (
                  <div key={idx} className="p-4 bg-[#0b0f19] border border-gray-800 rounded-xl text-xs text-gray-300 leading-relaxed">
                    <span className="font-bold text-purple-400 mr-1.5">{idx + 1}.</span> {rec}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // 4. Chat/Interview Screen
  return (
    <div className="flex h-full w-full bg-[#090b14] text-white font-sans overflow-hidden">
      {/* LEFT PANEL: Chat Flow */}
      <div className="w-1/2 flex flex-col border-r border-[#1e2335] bg-[#0d111d]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2335] bg-[#0f1322]">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-1.5 bg-[#1a2035] hover:bg-[#232a42] text-gray-400 hover:text-white rounded-lg border border-[#2a3045] transition-all flex items-center justify-center group"
              title="Geri Dön"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-200">AI Technical Interviewer</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-gray-400">
                  Soru: {questionNumber} / {totalQuestions}
                </span>
              </div>
            </div>
          </div>

          {(interviewCompleted || messages.length > 2) && (
            <button 
              onClick={handleEndInterview}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rapor Hazırlanıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mülakatı Bitir
                </>
              )}
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => {
            const isBot = msg.role === 'interviewer';
            return (
              <div 
                key={index} 
                className={`flex gap-4 max-w-[85%] ${isBot ? 'animate-fade-in-up' : 'ml-auto justify-end animate-fade-in-up'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                
                <div className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                  isBot 
                    ? 'bg-[#1a1f33] rounded-tl-sm text-gray-300 border-[#232a42]' 
                    : 'bg-blue-600 rounded-tr-sm text-white border-blue-500'
                }`}>
                  <p>{msg.content}</p>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner border border-blue-400/50">
                    <span className="text-xs font-bold text-white tracking-wider">AD</span>
                  </div>
                )}
              </div>
            );
          })}
          {isSending && (
            <div className="flex gap-4 max-w-[85%] animate-pulse">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              </div>
              <div className="bg-[#1a1f33] rounded-2xl rounded-tl-sm p-4 text-sm text-gray-500 border border-[#232a42]">
                Düşünülüyor...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#0f1322] border-t border-[#1e2335]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || interviewCompleted}
              placeholder={interviewCompleted ? "Mülakat tamamlandı, lütfen bitirme butonuna tıklayın." : "Cevabınızı buraya yazın..."} 
              className="w-full bg-[#161b2c] border border-[#2a3045] text-gray-200 text-sm rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              type="submit"
              disabled={isSending || interviewCompleted || !inputText.trim()}
              className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-all flex items-center justify-center shadow-lg shadow-purple-600/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: Mock Code Editor (Static template) */}
      <div className="w-1/2 flex flex-col bg-[#0b0e17]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0f1322] border-b border-[#1e2335]">
          <div className="flex">
            <div className="px-5 py-3 border-t-2 border-t-transparent border-b-2 border-b-purple-500 bg-[#161b2c] text-sm text-purple-100 font-medium flex items-center gap-2 relative">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center">
                 <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
              </span>
              solution.js
            </div>
            <div className="px-5 py-3 text-sm text-gray-500 font-medium flex items-center gap-2 hover:text-gray-300 cursor-pointer transition-colors">
              tests.js
            </div>
          </div>
          <div className="px-4">
            <button className="flex items-center gap-2 text-xs text-gray-400 bg-[#1a2035] hover:bg-[#232a42] px-3 py-1.5 rounded-md border border-[#2a3045] transition-colors shadow-sm">
              JavaScript
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-auto bg-[#0b0e17] font-mono text-[13.5px] leading-[1.65rem] py-4 flex custom-scrollbar">
          {/* Line Numbers */}
          <div className="w-12 flex flex-col text-right pr-4 text-[#3c4461] select-none border-r border-[#1e2335]">
            {[...Array(21)].map((_, i) => {
              const lineNum = i + 1;
              const isActive = lineNum >= 9 && lineNum <= 12; // Highlighting a block
              return (
                 <span key={lineNum} className={`block ${isActive ? "text-purple-400/80 bg-purple-500/10 border-r-2 border-purple-500 -mr-[1px] pr-[15px]" : "pr-4"}`}>
                  {lineNum}
                </span>
              );
            })}
          </div>
          {/* Code Area */}
          <div className="flex-1 pl-4 text-gray-300 whitespace-pre overflow-x-auto custom-scrollbar">
<span className="text-[#6b728e] italic">/**</span>
<span className="text-[#6b728e] italic"> * Algoritma / Sistem Tasarımı ve Pratik Kodlama Çözümleri</span>
<span className="text-[#6b728e] italic"> * Mülakatçı ajanın sorularını sol panelden takip edebilir,</span>
<span className="text-[#6b728e] italic"> * çözümlerinizi doğrudan bu alana kodlayarak açıklayabilirsiniz.</span>
<span className="text-[#6b728e] italic"> */</span>
<span className="text-purple-400">function</span> <span className="text-blue-400">solveChallenge</span>() &#123;
  <span className="text-[#6b728e] italic">// Hazır olduğunuzda kodunuzu buraya yazabilirsiniz.</span>
  <span className="text-purple-400">const</span> <span className="text-gray-300">result</span> <span className="text-gray-400">=</span> [];
  
  <span className="text-purple-400">return</span> <span className="text-gray-300">result</span>;
&#125;
          </div>
        </div>

        {/* Bottom Control Footer */}
        <div className="h-14 bg-[#0f1322] border-t border-[#1e2335] flex items-center justify-between px-6">
          <div className="flex items-center gap-5 text-[11px] text-[#6b728e] font-mono tracking-wide uppercase">
            <span>Ln 1, Col 1</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => alert("Kod çalıştırma simülasyonu başarılı.")} className="flex items-center gap-2 px-4 py-2 bg-[#1a2035] hover:bg-[#232a42] text-gray-300 text-sm font-medium rounded-lg border border-[#2a3045] transition-all focus:outline-none focus:ring-2 focus:ring-gray-600">
              <Play className="w-4 h-4 text-gray-400" />
              Run
            </button>
            <button onClick={handleEndInterview} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0f1322]">
              <CheckCircle className="w-4 h-4" />
              Mülakatı Sonlandır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterviewScreen;
