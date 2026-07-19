import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  FileText, 
  Save, 
  Plus, 
  Camera, 
  LogOut, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Wrench,
  Trash2,
  Download
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Retrieve logged-in user
  const userStr = localStorage.getItem("candidate_user");
  const initialUser = userStr ? JSON.parse(userStr) : { id: 1, email: "alex@example.com", name: "Alex", profile_picture: "" };

  // Profile Settings States
  const [name, setName] = useState(initialUser.name || '');
  const [email, setEmail] = useState(initialUser.email || '');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(initialUser.profile_picture || '');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Primary CV States
  const [cvId, setCvId] = useState(null);
  const [level, setLevel] = useState('Mid');
  const [techStack, setTechStack] = useState({ languages: [], frameworks: [], tools: [], databases: [] });
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState({ strong: [], weak: [] });
  const [europassData, setEuropassData] = useState({
    personal: { phone: '', title: '', summary: '' },
    experience: [],
    education: []
  });

  // UI Active State
  const [activeTab, setActiveTab] = useState('personal'); // personal, experience, education, skills
  const [isSavingCV, setIsSavingCV] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form Temp States (Experience)
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Form Temp States (Education)
  const [eduDegree, setEduDegree] = useState('');
  const [eduSchool, setEduSchool] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');

  // Form Temp States (Skills lists as comma string)
  const [skillLangs, setSkillLangs] = useState('');
  const [skillFws, setSkillFws] = useState('');
  const [skillTools, setSkillTools] = useState('');
  const [skillDbs, setSkillDbs] = useState('');

  useEffect(() => {
    loadUserProfile();
    // Eğer URL'de cv-updated parametresi varsa, başarı mesajı göster
    const params = new URLSearchParams(window.location.search);
    if (params.get('cv-updated') === 'true') {
      setInfoMessage("CV başarıyla analiz edildi ve profiliniz güncellendi!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadUserProfile = async () => {
    setErrorMessage('');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/user/profile?email=${encodeURIComponent(initialUser.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setProfilePic(data.user.profile_picture || '');

          if (data.cv_profile) {
            const cv = data.cv_profile;
            setCvId(cv.id);
            setLevel(cv.level || 'Mid');
            setTechStack(cv.tech_stack || { languages: [], frameworks: [], tools: [], databases: [] });
            setStrengthsWeaknesses(cv.strengths_weaknesses || { strong: [], weak: [] });
            
            const europass = cv.europass_data || {
              personal: { phone: '', title: '', summary: '' },
              experience: [],
              education: []
            };
            setEuropassData(europass);

            // Populate skills textareas/inputs
            setSkillLangs((cv.tech_stack?.languages || []).join(', '));
            setSkillFws((cv.tech_stack?.frameworks || []).join(', '));
            setSkillTools((cv.tech_stack?.tools || []).join(', '));
            setSkillDbs((cv.tech_stack?.databases || []).join(', '));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Profil yüklenirken sunucu hatası oluştu.");
    }
  };

  // Profile Picture Upload (Base64)
  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePic(event.target.result);
        updateProfilePhoto(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const updateProfilePhoto = async (base64Str) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: initialUser.id,
          profile_picture: base64Str
        })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("candidate_user", JSON.stringify(data.user));
        setInfoMessage("Profil fotoğrafınız başarıyla güncellendi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Account Settings (Name, Email, Password)
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    setErrorMessage('');
    setInfoMessage('');

    const payload = {
      user_id: initialUser.id,
      name,
      email
    };
    if (password.trim()) {
      payload.password = password;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Hesap bilgileri güncellenemedi.");
      }

      const data = await response.json();
      localStorage.setItem("candidate_user", JSON.stringify(data.user));
      setInfoMessage("Hesap ayarlarınız başarıyla güncellendi.");
      setPassword('');
    } catch (err) {
      setErrorMessage(err.message || "Kaydedilirken hata oluştu.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Profile Completion Calculations
  const calculateProfileCompletion = () => {
    let score = 0;
    const missing = [];

    const personal = europassData.personal || {};
    const exp = europassData.experience || [];
    const edu = europassData.education || [];
    
    // Personal details (30%)
    if (personal.title) score += 10; else missing.push("Ünvan (Örn: Backend Developer)");
    if (personal.phone) score += 10; else missing.push("Telefon Numarası");
    if (personal.summary) score += 10; else missing.push("Profil Özeti");

    // Experience (25%)
    if (exp.length > 0) score += 25; else missing.push("En az 1 adet İş Deneyimi");

    // Education (20%)
    if (edu.length > 0) score += 20; else missing.push("En az 1 adet Eğitim Geçmişi");

    // Tech Stack (15%)
    const hasLangs = skillLangs.trim().length > 0;
    const hasFws = skillFws.trim().length > 0;
    if (hasLangs) score += 7.5; else missing.push("En az 1 Programlama Dili");
    if (hasFws) score += 7.5; else missing.push("En az 1 Kütüphane / Framework");

    // Social Accounts (10%)
    if (personal.linkedin) score += 5; else missing.push("LinkedIn Profil Bağlantısı");
    if (personal.github) score += 5; else missing.push("GitHub Profil Bağlantısı");

    return { score: Math.round(score), missing };
  };

  const { score: completionScore, missing: missingFields } = calculateProfileCompletion();

  // Add Job Experience
  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim()) return;

    const newJob = {
      title: expTitle.trim(),
      company: expCompany.trim(),
      start_date: expStart.trim() || '2023',
      end_date: expEnd.trim() || 'Devam Ediyor',
      description: expDesc.trim()
    };

    setEuropassData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), newJob]
    }));

    // Reset Job Fields
    setExpTitle('');
    setExpCompany('');
    setExpStart('');
    setExpEnd('');
    setExpDesc('');
  };

  const handleRemoveExperience = (idx) => {
    setEuropassData(prev => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== idx)
    }));
  };

  // Add Education Entry
  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!eduDegree.trim() || !eduSchool.trim()) return;

    const newEdu = {
      degree: eduDegree.trim(),
      school: eduSchool.trim(),
      start_date: eduStart.trim() || '2019',
      end_date: eduEnd.trim() || '2023'
    };

    setEuropassData(prev => ({
      ...prev,
      education: [...(prev.education || []), newEdu]
    }));

    // Reset School Fields
    setEduDegree('');
    setEduSchool('');
    setEduStart('');
    setEduEnd('');
  };

  const handleRemoveEducation = (idx) => {
    setEuropassData(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== idx)
    }));
  };

  // Save full CV profile (Create or Update)
  const handleSaveCVProfile = async () => {
    setIsSavingCV(true);
    setErrorMessage('');
    setInfoMessage('');

    // Format skills
    const langsArr = skillLangs.split(',').map(s => s.trim()).filter(Boolean);
    const fwsArr = skillFws.split(',').map(s => s.trim()).filter(Boolean);
    const toolsArr = skillTools.split(',').map(s => s.trim()).filter(Boolean);
    const dbsArr = skillDbs.split(',').map(s => s.trim()).filter(Boolean);

    const formattedTech = {
      languages: langsArr,
      frameworks: fwsArr,
      tools: toolsArr,
      databases: dbsArr
    };

    const payload = {
      user_id: initialUser.id,
      level,
      tech_stack: formattedTech,
      strengths_weaknesses: strengthsWeaknesses,
      europass_data: europassData,
      raw_analysis: "Manuel Europass CV Düzenleyici Çıktısı"
    };

    try {
      let url = "http://127.0.0.1:8000/api/v1/user/cv/create";
      let method = "POST";

      if (cvId) {
        url = `http://127.0.0.1:8000/api/v1/user/cv/${cvId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Özgeçmiş kaydedilemedi.");
      }

      const data = await response.json();
      setInfoMessage("Özgeçmişiniz başarıyla veritabanına kaydedildi!");
      if (data.cv) {
        setCvId(data.cv.id);
      }
      await loadUserProfile();
    } catch (err) {
      setErrorMessage(err.message || "CV kaydedilirken bir hata oluştu.");
    } finally {
      setIsSavingCV(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("candidate_user");
    navigate('/login');
  };

  return (
    <div className="flex-1 bg-[#0b0f19] text-gray-200 p-8 overflow-y-auto custom-scrollbar">
      
      {/* Alert Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex gap-3 text-red-400 text-xs animate-fade-in">
          <AlertCircle size={16} className="flex-shrink-0" />
          {errorMessage}
        </div>
      )}
      {infoMessage && (
        <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex gap-3 text-emerald-400 text-xs animate-fade-in">
          <CheckCircle size={16} className="flex-shrink-0" />
          {infoMessage}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Account Settings & Photo */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Avatar Profile Photo Card */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 text-center shadow-xl shadow-black/10 relative overflow-hidden group">
            <div className="relative w-24 h-24 mx-auto mb-4 cursor-pointer" onClick={handlePhotoClick}>
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Profil" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/50 shadow-lg shadow-purple-500/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-650 to-indigo-650 flex items-center justify-center border-2 border-purple-500/30 text-white font-bold text-3xl">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoChange} 
              accept="image/*" 
              className="hidden" 
            />

            <h3 className="text-white font-bold text-base">{name}</h3>
            <p className="text-xs text-gray-500 mt-1">{email}</p>
          </div>

          {/* Account Settings Forms */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/10">
            <h2 className="text-base font-semibold mb-4 text-white">Hesap Bilgileri</h2>
            
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Ad Soyad</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">E-posta Adresi</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 pl-1">Yeni Şifre (Değiştirmek için)</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-[#0b0f19] border border-gray-800 focus:border-purple-500/50 text-gray-200 text-xs rounded-xl py-3 pl-10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={isUpdatingSettings}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isUpdatingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      Kaydet
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleSignOut}
                  className="flex-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <LogOut size={14} />
                  Çıkış Yap
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Step-by-Step Resume Builder & Completion Meter */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROFILE COMPLETION RADIAL / PROGRESS DISPLAY */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/10">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
              
              <div className="flex items-center gap-5">
                {/* Circular Percentage Meter */}
                <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-gray-800 stroke-current" strokeWidth="6" cx="50" cy="50" r="40" fill="transparent"></circle>
                    <circle 
                      className={`${completionScore === 100 ? 'text-emerald-500' : 'text-purple-500'} stroke-current`}
                      strokeWidth="6" 
                      strokeLinecap="round" 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * completionScore) / 100}
                    ></circle> 
                  </svg>
                  <span className="absolute text-sm font-bold text-white">{completionScore}%</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Profil Tamamlama Oranı</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    AI-Hire Coach ile profilinizi tamamlayın ve kendinizi hemen test edin.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full md:w-auto">
                {cvId && (
                  <a 
                    href={`http://127.0.0.1:8000/api/v1/user/cv/export-pdf?email=${encodeURIComponent(initialUser.email)}`}
                    download
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    CV PDF İndir
                  </a>
                )}
                <button 
                  onClick={handleSaveCVProfile}
                  disabled={isSavingCV}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-650/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingCV ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  CV'mi Kaydet
                </button>
              </div>
            </div>

            {/* List of missing requirements */}
            {missingFields.length > 0 && (
              <div className="mt-5 p-4 bg-amber-950/15 border border-amber-900/25 rounded-xl">
                <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Özgeçmişinizi Tamamlamak İçin Gerekenler:
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 pl-1.5 list-disc list-inside text-[11px] text-gray-400">
                  {missingFields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* EUROPASS STEP-BY-STEP TABS */}
          <div className="bg-[#111827] border border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/10">
            {/* Header / Instructions Banner */}
            <div className="p-4 mb-6 bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-900/30 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                <FileText className="text-purple-400 w-4 h-4" />
                Profilinizi Tamamlayın veya Özgeçmişinizi Oluşturun
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Aşağıdaki alanlardan bilgilerinizi manuel düzenleyebilir ya da ana sayfadan bir PDF CV yükleyebilirsiniz. 
                Yeni bir PDF yüklediğinizde; <b>eğitim, deneyim, yetenekler</b> ve <b>sosyal medya hesaplarınız (LinkedIn, GitHub)</b> otomatik taranarak bu bölümlere doldurulur. 
                Siz yeni bir dosya yükleyene kadar, mülakat başlatırken bu sayfada yer alan güncel bilgiler temel alınır.
              </p>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-gray-850 gap-2 mb-6 overflow-x-auto pb-1">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'personal' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/25' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <User size={14} />
                Kişisel Bilgiler
              </button>
              
              <button 
                onClick={() => setActiveTab('experience')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'experience' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/25' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Briefcase size={14} />
                İş Deneyimi ({europassData.experience?.length || 0})
              </button>

              <button 
                onClick={() => setActiveTab('education')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'education' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/25' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <GraduationCap size={14} />
                Eğitim Geçmişi ({europassData.education?.length || 0})
              </button>

              <button 
                onClick={() => setActiveTab('skills')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'skills' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/25' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Wrench size={14} />
                Yetenekler
              </button>
            </div>

            {/* TAB CONTENTS */}
            
            {/* Tab 1: Personal info */}
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Ünvan / Rol (Örn: Frontend Developer)</label>
                    <input 
                      type="text"
                      value={europassData.personal?.title || ''}
                      onChange={(e) => setEuropassData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, title: e.target.value }
                      }))}
                      placeholder="Backend Developer"
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Telefon Numarası</label>
                    <input 
                      type="text"
                      value={europassData.personal?.phone || ''}
                      onChange={(e) => setEuropassData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, phone: e.target.value }
                      }))}
                      placeholder="+90 555 123 4567"
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Social media links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">LinkedIn Profili</label>
                    <input 
                      type="text"
                      value={europassData.personal?.linkedin || ''}
                      onChange={(e) => setEuropassData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, linkedin: e.target.value }
                      }))}
                      placeholder="https://linkedin.com/in/kullaniciadi"
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">GitHub Profili</label>
                    <input 
                      type="text"
                      value={europassData.personal?.github || ''}
                      onChange={(e) => setEuropassData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, github: e.target.value }
                      }))}
                      placeholder="https://github.com/kullaniciadi"
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Kişisel Web Sitesi / Portfolyo</label>
                    <input 
                      type="text"
                      value={europassData.personal?.website || ''}
                      onChange={(e) => setEuropassData(prev => ({
                        ...prev,
                        personal: { ...prev.personal, website: e.target.value }
                      }))}
                      placeholder="https://portfolyom.com"
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Kıdem Seviyesi (Mülakat Soruları İçin Seviye Seçimi)</label>
                  <select 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                  >
                    <option value="Junior">Junior / Entry-Level</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior / Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Profil / Kariyer Özeti</label>
                  <textarea 
                    value={europassData.personal?.summary || ''}
                    onChange={(e) => setEuropassData(prev => ({
                      ...prev,
                      personal: { ...prev.personal, summary: e.target.value }
                    }))}
                    rows={6}
                    placeholder="Kendinizden, hedeflerinizden ve teknik birikiminizden kısaca bahsedin..."
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3.5 focus:outline-none focus:border-purple-500/50 resize-none custom-scrollbar"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Work Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-6 animate-fade-in">
                {/* Add new job form */}
                <form onSubmit={handleAddExperience} className="p-4 bg-[#0b0f19]/45 border border-gray-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider pl-1">İş Deneyimi Ekle</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Ünvan / Pozisyon</label>
                      <input 
                        type="text" 
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        placeholder="Backend Developer"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Şirket / Kurum</label>
                      <input 
                        type="text" 
                        value={expCompany}
                        onChange={(e) => setExpCompany(e.target.value)}
                        placeholder="Kod Yazılım A.Ş."
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Başlangıç Tarihi</label>
                      <input 
                        type="text" 
                        value={expStart}
                        onChange={(e) => setExpStart(e.target.value)}
                        placeholder="2022 veya 2022-04"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Bitiş Tarihi</label>
                      <input 
                        type="text" 
                        value={expEnd}
                        onChange={(e) => setExpEnd(e.target.value)}
                        placeholder="2023 veya Devam Ediyor"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Göreviniz / Açıklama</label>
                    <textarea 
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      rows={3}
                      placeholder="Bu pozisyondaki sorumluluklarınız ve kullandığınız teknolojiler..."
                      className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50 resize-none"
                    />
                  </div>

                  <div className="text-right">
                    <button 
                      type="submit"
                      className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Deneyim Ekle
                    </button>
                  </div>
                </form>

                {/* Job list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Kayıtlı Deneyimler</h4>
                  
                  {europassData.experience?.map((job, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-[#0d111d] border border-gray-850 rounded-xl flex justify-between items-start"
                    >
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-gray-200">{job.title}</h5>
                        <p className="text-xs text-purple-400 font-semibold">{job.company} · <span className="text-gray-500 font-normal">{job.start_date} - {job.end_date}</span></p>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{job.description}</p>
                      </div>

                      <button 
                        onClick={() => handleRemoveExperience(idx)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {(!europassData.experience || europassData.experience.length === 0) && (
                    <p className="text-xs text-gray-500 italic pl-1">Henüz hiçbir iş deneyimi eklenmemiş.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Education */}
            {activeTab === 'education' && (
              <div className="space-y-6 animate-fade-in">
                {/* Add school form */}
                <form onSubmit={handleAddEducation} className="p-4 bg-[#0b0f19]/45 border border-gray-800/80 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider pl-1">Eğitim Ekle</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Bölüm / Derece (Örn: Bilgisayar Mühendisliği)</label>
                      <input 
                        type="text" 
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="Bilgisayar Mühendisliği Lisansı"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Okul / Üniversite</label>
                      <input 
                        type="text" 
                        value={eduSchool}
                        onChange={(e) => setEduSchool(e.target.value)}
                        placeholder="İstanbul Teknik Üniversitesi"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Başlangıç Yılı</label>
                      <input 
                        type="text" 
                        value={eduStart}
                        onChange={(e) => setEduStart(e.target.value)}
                        placeholder="2018"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">Mezuniyet / Bitiş Yılı</label>
                      <input 
                        type="text" 
                        value={eduEnd}
                        onChange={(e) => setEduEnd(e.target.value)}
                        placeholder="2022 veya Devam Ediyor"
                        className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <button 
                      type="submit"
                      className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      Eğitim Ekle
                    </button>
                  </div>
                </form>

                {/* Education list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Kayıtlı Eğitimler</h4>
                  
                  {europassData.education?.map((school, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-[#0d111d] border border-gray-850 rounded-xl flex justify-between items-start"
                    >
                      <div>
                        <h5 className="text-sm font-bold text-gray-200">{school.degree}</h5>
                        <p className="text-xs text-purple-400 font-semibold">{school.school} · <span className="text-gray-500 font-normal">{school.start_date} - {school.end_date}</span></p>
                      </div>

                      <button 
                        onClick={() => handleRemoveEducation(idx)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/20 rounded-lg transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {(!europassData.education || europassData.education.length === 0) && (
                    <p className="text-xs text-gray-500 italic pl-1">Henüz hiçbir eğitim geçmişi eklenmemiş.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Technical Skills */}
            {activeTab === 'skills' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Programlama Dilleri (Virgülle ayırarak yazın)</label>
                  <input 
                    type="text"
                    value={skillLangs}
                    onChange={(e) => setSkillLangs(e.target.value)}
                    placeholder="Python, JavaScript, TypeScript, Go"
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Kütüphaneler & Frameworkler (Virgülle ayırarak yazın)</label>
                  <input 
                    type="text"
                    value={skillFws}
                    onChange={(e) => setSkillFws(e.target.value)}
                    placeholder="FastAPI, Django, React, Next.js, Node.js"
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Geliştirici Araçları & Teknolojiler (Virgülle ayırarak yazın)</label>
                  <input 
                    type="text"
                    value={skillTools}
                    onChange={(e) => setSkillTools(e.target.value)}
                    placeholder="Docker, Git, CI/CD, AWS, Kubernetes"
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 pl-1">Veritabanları (Virgülle ayırarak yazın)</label>
                  <input 
                    type="text"
                    value={skillDbs}
                    onChange={(e) => setSkillDbs(e.target.value)}
                    placeholder="PostgreSQL, MongoDB, SQLite, Redis"
                    className="w-full bg-[#0b0f19] border border-gray-800 text-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
export { Profile };
