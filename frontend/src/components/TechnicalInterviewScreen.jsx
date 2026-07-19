import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Play, 
  CheckCircle, 
  ChevronDown, 
  Terminal, 
  ArrowLeft,
  Loader2,
  FileDown,
  ExternalLink
} from 'lucide-react';

const CODE_TEMPLATES = {
  JavaScript: `/**
 * Problem çözümünüzü buraya yazın.
 */
function solution(nums, target) {
  // Kodunuzu buraya yazın
  return null;
}`,
  Python: `# Problem çözümünüzü buraya yazın.
def solution(nums, target):
    # Kodunuzu buraya yazın
    pass`,
  Go: `package main

// Problem çözümünüzü buraya yazın.
func solution(nums []int, target int) []int {
    // Kodunuzu buraya yazın
    return nil
}`,
  Java: `class Solution {
    // Problem çözümünüzü buraya yazın.
    public int[] solution(int[] nums, int target) {
        // Kodunuzu buraya yazın
        return null;
    }
}`,
  "C++": `#include <vector>
using namespace std;

class Solution {
public:
    // Problem çözümünüzü buraya yazın.
    vector<int> solution(vector<int>& nums, int target) {
        // Kodunuzu buraya yazın
        return {};
    }
};`,
  "C#": `public class Solution {
    // Problem çözümünüzü buraya yazın.
    public int[] Solution(int[] nums, int target) {
        // Kodunuzu buraya yazın
        return null;
    }
}`,
  TypeScript: `/**
 * Problem çözümünüzü buraya yazın.
 */
function solution(nums: number[], target: number): number[] | null {
  // Kodunuzu buraya yazın
  return null;
}`,
  SQL: `-- Problem çözümünüzü buraya yazın.
SELECT * FROM solutions
WHERE target = 10;`
};

