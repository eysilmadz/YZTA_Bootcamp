import React from 'react';
import { 
  Download, 
  RotateCcw, 
  Award, 
  ThumbsUp, 
  CheckCircle2, 
  AlertTriangle, 
  Circle, 
  BookOpen, 
  ArrowRight 
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
  return (
    <div className="min-h-full p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-sm mb-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 text-xs">
              <Award size={14} /> Completed
            </span>
            <span className="text-gray-400 text-xs font-medium">Senior Frontend Engineer · Today, 14:32</span>
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
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    strokeDasharray="264" 
                    strokeDashoffset={264 - (264 * 78) / 100} 
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white tracking-tight">78</span>
                  <span className="text-xs text-gray-400 font-medium mt-0.5">out of 100</span>
                </div>
              </div>
              
              {/* Score Details */}
              <div className="flex-1 space-y-4 pt-1">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
                    Strong Hire Signal
                  </span>
                  <h2 className="text-xl font-bold text-white mb-2">You performed above average</h2>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                    Your problem-solving and communication were standout. Focus on edge cases and system design to reach the next tier.
                  </p>
                </div>
                
                <div className="flex items-center gap-10 pt-5 border-t border-gray-800/60">
                  <div>
                    <div className="text-xl font-bold text-emerald-400">Top 22%</div>
                    <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Percentile</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">6/6</div>
                    <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Questions answered</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">14:32</div>
                    <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="bg-[#111827] rounded-2xl p-6 md:p-8 border border-gray-800/60 shadow-lg">
            <div className="mb-8">
              <h3 className="text-base font-semibold text-white">Skill Breakdown</h3>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">Scored across six competency areas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              <SkillBar title="Problem Solving" score={84} color="bg-emerald-500" />
              <SkillBar title="Code Quality" score={79} color="bg-blue-500" />
              <SkillBar title="Communication" score={88} color="bg-emerald-500" />
              <SkillBar title="Time Complexity Analysis" score={72} color="bg-blue-500" />
              <SkillBar title="Edge Case Handling" score={61} color="bg-red-500" />
              <SkillBar title="System Design" score={66} color="bg-red-500" />
            </div>
          </div>

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
              <ul className="space-y-4">
                {[
                  "Clear articulation of the hash-map approach before coding",
                  "Optimal O(n) time complexity on the core challenge",
                  "Readable, well-named variables and clean structure"
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300 items-start leading-relaxed">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300/90">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to Improve */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800/60 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Areas to Improve</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Missed a duplicate-value edge case in the initial pass",
                  "Hesitation when discussing space/time trade-offs",
                  "System design answer lacked scalability considerations"
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300 items-start leading-relaxed">
                    <Circle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300/90">{text}</span>
                  </li>
                ))}
              </ul>
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

            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="relative p-4 rounded-xl border border-gray-700/50 bg-gray-800/30">
                <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center border-[3px] border-[#111827]">
                  1
                </div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h4 className="text-sm font-semibold text-white leading-snug">Master edge-case driven testing</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium whitespace-nowrap">Priority</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    Practice writing test cases before implementation. Focus on duplicates, empty inputs, and overflow.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-4 rounded-xl border border-gray-800 bg-gray-800/10">
                <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-[11px] font-bold flex items-center justify-center border-[3px] border-[#111827]">
                  2
                </div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h4 className="text-sm font-semibold text-gray-200 leading-snug">Deep dive: Big-O trade-offs</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium whitespace-nowrap">This week</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">
                    Review time vs. space trade-offs across common data structures with hands-on drills.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-4 rounded-xl border border-gray-800 bg-gray-800/10">
                <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-[11px] font-bold flex items-center justify-center border-[3px] border-[#111827]">
                  3
                </div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h4 className="text-sm font-semibold text-gray-200 leading-snug">System design fundamentals</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium whitespace-nowrap">Next up</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">
                    Study horizontal scaling, caching layers, and load balancing with 3 mock designs.
                  </p>
                </div>
              </div>

            </div>

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
