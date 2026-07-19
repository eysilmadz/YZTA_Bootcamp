import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BarChart, Bell } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  return (
    <div className={`bg-[#0b0f19] text-white font-sans selection:bg-blue-500/30 ${location.pathname === '/interview' ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'}`}>
      {/* Navbar */}
      <nav className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<span class="font-bold text-lg">A</span>'; }} />
            </div>
            <span className="font-bold text-lg tracking-wide">AI-Hire Coach</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === '/' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <Link 
              to="/interview"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === '/interview' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <MessageSquare size={16} />
              Live Interview
            </Link>
            <Link 
              to="/evaluation"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === '/evaluation' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <BarChart size={16} />
              Evaluation
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white text-sm font-medium transition-all duration-200">
            Pro Plan
          </button>
          <button className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all duration-200">
            <Bell size={20} />
          </button>
          {(() => {
            const userStr = localStorage.getItem("candidate_user");
            const user = userStr ? JSON.parse(userStr) : null;
            const initials = user && user.name 
              ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
              : 'AX';
            const profilePic = user ? user.profile_picture : null;
            
            return (
              <Link 
                to="/profile" 
                className="w-9 h-9 rounded-full bg-purple-600 text-white font-semibold text-sm flex items-center justify-center hover:ring-2 hover:ring-purple-500/50 transition-all duration-200 overflow-hidden"
              >
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </Link>
            );
          })()}
        </div>

      </nav>

      {/* Main Content Area */}
      <Outlet />
    </div>
  );
};

export default Layout;