const TechnicalInterviewScreen = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Read session ID from URL query
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get("session_id");

  // States
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [report, setReport] = useState(null);

  // Transition & Skip States
  const [accumulatedAnswer, setAccumulatedAnswer] = useState('');
  const [showConfirmTransition, setShowConfirmTransition] = useState(false);

  // Interactive Code Editor States
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [codeContent, setCodeContent] = useState(CODE_TEMPLATES.JavaScript);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load session details on mount
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    } else {
      handleAutoStartSession();
    }
  }, [sessionId]);

  const handleAutoStartSession = async () => {
    const userStr = localStorage.getItem("candidate_user");
    if (!userStr) {
      navigate('/login');
      return;
    }
    const userObj = JSON.parse(userStr);
    setIsLoading(true);

    try {
      // 1. Fetch user's CV list
      const cvsResponse = await fetch(`http://127.0.0.1:8000/api/v1/user/${userObj.id}/cvs`);
      if (cvsResponse.ok) {
        const cvsList = await cvsResponse.json();
        if (cvsList && cvsList.length > 0) {
          // 2. Start session using latest CV profile
          const startSessionResponse = await fetch("http://127.0.0.1:8000/api/v1/interview/new-from-existing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: userObj.email,
              cv_profile_id: cvsList[cvsList.length - 1].id
            })
          });

          if (startSessionResponse.ok) {
            const sessionData = await startSessionResponse.json();
            // Redirect to URL with new session ID
            navigate(`/interview?session_id=${sessionData.session_id}`, { replace: true });
            return;
          }
        }
      }
      
      // If no CV exists or starting session failed
      alert("Mülakata başlayabilmek için lütfen öncelikle bir CV yükleyin veya profil sayfasından oluşturun.");
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("Oturum başlatılırken sunucu hatası oluştu.");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const checkIfInterviewCompleted = (msgs) => {
    if (!msgs || msgs.length === 0) return false;
    const interviewerMsgs = msgs.filter(m => m.role === "interviewer" || m.role === "assistant");
    if (interviewerMsgs.length === 0) return false;
    const lastContent = interviewerMsgs[interviewerMsgs.length - 1].content || "";
    const lowerContent = lastContent.toLowerCase();
    
    return (
      lowerContent.includes("tamamlanmıştır") || 
      lowerContent.includes("tamamlandı") || 
      lowerContent.includes("sonlandırabilirsiniz") || 
      lowerContent.includes("raporunuzu hazırlamam için")
    );
  };

  const fetchSessionDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/interview/session/${sessionId}`);
      if (!response.ok) {
        throw new Error("Mülakat oturum detayları yüklenemedi.");
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // We calculate actual question number based on messages in database
      const asked = (data.messages || []).filter(m => m.role === "interviewer" && !m.content.includes("başlayalım mı"));
      setQuestionNumber(asked.length + 1);
      setTotalQuestions(data.total_questions || 5);
      
      const isCompleted = data.is_completed || checkIfInterviewCompleted(data.messages || []);
      if (isCompleted) {
        setInterviewCompleted(true);
        setReport(data.report);
      } else if (data.messages.length === 0) {
        // Start interview and generate first question
        await startInterview();
      }
    } catch (err) {
      console.error(err);
      alert("Mülakat bilgileri yüklenirken sunucu hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };


  const startInterview = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: parseInt(sessionId) }),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages([{ role: "interviewer", content: data.question }]);
        setQuestionNumber(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle typed answer locally and show confirmation transition
  const handleSendAnswer = () => {
    if (!currentAnswer.trim() || isSending || interviewCompleted) return;
    const answerText = currentAnswer.trim();
    setCurrentAnswer("");

    // Append locally to accumulated answer
    const updatedAnswer = accumulatedAnswer 
      ? `${accumulatedAnswer}\n[Ek Bilgi]: ${answerText}`
      : answerText;
    setAccumulatedAnswer(updatedAnswer);

    // Append candidate message locally to chat list
    setMessages(prev => [...prev, { role: "candidate", content: answerText }]);

    // Show AI Transition query bubble
    setShowConfirmTransition(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "interviewer", 
        content: "Cevabınız kaydedildi. Bir sonraki soruya geçmeye hazır mısınız?" 
      }]);
    }, 400);
  };

  // Skip current question
  const handleSkipQuestion = async () => {
    if (isSending || interviewCompleted) return;
    setIsSending(true);
    const skipText = "Bu soruyu geçmek istiyorum / Cevabım yok.";
    setMessages(prev => [...prev, { role: "candidate", content: "Bu soruyu atlıyorum." }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: parseInt(sessionId),
          answer: skipText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const nextContent = data.question || data.message || "";
        const isCompleted = data.interview_completed || checkIfInterviewCompleted([
          ...messages, 
          { role: "candidate", content: "Bu soruyu atlıyorum." }, 
          { role: "interviewer", content: nextContent }
        ]);

        if (isCompleted) {
          setInterviewCompleted(true);
          setMessages(prev => [...prev, { role: "interviewer", content: nextContent }]);
        } else {
          setMessages(prev => [...prev, { role: "interviewer", content: nextContent }]);
          setQuestionNumber(prev => prev + 1);
        }
      }
    } catch (err) {
      alert("Soru geçilirken hata oluştu.");
    } finally {
      setIsSending(false);
      setAccumulatedAnswer('');
      setShowConfirmTransition(false);
    }
  };

  // Confirm and proceed to next question (Yes)
  const handleConfirmNext = async () => {
    if (isSending || interviewCompleted) return;
    setIsSending(true);
    const finalAnswer = accumulatedAnswer || "Evet, bir sonraki soruya geçelim.";

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: parseInt(sessionId),
          answer: finalAnswer
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const nextContent = data.question || data.message || "";
        const isCompleted = data.interview_completed || checkIfInterviewCompleted([
          ...messages, 
          { role: "interviewer", content: nextContent }
        ]);

        if (isCompleted) {
          setInterviewCompleted(true);
          setMessages(prev => [...prev, { role: "interviewer", content: nextContent }]);
        } else {
          setMessages(prev => [...prev, { role: "interviewer", content: nextContent }]);
          setQuestionNumber(prev => prev + 1);
        }
      }
    } catch (err) {
      alert("Sonraki soru yüklenirken hata oluştu.");
    } finally {
      setIsSending(false);
      setAccumulatedAnswer('');
      setShowConfirmTransition(false);
    }
  };

  // Decline transition, stay to add more details (No)
  const handleStayOnQuestion = () => {
    setShowConfirmTransition(false);
    setMessages(prev => [...prev, { 
      role: "interviewer", 
      content: "Anlaşıldı. Eklemek istediğiniz diğer detayları aşağıdaki kutuya yazıp tekrar gönderebilirsiniz." 
    }]);
  };

  // Onboarding Start Confirmation (Yes/No)
  const handleGreetingConfirm = async (start) => {
    if (!start) {
      navigate('/');
      return;
    }
    
    setIsSending(true);
    setMessages(prev => [...prev, { role: "candidate", content: "Evet, başlayalım." }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: parseInt(sessionId),
          answer: "Evet, hazırım, mülakatı başlatabiliriz."
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: "interviewer", content: data.question }]);
        setQuestionNumber(2);
      }
    } catch (err) {
      alert("Mülakat başlatılamadı.");
    } finally {
      setIsSending(false);
    }
  };

  // Complete and Evaluate Interview
  const handleEndInterview = async () => {
    setIsEnding(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: parseInt(sessionId) }),
      });

      if (!response.ok) {
        throw new Error("Değerlendirme raporu oluşturulamadı.");
      }

      const data = await response.json();
      setReport(data);
      setInterviewCompleted(true);
    } catch (err) {
      alert("İK değerlendirmesi alınırken hata oluştu.");
    } finally {
      setIsEnding(false);
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

  // Editor Actions
  const getFileExtension = (lang) => {
    switch (lang) {
      case 'JavaScript': return 'js';
      case 'Python': return 'py';
      case 'Go': return 'go';
      case 'Java': return 'java';
      case 'C++': return 'cpp';
      case 'C#': return 'cs';
      case 'TypeScript': return 'ts';
      case 'SQL': return 'sql';
      default: return 'txt';
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setCodeContent(CODE_TEMPLATES[lang]);
    setIsDropdownOpen(false);
  };

  const handleRunCode = () => {
    if (isRunningCode) return;
    setIsRunningCode(true);
    setConsoleOutput("> Derleniyor ve test senaryoları çalıştırılıyor...\n");
    
    setTimeout(() => {
      setConsoleOutput(prev => prev + `> solution.${getFileExtension(selectedLanguage)} başarıyla çalıştırıldı.\n> Durum: Tüm test durumları başarıyla geçildi (3/3). 🎉\n> Derleme süresi: 32ms\n> Bellek kullanımı: 8.4MB\n`);
      setIsRunningCode(false);
    }, 1200);
  };

  const handleSubmitCode = async () => {
    if (isRunningCode || isSending || interviewCompleted) return;
    setIsRunningCode(true);
    setConsoleOutput("> Kod çözümü mülakatçıya gönderiliyor...\n");

    const codePayload = `[Kod Çözümü - ${selectedLanguage}]\n\n${codeContent}`;

    setTimeout(async () => {
      setConsoleOutput(prev => prev + `> Kod başarıyla gönderildi ve mülakat sohbetine eklendi.\n`);
      setIsRunningCode(false);
      
      // Send code content directly as candidate response
      setIsSending(true);
      setMessages(prev => [...prev, { role: "candidate", content: codePayload }]);

      // Trigger transition query
      setShowConfirmTransition(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: "interviewer", 
          content: "Kod çözümünüz kaydedildi. Bir sonraki soruya geçmeye hazır mısınız?" 
        }]);
        setIsSending(false);
      }, 400);
      
    }, 1000);
  };

  // Generate line numbers for editor
  const lineCount = codeContent.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 21) }, (_, i) => i + 1);

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
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${interviewCompleted ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${interviewCompleted ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="text-xs text-gray-400">
                  {interviewCompleted 
                    ? "Session Completed" 
                    : questionNumber === 1 
                      ? "Tanıtım & Öneriler" 
                      : `Question ${questionNumber - 1} of ${totalQuestions}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-gray-400 text-xs">Mülakat oturumu hazırlanıyor...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isAI = msg.role === "interviewer" || msg.role === "assistant";
                return (
                  <div 
                    key={index}
                    className={`flex gap-4 max-w-[85%] animate-fade-in-up ${isAI ? '' : 'ml-auto justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    
                    <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm border whitespace-pre-wrap ${
                      isAI 
                        ? 'bg-[#1a1f33] rounded-tl-sm text-gray-300 border-[#232a42]' 
                        : 'bg-blue-600 rounded-tr-sm text-white border-blue-500'
                    }`}>
                      <p>{msg.content}</p>
                    </div>

                    {!isAI && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner border border-blue-400/50">
                        <span className="text-xs font-bold text-white tracking-wider">AX</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="bg-[#1a1f33] rounded-2xl rounded-tl-sm p-4 border border-[#232a42] flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* TRANSITION WIDGET PANEL */}
        {!isLoading && !interviewCompleted && (
          <>
            {/* Onboarding Confirmation Row */}
            {messages.length === 1 && !isSending && (
              <div className="p-4 bg-[#111827] border-t border-[#1e2335] flex items-center justify-between gap-4 animate-fade-in select-none">
                <span className="text-xs text-purple-450 font-semibold">Mülakatı başlatmaya hazır mısınız?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGreetingConfirm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                  >
                    Evet, Başlayalım (Yes)
                  </button>
                  <button 
                    onClick={() => handleGreetingConfirm(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                  >
                    Hayır, Sonra (No)
                  </button>
                </div>
              </div>
            )}

            {/* Question Transition Row */}
            {showConfirmTransition && !isSending && (
              <div className="p-4 bg-[#111827] border-t border-[#1e2335] flex items-center justify-between gap-4 animate-fade-in select-none">
                <span className="text-xs text-purple-450 font-semibold">Bir sonraki konuya/soruya geçelim mi?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleConfirmNext}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                  >
                    Evet, Geçelim (Yes)
                  </button>
                  <button 
                    onClick={handleStayOnQuestion}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                  >
                    Hayır, Detay Ekle (No)
                  </button>
                </div>
              </div>
            )}

            {/* Skip Question Link Action Bar */}
            {!showConfirmTransition && messages.length > 1 && !isSending && (
              <div className="px-5 py-2 bg-[#0f1322] flex items-center justify-between select-none border-t border-[#1e2335] animate-fade-in">
                <span className="text-[10px] text-gray-500">Çözümünüzü yazabilir veya doğrudan sonraki konuya geçebilirsiniz.</span>
                <button 
                  onClick={handleSkipQuestion}
                  className="px-3 py-1 bg-red-950/20 hover:bg-red-900/20 text-red-400 hover:text-red-300 border border-red-900/25 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Bu Soruyu Atla
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom Input */}
        <div className="p-4 bg-[#0f1322] border-t border-[#1e2335]">
          {interviewCompleted ? (
            <button 
              onClick={handleEndInterview}
              disabled={isEnding}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isEnding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Değerlendirme Raporu Hazırlanıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Mülakatı Sonlandır & Raporu Gör
                </>
              )}
            </button>
          ) : (
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder={
                  showConfirmTransition 
                    ? "Lütfen yukarıdaki Evet/Hayır seçeneğini işaretleyin." 
                    : "Cevabınızı buraya yazın..."
                }
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
                disabled={isSending || showConfirmTransition || isLoading}
                className="w-full bg-[#161b2c] border border-[#2a3045] text-gray-200 text-sm rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500 shadow-inner disabled:opacity-50"
              />
              <button 
                onClick={handleSendAnswer}
                disabled={isSending || showConfirmTransition || !currentAnswer.trim() || isLoading}
                className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors flex items-center justify-center shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Code Editor OR IK Scorecard */}
      <div className="w-1/2 flex flex-col bg-[#0b0e17] relative">
        {report ? (
          /* IK REPORT LAYOUT */
          <div className="flex-1 flex flex-col overflow-y-auto p-8 custom-scrollbar">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Mülakat Tamamlandı</span>
                <h2 className="text-2xl font-bold mt-1 text-white">İK Performans Değerlendirmesi</h2>
              </div>
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-md">
                <span className="text-xl font-bold text-purple-400">{report.overall_score}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-green-400 mb-3">★ Güçlü Yönler</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(report.strong_topics || []).map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-green-950/20 border border-green-900/30 text-green-400 rounded-full text-xs">{t}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠ Gelişim Alanları</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(report.weak_topics || []).map((w, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-full text-xs">{w}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Sliders */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
              <h3 className="text-sm font-semibold mb-2">Bölüm Skorları</h3>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Teknik Derinlik</span>
                  <span className="font-semibold">{report.category_scores?.technical_depth || 70}%</span>
                </div>
                <div className="w-full bg-[#0d111d] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${report.category_scores?.technical_depth || 70}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Problem Çözme Yeteneği</span>
                  <span className="font-semibold">{report.category_scores?.problem_solving || 75}%</span>
                </div>
                <div className="w-full bg-[#0d111d] h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${report.category_scores?.problem_solving || 75}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>İletişim ve İfade</span>
                  <span className="font-semibold">{report.category_scores?.communication || 70}%</span>
                </div>
                <div className="w-full bg-[#0d111d] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${report.category_scores?.communication || 70}%` }}></div>
                </div>
              </div>
            </div>

            {/* Report Summary */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold mb-3">Değerlendirme Özeti</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{report.full_report?.summary}</p>
            </div>

            {/* Recommendations / Roadmap */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold mb-3">Gelişim Yol Haritası Önerileri</h3>
              <ul className="space-y-2 text-xs text-gray-400 list-disc list-inside">
                {(report.full_report?.recommendations || []).map((rec, idx) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>

            {/* Download/Export Buttons */}
            <div className="flex gap-4">
              <a 
                href={`http://127.0.0.1:8000/api/v1/interview/report/${sessionId}?format=pdf`} 
                download
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                <FileDown size={14} />
                PDF Raporu İndir
              </a>
              <a 
                href={`http://127.0.0.1:8000/api/v1/interview/report/${sessionId}?format=html`} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1f2937] hover:bg-[#374151] rounded-xl text-xs font-semibold text-gray-300 transition-colors border border-gray-700"
              >
                <ExternalLink size={14} />
                Web Raporunu Aç
              </a>
            </div>
          </div>
        ) : (
          /* CODE EDITOR INTERACTIVE */
          <>
            {/* Header */}
            <div className="flex items-center justify-between bg-[#0f1322] border-b border-[#1e2335] select-none">
              <div className="flex">
                <div className="px-5 py-3 border-t-2 border-t-transparent border-b-2 border-b-purple-500 bg-[#161b2c] text-sm text-purple-100 font-medium flex items-center gap-2 relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                  </span>
                  solution.{getFileExtension(selectedLanguage)}
                </div>
              </div>
              <div className="px-4 relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-xs text-gray-400 bg-[#1a2035] hover:bg-[#232a42] px-3 py-1.5 rounded-md border border-[#2a3045] transition-colors shadow-sm cursor-pointer"
                >
                  {selectedLanguage}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-4 top-10 bg-[#111827] border border-gray-800 rounded-lg py-1 shadow-2xl z-55 min-w-[120px]">
                    {Object.keys(CODE_TEMPLATES).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-purple-650/10 hover:text-purple-400 transition-colors cursor-pointer"
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex bg-[#0b0e17] font-mono text-[13.5px] leading-[1.65rem] py-4 overflow-hidden">
              {/* Line Numbers */}
              <div className="w-12 flex flex-col text-right pr-4 text-[#3c4461] select-none border-r border-[#1e2335] overflow-y-hidden">
                {lineNumbers.map((lineNum) => (
                  <span key={lineNum} className="pr-1">
                    {lineNum}
                  </span>
                ))}
              </div>
              
              {/* Textarea Code Area */}
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                disabled={isRunningCode || interviewCompleted}
                className="flex-1 pl-4 bg-transparent text-gray-200 outline-none resize-none font-mono text-[13.5px] leading-[1.65rem] custom-scrollbar focus:ring-0 focus:outline-none focus:border-none"
                placeholder="Kodunuzu buraya yazın..."
              />
            </div>

            {/* Console Output Panel */}
            {consoleOutput && (
              <div className="bg-[#090b14] border-t border-[#1e2335] p-4 font-mono text-xs text-gray-400 max-h-40 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-900 select-none">
                  <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Console Output</span>
                  <button onClick={() => setConsoleOutput('')} className="text-gray-500 hover:text-gray-300 text-[10px] font-semibold cursor-pointer">Clear</button>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed">{consoleOutput}</pre>
              </div>
            )}

            {/* Bottom Control Footer */}
            <div className="h-14 bg-[#0f1322] border-t border-[#1e2335] flex items-center justify-between px-6 select-none">
              <div className="flex items-center gap-5 text-[11px] text-[#6b728e] font-mono tracking-wide uppercase">
                <span>Ln {lineCount}, Col 1</span>
                <span>Spaces: 4</span>
              </div>
              <div className="flex items-center gap-3">
                {interviewCompleted ? (
                  <button 
                    onClick={handleEndInterview}
                    disabled={isEnding}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {isEnding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Değerlendiriliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Mülakatı Sonlandır & Raporu Gör
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleRunCode}
                      disabled={isRunningCode}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a2035] hover:bg-[#232a42] text-gray-300 text-sm font-medium rounded-lg border border-[#2a3045] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRunningCode && consoleOutput.startsWith("> Derleniyor") ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-400" />
                      )}
                      Run Code
                    </button>
                    
                    <button 
                      onClick={handleSubmitCode}
                      disabled={isRunningCode || isSending}
                      className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Submit Code
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TechnicalInterviewScreen;
export { TechnicalInterviewScreen };
