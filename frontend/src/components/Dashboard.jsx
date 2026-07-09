import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart, 
  Bell, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  Wand2, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {/* Logo placeholder - using div to match size if img fails, but using img tag as requested */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<span class="font-bold text-lg">A</span>'; }} />
            </div>
            <span className="font-bold text-lg tracking-wide">AI-Hire Coach</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-full text-sm font-medium transition-all duration-200">
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full text-sm font-medium transition-all duration-200">
              <MessageSquare size={16} />
              Live Interview
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full text-sm font-medium transition-all duration-200">
              <BarChart size={16} />
              Evaluation
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white text-sm font-medium transition-all duration-200">
            Pro Plan
          </button>
          <button className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all duration-200">
            <Bell size={20} />
          </button>
          <button className="w-9 h-9 rounded-full bg-teal-500 text-white font-semibold text-sm flex items-center justify-center hover:ring-2 hover:ring-teal-500/50 transition-all duration-200">
            AD
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-400 text-xs font-medium mb-4">
            <Sparkles size={14} />
            AI Interview Simulator
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, Alex</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Upload your CV to launch a tailored technical interview, then review your performance and study roadmap.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload CV Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold mb-1">Upload your CV</h2>
              <p className="text-gray-400 text-sm mb-6">We analyze your resume to personalize interview questions.</p>
              
              <div 
                className="border-2 border-dashed border-gray-700 hover:border-blue-500/50 bg-[#0b0f19]/50 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
                onClick={handleUpload}
              >
                <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <UploadCloud size={24} />
                </div>
                <h3 className="font-medium mb-1 group-hover:text-blue-400 transition-colors duration-200">
                  {isUploading ? "Uploading..." : "Drag & drop your CV here"}
                </h3>
                <p className="text-gray-500 text-sm mb-6">PDF up to 10MB. We'll extract your tech stack automatically.</p>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all duration-200">
                  <FileText size={16} className="text-gray-400" />
                  Browse files
                </button>
              </div>

              <div className="flex items-center justify-between mt-6">
                <p className="text-gray-500 text-xs">Your data is processed securely and never shared.</p>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  <Wand2 size={16} className={isAnalyzing ? "animate-spin" : ""} />
                  {isAnalyzing ? "Analyzing..." : "Analyze CV"}
                </button>
              </div>
            </div>

            {/* Extracted Tech Stack Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Extracted Tech Stack</h2>
                  <p className="text-gray-400 text-sm">Detected from your CV · 8 technologies</p>
                </div>
                <div className="px-2 py-1 bg-green-900/20 border border-green-800/30 text-green-400 rounded text-xs font-medium">
                  Parsed
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { name: "TypeScript", level: "Expert" },
                  { name: "React", level: "Expert" },
                  { name: "Node.js", level: "Advanced" },
                  { name: "PostgreSQL", level: "Advanced" },
                  { name: "Python", level: "Intermediate" },
                  { name: "GraphQL", level: "Intermediate" },
                  { name: "Docker", level: "Intermediate" },
                  { name: "AWS", level: "Beginner" },
                ].map((tech) => (
                  <div key={tech.name} className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-gray-800 rounded-full text-sm hover:border-gray-600 transition-colors duration-200 cursor-default">
                    <span className="font-medium text-gray-200">{tech.name}</span>
                    <span className="text-gray-500 text-xs">{tech.level}</span>
                  </div>
                ))}
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
                  <span className="text-green-400 text-xs font-medium flex items-center gap-0.5">
                    <TrendingUp size={12} /> +6
                  </span>
                </div>
                <div>
                  <div className="text-xl font-bold mb-0.5">78<span className="text-gray-500 text-sm font-medium">/100</span></div>
                  <div className="text-gray-400 text-xs">Avg. Score</div>
                </div>
              </div>

              <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-900/20 flex items-center justify-center text-indigo-400">
                    <Target size={16} />
                  </div>
                  <span className="text-green-400 text-xs font-medium flex items-center gap-0.5">
                    <TrendingUp size={12} /> +3
                  </span>
                </div>
                <div>
                  <div className="text-xl font-bold mb-0.5">12</div>
                  <div className="text-gray-400 text-xs">Interviews</div>
                </div>
              </div>

              <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400">
                    <Clock size={16} />
                  </div>
                  <span className="text-cyan-400 text-xs font-medium flex items-center gap-0.5">
                    <TrendingUp size={12} /> +1.2h
                  </span>
                </div>
                <div>
                  <div className="text-xl font-bold mb-0.5">9.4h</div>
                  <div className="text-gray-400 text-xs">Practice Time</div>
                </div>
              </div>
            </div>

            {/* Recent Performances Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 transition-all duration-200 hover:border-gray-700/60 shadow-xl shadow-black/20 flex flex-col h-[calc(100%-116px)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold">Recent Performances</h2>
                <button className="text-blue-500 hover:text-blue-400 text-xs font-medium flex items-center gap-1 transition-colors duration-200">
                  View all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {[
                  { score: 82, role: "Senior Frontend Engineer", detail: "Simulated · React + TS · 2 days ago", status: "Strong", statusColor: "green", scoreColor: "green" },
                  { score: 74, role: "Full-Stack Engineer", detail: "Simulated · Node + SQL · 5 days ago", status: "Good", statusColor: "blue", scoreColor: "amber" },
                  { score: 68, role: "Backend Engineer", detail: "Simulated · System Design · 1 week ago", status: "Fair", statusColor: "amber", scoreColor: "red" },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between group cursor-pointer ${idx !== 2 ? 'pb-4 border-b border-gray-800/60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm
                        ${item.scoreColor === 'green' ? 'bg-green-900/20 text-green-500 border border-green-900/50' : 
                          item.scoreColor === 'amber' ? 'bg-amber-900/20 text-amber-500 border border-amber-900/50' : 
                          'bg-red-900/20 text-red-500 border border-red-900/50'}`}
                      >
                        {item.score}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-gray-200 group-hover:text-blue-400 transition-colors duration-200">{item.role}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium
                        ${item.statusColor === 'green' ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 
                          item.statusColor === 'blue' ? 'bg-blue-900/20 text-blue-400 border border-blue-900/30' : 
                          'bg-amber-900/20 text-amber-400 border border-amber-900/30'}`}
                      >
                        {item.status}
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-300 transition-colors duration-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
