import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Lütfen gerekli tüm alanları doldurun.");
      return;
    }
    if (!email.includes("@")) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setError('');
    setIsLoading(true);

    const url = isLogin 
      ? "http://127.0.0.1:8000/api/v1/auth/login" 
      : "http://127.0.0.1:8000/api/v1/auth/signup";

    const payload = isLogin
      ? { email, password }
      : { email, password, name: name || "Aday" };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Giriş/Kayıt işlemi başarısız.");
      }

      // Save user details to localStorage
      localStorage.setItem("candidate_user", JSON.stringify(data.user));
      localStorage.setItem("candidate_email", data.user.email);
      
      navigate('/');
    } catch (err) {
      setError(err.message || "Sunucuyla haberleşirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090b14] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111827] border border-gray-800/60 rounded-3xl p-8 relative z-10 shadow-2xl shadow-black/40">
        
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-purple-900/30 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            AI-Hire Coach
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isLogin ? "Hesabınıza Giriş Yapın" : "Yeni Hesap Oluşturun"}
          </h1>
          <p className="text-gray-400 text-xs mt-1 max-w-[280px]">
            {isLogin 
              ? "Kişiselleştirilmiş mülakat simülasyonunuza devam etmek için bilgilerinizi girin." 
              : "Yetkinliklerinize özel yapay zeka mülakatlarına başlamak için kaydolun."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Ad Soyad</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Ahmet Yılmaz" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all placeholder-gray-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">E-posta Adresi *</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                placeholder="e.g. ahmet@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all placeholder-gray-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Şifre *</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-gray-500" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all placeholder-gray-600"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-semibold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-800/80 pt-6 text-center text-xs text-gray-500">
          {isLogin ? (
            <p>
              Bir hesabınız yok mu?{" "}
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Kayıt Olun
              </button>
            </p>
          ) : (
            <p>
              Zaten üye misiniz?{" "}
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Giriş Yapın
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
