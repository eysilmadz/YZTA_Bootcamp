import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const EvaluationScreen = () => {
  return (
    <div className="flex-1 bg-[#0b0f19] text-gray-200 font-sans p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-5 mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-md text-xs font-medium border border-emerald-800/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Completed
                </span>
                <span className="text-sm text-gray-400">Senior Frontend Engineer · Today, 14:32</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Performance Evaluation</h1>
            </div>

            {/* Export & Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition-all">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19]">
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
            </div>
          </div>
        </div>

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
                  <circle className="text-blue-500 stroke-current" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="55.264"></circle> {/* 78% */}
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">78</span>
                  <span className="text-xs text-gray-500 mt-1">out of 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-md text-xs font-semibold border border-blue-800/50 mb-3">
                  Strong Hire Signal
                </div>
                <h2 className="text-xl font-bold text-white mb-2">You performed above average</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  Your problem-solving and communication were standout. Focus on edge cases and system design to reach the next tier.
                </p>
                
                {/* Quick Metrics */}
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-lg font-bold text-emerald-400">Top 22%</div>
                    <div className="text-xs text-gray-500">Percentile</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">6/6</div>
                    <div className="text-xs text-gray-500">Questions answered</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">14:32</div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Breakdown Card */}
            <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-8 shadow-xl shadow-black/20">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Skill Breakdown</h3>
                <p className="text-sm text-gray-400">Scored across six competency areas</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Left Side Skills */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">Problem Solving</span>
                      <span className="text-sm font-bold text-gray-100">84</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">Communication</span>
                      <span className="text-sm font-bold text-gray-100">88</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">Edge Case Handling</span>
                      <span className="text-sm font-bold text-gray-100">61</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '61%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Right Side Skills */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">Code Quality</span>
                      <span className="text-sm font-bold text-gray-100">79</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '79%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">Time Complexity Analysis</span>
                      <span className="text-sm font-bold text-gray-100">72</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-300">System Design</span>
                      <span className="text-sm font-bold text-gray-100">66</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '66%' }}></div>
                    </div>
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
                  <h3 className="font-semibold text-white">Key Strengths</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                    <span>Clear articulation of the hash-map approach before coding</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                    <span>Optimal O(n) time complexity on the core challenge</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                    <span>Readable, well-named variables and clean structure</span>
                  </li>
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-1.5 bg-amber-900/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-white">Areas to Improve</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500/80 mt-0.5 flex-shrink-0"></div>
                    <span>Missed a duplicate-value edge case in the initial pass</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500/80 mt-0.5 flex-shrink-0"></div>
                    <span>Hesitation when discussing space/time trade-offs</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500/80 mt-0.5 flex-shrink-0"></div>
                    <span>System design answer lacked scalability considerations</span>
                  </li>
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
                  <h2 className="text-lg font-bold text-white">AI Study Roadmap</h2>
                  <p className="text-sm text-gray-400">Personalized from your performance</p>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {/* Roadmap Item 1 */}
                <div className="p-4 bg-[#0d111d] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-900/40 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-800/50">1</div>
                      <h4 className="font-semibold text-gray-200">Master edge-case driven testing</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-800/50">Priority</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-9">
                    Practice writing test cases before implementation. Focus on duplicates, empty inputs, and overflow.
                  </p>
                </div>

                {/* Roadmap Item 2 */}
                <div className="p-4 bg-[#0d111d] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">2</div>
                      <h4 className="font-semibold text-gray-200 text-sm">Deep dive: Big-O trade-offs</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">This week</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-9">
                    Review time vs. space trade-offs across common data structures with hands-on drills.
                  </p>
                </div>

                {/* Roadmap Item 3 */}
                <div className="p-4 bg-[#0d111d] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">3</div>
                      <h4 className="font-semibold text-gray-200 text-sm">System design fundamentals</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Next up</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-9">
                    Study horizontal scaling, caching layers, and load balancing with 3 mock designs.
                  </p>
                </div>
              </div>

              {/* Bottom Action Button */}
              <button className="mt-6 w-full py-3 bg-[#0d111d] hover:bg-[#1a2035] text-blue-400 text-sm font-medium rounded-xl border border-gray-800/50 transition-all flex items-center justify-center gap-2 group">
                Generate full study plan
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EvaluationScreen;
