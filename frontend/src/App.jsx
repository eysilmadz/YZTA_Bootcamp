import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slateBg flex items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-6 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electricPurple to-neonBlue">
          AI-Hire Coach
        </h1>
        <p className="text-gray-400 text-lg">
          Frontend proje iskeleti, Tailwind CSS ve Redux Toolkit ile başarıyla kuruldu.
        </p>
        <div className="flex justify-center gap-4 text-sm font-medium">
          <span className="px-4 py-2 rounded-full bg-electricPurple/20 text-electricPurple border border-electricPurple/30">
            React & Vite
          </span>
          <span className="px-4 py-2 rounded-full bg-neonBlue/20 text-neonBlue border border-neonBlue/30">
            Tailwind CSS
          </span>
          <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Redux Toolkit
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
