import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Play, CheckCircle, ChevronDown, Terminal, ArrowLeft } from 'lucide-react';

const TechnicalInterviewScreen = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    const isConfirmed = window.confirm("Mülakatı yarıda kesmek istediğinize emin misiniz? İlerlemeniz kaydedilmeyebilir.");
    if (isConfirmed) {
      navigate('/');
    }
  };

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
                <span className="text-xs text-gray-400">Listening - Live session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* AI Message */}
          <div className="flex gap-4 max-w-[85%] animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-[#1a1f33] rounded-2xl rounded-tl-sm p-4 text-sm text-gray-300 leading-relaxed shadow-sm border border-[#232a42]">
              <p>Welcome to your technical interview! Today we'll be evaluating your problem-solving skills and coding proficiency.</p>
              <p className="mt-2">Let's start with a classic algorithmic challenge.</p>
              
              <div className="mt-4 p-3 bg-[#0d111d] rounded-lg border border-[#2a3045] flex items-center gap-3 shadow-inner">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-medium text-xs tracking-wide uppercase">Coding Challenge - Two Sum</span>
              </div>
            </div>
          </div>

          {/* User Message */}
          <div className="flex gap-4 max-w-[85%] ml-auto justify-end animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-blue-600 rounded-2xl rounded-tr-sm p-4 text-sm text-white leading-relaxed shadow-md border border-blue-500">
              <p>Thanks! I'm ready. I'll use a Hash Map to solve this in O(n) time complexity.</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner border border-blue-400/50">
              <span className="text-xs font-bold text-white tracking-wider">AD</span>
            </div>
          </div>
          
           {/* AI Message */}
          <div className="flex gap-4 max-w-[85%] animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-[#1a1f33] rounded-2xl rounded-tl-sm p-4 text-sm text-gray-300 leading-relaxed shadow-sm border border-[#232a42]">
              <p>Excellent approach. Using a Hash Map will allow us to find the complement in constant time. Go ahead and implement your solution in the editor on the right.</p>
            </div>
          </div>
        </div>

        {/* Bottom Input */}
        <div className="p-4 bg-[#0f1322] border-t border-[#1e2335]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Type your answer to the interviewer..." 
              className="w-full bg-[#161b2c] border border-[#2a3045] text-gray-200 text-sm rounded-full py-3 pl-5 pr-12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500 shadow-inner"
            />
            <button className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Code Editor */}
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
<span className="text-[#6b728e] italic"> * Finds two indices that add up to the target.</span>
<span className="text-[#6b728e] italic"> * @param &#123;number[]&#125; nums</span>
<span className="text-[#6b728e] italic"> * @param &#123;number&#125; target</span>
<span className="text-[#6b728e] italic"> * @return &#123;number[]&#125;</span>
<span className="text-[#6b728e] italic"> */</span>
<span className="text-purple-400">const</span> <span className="text-blue-400">twoSum</span> <span className="text-gray-400">=</span> (<span className="text-orange-300">nums</span>, <span className="text-orange-300">target</span>) <span className="text-purple-400">=&gt;</span> &#123;
  <span className="text-purple-400">const</span> <span className="text-gray-300">map</span> <span className="text-gray-400">=</span> <span className="text-purple-400">new</span> <span className="text-emerald-400">Map</span>();
<div className="bg-purple-500/10 -mx-4 px-4 border-l-2 border-purple-500/0">  <span className="text-purple-400">for</span> (<span className="text-purple-400">let</span> <span className="text-gray-300">i</span> <span className="text-gray-400">=</span> <span className="text-orange-400">0</span>; <span className="text-gray-300">i</span> <span className="text-gray-400">&lt;</span> <span className="text-gray-300">nums</span>.<span className="text-emerald-300">length</span>; <span className="text-gray-300">i</span><span className="text-gray-400">++</span>) &#123;</div><div className="bg-purple-500/10 -mx-4 px-4 border-l-2 border-purple-500/0">    <span className="text-purple-400">const</span> <span className="text-gray-300">complement</span> <span className="text-gray-400">=</span> <span className="text-gray-300">target</span> <span className="text-gray-400">-</span> <span className="text-gray-300">nums</span>[<span className="text-gray-300">i</span>];</div><div className="bg-purple-500/10 -mx-4 px-4 border-l-2 border-purple-500/0">    </div><div className="bg-purple-500/10 -mx-4 px-4 border-l-2 border-purple-500/0">    <span className="text-purple-400">if</span> (<span className="text-gray-300">map</span>.<span className="text-blue-300">has</span>(<span className="text-gray-300">complement</span>)) &#123;</div>      <span className="text-purple-400">return</span> [<span className="text-gray-300">map</span>.<span className="text-blue-300">get</span>(<span className="text-gray-300">complement</span>), <span className="text-gray-300">i</span>];
    &#125;
    
    <span className="text-gray-300">map</span>.<span className="text-blue-300">set</span>(<span className="text-gray-300">nums</span>[<span className="text-gray-300">i</span>], <span className="text-gray-300">i</span>);
  &#125;
  
  <span className="text-purple-400">return</span> []; <span className="text-[#6b728e] italic">// No solution found</span>
&#125;;
          </div>
        </div>

        {/* Bottom Control Footer */}
        <div className="h-14 bg-[#0f1322] border-t border-[#1e2335] flex items-center justify-between px-6">
          <div className="flex items-center gap-5 text-[11px] text-[#6b728e] font-mono tracking-wide uppercase">
            <span>Ln 21, Col 1</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2035] hover:bg-[#232a42] text-gray-300 text-sm font-medium rounded-lg border border-[#2a3045] transition-all focus:outline-none focus:ring-2 focus:ring-gray-600">
              <Play className="w-4 h-4 text-gray-400" />
              Run
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0f1322]">
              <CheckCircle className="w-4 h-4" />
              Submit Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterviewScreen;
