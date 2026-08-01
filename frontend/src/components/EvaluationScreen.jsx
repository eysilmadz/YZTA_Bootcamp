import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Download, 
  RotateCcw, 
  Award, 
  ThumbsUp, 
  CheckCircle2, 
  AlertTriangle, 
  Circle, 
  BookOpen, 
  ArrowRight,
  Loader2
} from 'lucide-react';

const SkillBar = ({ title, score, color }) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <span className="text-sm font-medium text-gray-300">{title}</span>
      <span className="text-sm font-bold text-white">{score}</span>
    </div>
    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  </div>
);

const EvaluationScreen = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noSession, setNoSession] = useState(false);
  const [notCompleted, setNotCompleted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(sessionId);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const apiUrl = 'https://yzta-bootcamp-ttfy.onrender.com';
        let targetSessionId = sessionId;

        // If no sessionId in URL, try to get the latest one for the user
        if (!targetSessionId) {
          const userStr = localStorage.getItem("candidate_user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.email) {
              const profileRes = await fetch(`${apiUrl}/api/v1/user/profile?email=${user.email}`);
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                if (profileData.recent_performances && profileData.recent_performances.length > 0) {
                  targetSessionId = profileData.recent_performances[0].session_id;
                }
              }
            }
          }
        }

        // If still no targetSessionId, it means user has no past sessions
        if (!targetSessionId) {
          setNoSession(true);
          setLoading(false);
          return;
        }

        setActiveSessionId(targetSessionId);

        // Fetch the report for the targetSessionId
        const response = await fetch(`${apiUrl}/api/v1/interview/report/${targetSessionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setNotCompleted(true);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch evaluation report');
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Could not load the evaluation report. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-gray-400 font-medium text-sm">Analyzing interview performance...</p>
        </div>
      </div>
    );
  }

  if (notCompleted) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 py-24 space-y-4">
        <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-bold text-white text-center">Rapor Henüz Hazır Değil</h2>
        <p className="text-gray-400 text-sm text-center max-w-md">
          Bu mülakat henüz tamamlanmadığı için rapor oluşturulmamış. Lütfen mülakatı sonlandırın.
        </p>
        <Link 
          to="/"
          className="mt-6 px-6 py-2.5 bg-[#111827] border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (noSession) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 py-24 space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-full text-blue-400 mb-2">
          <BookOpen size={48} />
        </div>
        <h2 className="text-xl font-bold text-white text-center">Henüz tamamlanmış bir mülakatınız bulunmuyor.</h2>
        <p className="text-gray-400 text-sm text-center max-w-md">
          Mülakat pratiği yapmak ve performansınızı görmek için yeni bir canlı mülakat başlatabilirsiniz.
        </p>
        <Link 
          to="/"
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 py-24 space-y-4">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-white">Oops, something went wrong!</h2>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#111827] border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!report) return null;

  const overallScore = Math.round(report.overall_score || 0);
  const isStrongHire = overallScore >= 75;
  const hireSignalText = isStrongHire ? "Strong Hire Signal" : (overallScore >= 50 ? "Average Performance" : "Needs Improvement");
  const hireSignalColor = isStrongHire ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                          (overallScore >= 50 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-red-500/10 text-red-400 border-red-500/20");
  const chartStrokeColor = isStrongHire ? "#3b82f6" : (overallScore >= 50 ? "#eab308" : "#ef4444");

  const categoryScores = report.category_scores || {};
  const strongAreas = report.full_report?.strong_areas || [];
  const improvementAreas = report.full_report?.improvement_areas || [];
  const recommendations = report.full_report?.recommendations || [];

  return (
    <div className="min-h-full p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-sm mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 text-xs">
              <Award size={14} /> Completed
            </span>
            <span className="text-gray-400 text-xs font-medium">Session ID: {activeSessionId}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance Evaluation</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-300 bg-[#111827] border border-gray-700 hover:bg-gray-800 transition-colors">
            <Download size={16} />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <RotateCcw size={16} />
            Retake
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Metrics) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Metric Card */}
          <div className="bg-[#111827] rounded-2xl p-6 md:p-8 border border-gray-800/60 shadow-lg">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
              
              {/* Circular Score Chart */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="42" 
                    fill="none" 
                    stroke={chartStrokeColor} 
                    strokeWidth="8" 
                    strokeDasharray="264" 
                    strokeDashoffset={264 - (264 * overallScore) / 100} 
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white tracking-tight">{overallScore}</span>
                  <span className="text-xs text-gray-400 font-medium mt-0.5">out of 100</span>
                </div>
              </div>
              
              {/* Score Details */}
              <div className="flex-1 space-y-4 pt-1">
                <div>
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold mb-3 border ${hireSignalColor}`}>
                    {hireSignalText}
                  </span>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {isStrongHire ? "You performed above average" : (overallScore >= 50 ? "Solid effort with room to grow" : "Needs significant improvement")}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                    {report.full_report?.summary || "Your performance review summary will appear here once the evaluation is fully processed."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Breakdown */}
          {Object.keys(categoryScores).length > 0 && (
            <div className="bg-[#111827] rounded-2xl p-6 md:p-8 border border-gray-800/60 shadow-lg">
              <div className="mb-8">
                <h3 className="text-base font-semibold text-white">Skill Breakdown</h3>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Scored across key competency areas</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
                {Object.entries(categoryScores).map(([key, score]) => {
                  // e.g. "technical_depth" -> "Technical Depth"
                  const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  const color = score >= 80 ? "bg-emerald-500" : (score >= 65 ? "bg-blue-500" : "bg-red-500");
                  return <SkillBar key={key} title={title} score={score} color={color} />;
                })}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Key Strengths */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800/60 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <ThumbsUp size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Key Strengths</h3>
              </div>
              {strongAreas.length > 0 ? (
                <ul className="space-y-4">
                  {strongAreas.map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 items-start leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300/90">{text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific strengths recorded.</p>
              )}
            </div>

            {/* Areas to Improve */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800/60 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Areas to Improve</h3>
              </div>
              {improvementAreas.length > 0 ? (
                <ul className="space-y-4">
                  {improvementAreas.map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 items-start leading-relaxed">
                      <Circle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300/90">{text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific areas to improve recorded.</p>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-[#111827] rounded-2xl border border-gray-800/60 p-6 shadow-lg lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <BookOpen size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Study Roadmap</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6 font-medium">Personalized from your performance</p>

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, i) => {
                  const tagText = i === 0 ? "Priority" : (i === 1 ? "This week" : "Next up");
                  const tagClasses = i === 0 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-gray-800 text-gray-400";
                  
                  const stepClasses = i === 0 
                    ? "border-gray-700/50 bg-gray-800/30" 
                    : "border-gray-800 bg-gray-800/10";
                    
                  const badgeClasses = i === 0
                    ? "bg-blue-600 text-white border-[#111827]"
                    : "bg-gray-700 text-gray-300 border-[#111827]";
                    
                  const titleClasses = i === 0
                    ? "text-white"
                    : "text-gray-200";

                  // Extracting a short title from the recommendation text if it has a colon
                  let title = `Study Topic ${i + 1}`;
                  let desc = rec;
                  if (rec.includes(':')) {
                    const parts = rec.split(':');
                    title = parts[0];
                    desc = parts.slice(1).join(':').trim();
                  }

                  return (
                    <div key={i} className={`relative p-4 rounded-xl border ${stepClasses}`}>
                      <div className={`absolute -left-3 top-4 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border-[3px] ${badgeClasses}`}>
                        {i + 1}
                      </div>
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <h4 className={`text-sm font-semibold leading-snug ${titleClasses}`}>{title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${tagClasses}`}>
                            {tagText}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mt-2">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No recommendations available at this time.</p>
            )}

            <button className="w-full mt-6 py-3 rounded-xl bg-[#1d4ed8]/10 hover:bg-[#1d4ed8]/20 text-blue-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-blue-500/20">
              Generate full study plan <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default EvaluationScreen;
