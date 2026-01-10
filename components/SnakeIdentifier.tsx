import React, { useState, useEffect } from 'react';
import { 
  Camera, Search, AlertTriangle, Activity, Info, X, Shield, 
  ShieldAlert, Skull, HeartPulse, ChevronRight, Globe, 
  BookOpen, ExternalLink, Languages, Map as MapIcon, RotateCcw,
  Clock, ThermometerSun, Leaf, AlertOctagon
} from 'lucide-react';
import { identifySnake } from '../services/geminiService';
import { SnakeAnalysisResult, ViewState, LangCode } from '../types';

// --- STATIC TRANSLATIONS ---
const UI_TEXT = {
  en: {
    appTitle: "Serpent",
    tagline: "Identify Snakes in Seconds",
    subTagline: "AI-powered identification for your safety.\nFocus on Asian & Global species.",
    searchPlaceholder: "Search by name (e.g. 'King Cobra')",
    takePhoto: "Take a Photo",
    uploadText: "Use your camera or upload an image",
    recent: "Recent Scans",
    analyzing: "Analyzing Scales...",
    analyzingSub: "Comparing against 3,000+ species...",
    certainty: "Certainty",
    dangerLevel: "Danger Level",
    venomous: "Venomous Species",
    about: "About (Simple Summary)",
    funFact: "Fun Fact:",
    habitat: "Native Locations",
    firstAid: "First Aid Protocol",
    disclaimer: "Disclaimer: AI-generated advice. Always seek professional medical help immediately for snake bites.",
    compare: "Visual Comparison",
    compareBtn: "View Reference Images",
    resources: "Trusted Resources",
    confirmSafety: "I Understand",
    safetyWarning: "Critical: Treat unidentified snakes as dangerous.",
    mapLegend: "Colored by Continent",
    searchAnother: "Identify Another Snake",
    detailedProfile: "Detailed Species Profile",
    altNames: "Alternative Names",
    detailFamily: "Family",
    detailRange: "Range",
    detailHabitat: "Habitat",
    detailActiveTime: "Active Time",
    detailDiet: "Diet",
    detailVenom: "Venom",
    detailDanger: "Danger",
    detailPrevention: "Prevention",
    detailBehavior: "Behavior"
  },
  th: {
    appTitle: "Serpent",
    tagline: "ระบุชนิดงูได้ในไม่กี่วินาที",
    subTagline: "ระบบ AI เพื่อความปลอดภัยของคุณ\nเน้นสายพันธุ์เอเชียและทั่วโลก",
    searchPlaceholder: "ค้นหาด้วยชื่อ (เช่น 'งูจงอาง')",
    takePhoto: "ถ่ายรูป",
    uploadText: "ใช้กล้องหรืออัปโหลดรูปภาพ",
    recent: "การค้นหาล่าสุด",
    analyzing: "กำลังวิเคราะห์เกล็ด...",
    analyzingSub: "กำลังเปรียบเทียบกับ 3,000+ สายพันธุ์...",
    certainty: "ความมั่นใจ",
    dangerLevel: "ระดับความอันตราย",
    venomous: "งูมีพิษ",
    about: "เกี่ยวกับ (ฉบับเข้าใจง่าย)",
    funFact: "เกร็ดน่ารู้:",
    habitat: "ถิ่นกำเนิด",
    firstAid: "การปฐมพยาบาลเบื้องต้น",
    disclaimer: "คำเตือน: คำแนะนำจาก AI โปรดพบแพทย์ทันทีหากถูกงูกัด",
    compare: "เปรียบเทียบภาพ",
    compareBtn: "ดูภาพอ้างอิงเพิ่มเติม",
    resources: "แหล่งข้อมูลที่เชื่อถือได้",
    confirmSafety: "ฉันเข้าใจ",
    safetyWarning: "สำคัญ: ถือว่างูที่ไม่รู้จักเป็นอันตรายเสมอ",
    mapLegend: "แยกสีตามทวีป",
    searchAnother: "ค้นหางูตัวอื่น",
    detailedProfile: "ข้อมูลจำเพาะสายพันธุ์",
    altNames: "ชื่อเรียกอื่นๆ",
    detailFamily: "วงศ์",
    detailRange: "พื้นที่แพร่กระจาย",
    detailHabitat: "ที่อยู่อาศัย",
    detailActiveTime: "เวลาที่ออกหากิน",
    detailDiet: "อาหาร",
    detailVenom: "พิษ",
    detailDanger: "อันตราย",
    detailPrevention: "การป้องกัน",
    detailBehavior: "พฤติกรรม"
  }
};

const DangerScale = ({ level }: { level: string }) => {
  const levels = ['Safe', 'Moderate', 'High', 'Critical'];
  const colors: Record<string, string> = {
    Safe: 'bg-green-500',
    Moderate: 'bg-yellow-400',
    High: 'bg-orange-500',
    Critical: 'bg-red-600'
  };
  
  return (
    <div className="w-full mb-2">
       <div className="flex justify-between text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
          <span>Danger Level</span>
          <span style={{ color: level === 'Safe' ? '#4ade80' : level === 'Moderate' ? '#facc15' : level === 'High' ? '#f97316' : '#dc2626' }}>
             {level}
          </span>
       </div>
       <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-800 p-0.5">
          {levels.map((l) => (
             <div 
                key={l}
                className={`flex-1 rounded-full transition-all duration-500 ${colors[l]} ${
                   level === l ? 'opacity-100 scale-100' : 'opacity-20 scale-95'
                }`}
             ></div>
          ))}
       </div>
    </div>
  );
};

const LocationList = ({ locations, legendText }: { locations: SnakeAnalysisResult['locations'], legendText: string }) => {
  const continentColors: Record<string, string> = {
    NA: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    SA: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    EU: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    AF: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    AS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    OC: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
  };

  const defaultColor = "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {locations && locations.length > 0 ? (
          locations.map((loc, idx) => {
            const colorClass = continentColors[loc.continent_code] || defaultColor;
            return (
              <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${colorClass} flex items-center gap-1.5`}>
                <Globe size={12} />
                {loc.country}
              </span>
            );
          })
        ) : (
          <span className="text-slate-500 text-sm italic">Region data unavailable</span>
        )}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-slate-500"></div> {legendText}
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-3 border-b border-slate-800 last:border-0">
    <div className="flex items-center gap-2 text-slate-400 min-w-[140px] shrink-0">
      <Icon size={16} />
      <span className="text-sm font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-slate-200 text-sm leading-relaxed">{value || "N/A"}</div>
  </div>
);

const SnakeAnimation = () => (
  <div className="relative w-64 h-64 flex items-center justify-center">
    <img 
      src="/images/animated-snake.gif" 
      alt="Analyzing..." 
      className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
      style={{ animation: 'loop 2s infinite' }}
    />
  </div>
);

const SnakeIdentifier: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [lang, setLang] = useState<LangCode>('en');
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<SnakeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<SnakeAnalysisResult[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const t = UI_TEXT[lang];

  const handleAnalyze = async (input: string, type: 'image' | 'text') => {
    setView('analyzing');
    setError(null);
    setData(null);
    setShowDisclaimer(true);

    try {
      const result = await identifySnake(input, type);

      if (!result.found) {
        let errorMsg = "Could not identify a snake. ";
        if (type === 'image') {
          errorMsg += "Please try a clearer, better-lit photo with the entire snake visible.";
        } else {
          errorMsg += "Please try a different or more specific snake name.";
        }
        setError(errorMsg);
        setView('home');
      } else {
        // Additional confidence check
        if (result.confidence < 85) {
          setError("Confidence level too low for reliable identification. Please try a clearer image or different angle.");
          setView('home');
        } else {
          setData(result);
          if (type === 'image') setHistory(prev => [result, ...prev]);
          setView('result');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError("Connection failed. Please check your internet or try again.");
      setView('home');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImage(result);
        handleAnalyze(result, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setImage(null); 
      handleAnalyze(searchQuery, 'text');
    }
  };

  const toggleLang = () => setLang(l => l === 'en' ? 'th' : 'en');

  // --- VIEW: ANALYZING ---
  if (view === 'analyzing') {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        {/* Navbar */}
        <nav className="p-6 flex justify-center items-center z-50 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 overflow-hidden">
              <img src="/images/logo.png" alt="SerpentID Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight">{t.appTitle}<span className="text-emerald-500">ID</span></span>
          </div>
          <button onClick={toggleLang} className="absolute right-6 px-3 py-1 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors flex items-center gap-2 border border-slate-800">
            <Languages size={14} />
            <span className="text-xs font-bold uppercase">{lang === 'en' ? 'EN' : 'TH'}</span>
          </button>
        </nav>

        {/* Analyzing Content */}
        <div className="flex flex-col items-center justify-center p-6 relative" style={{height: 'calc(100vh - 120px)'}}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950"></div>
          <div className="relative z-10 flex flex-col items-center">
            <SnakeAnimation />
            <h2 className="mt-8 text-2xl font-bold text-emerald-400 animate-pulse">{t.analyzing}</h2>
            <p className="text-slate-400 mt-2">{t.analyzingSub}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: RESULT ---
  if (view === 'result' && data) {
    const localized = data.data[lang];
    const details = data.details[lang];

    return (
      <div className="min-h-screen bg-slate-950 text-white pb-40">
        {/* Header Image */}
        <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
          {image ? (
            <img src={image} alt="Snake" className="w-full h-full object-cover opacity-80" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-emerald-900/20">
                <Search className="w-16 h-16 text-emerald-500/50" />
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors z-20">
            <X size={24} />
          </button>
          
          <button onClick={toggleLang} className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center gap-2 border border-white/10 z-20">
             <Languages size={14} />
             <span className="text-xs font-bold uppercase">{lang === 'en' ? 'EN' : 'TH'}</span>
          </button>
        </div>

        <div className="px-6 -mt-12 relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">{localized.name}</h1>
              <p className="text-emerald-400 italic font-serif text-lg">{data.scientific_name}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{t.certainty}</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${data.confidence > 85 ? 'bg-green-500' : data.confidence > 75 ? 'bg-yellow-500' : 'bg-orange-500'}`}></div>
                <span className="text-xl font-bold text-emerald-400">{data.confidence}%</span>
              </div>
              <span className={`text-xs font-semibold mt-1 ${data.confidence > 85 ? 'text-green-400' : data.confidence > 75 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {data.confidence > 85 ? 'High confidence' : data.confidence > 75 ? 'Medium confidence' : 'Low confidence'}
              </span>
            </div>
          </div>

          {data.confidence < 85 && (
            <div className="mb-6 p-4 bg-yellow-950/40 border border-yellow-500/40 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-yellow-200 text-sm font-semibold">Lower confidence identification</p>
                <p className="text-yellow-200/70 text-xs mt-1">This identification is less certain. Compare with reference images and consult local experts if needed.</p>
              </div>
            </div>
          )}

          <div className="mb-6">
             <DangerScale level={data.danger_level} />
          </div>

          {data.is_venomous && (
            <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl flex items-start gap-4 mb-4">
              <AlertTriangle className="text-red-500 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-400">{t.venomous}</h3>
                <p className="text-sm text-red-200/80 mt-1">{localized.toxicity_details}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            
            {/* Description */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                <Info size={16} /> {t.about}
              </h3>
              <p className="text-slate-300 leading-relaxed font-light">
                {localized.description}
              </p>

              {/* Alternative Names */}
              <div className="mt-4 pt-3 border-t border-slate-800/50">
                 <p className="text-sm text-slate-400">
                    <span className="font-bold text-emerald-500 mr-2">{t.altNames}:</span>
                    <span className="text-slate-300 italic">
                      {[...details.other_names, ...details.thai_names].join(', ')}
                    </span>
                 </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/50">
                <p className="text-emerald-400 text-sm">
                  <span className="font-bold text-slate-400 mr-2">{t.funFact}</span>
                  {localized.fun_fact}
                </p>
              </div>
            </div>

            {/* Habitat */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                <MapIcon size={16} /> {t.habitat}
              </h3>
              <LocationList locations={data.locations} legendText={t.mapLegend} />
              <p className="text-slate-400 text-sm mt-3">{localized.habitat_text}</p>
            </div>

             {/* Detailed Profile */}
             <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
               <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                 <BookOpen size={16} /> {t.detailedProfile}
               </h3>
               
               <DetailRow icon={Info} label={t.detailFamily} value={details.family} />
               <DetailRow icon={Globe} label={t.detailRange} value={details.range} />
               <DetailRow icon={Leaf} label={t.detailHabitat} value={details.habitat} />
               <DetailRow icon={Clock} label={t.detailActiveTime} value={details.active_time} />
               <DetailRow icon={Activity} label={t.detailDiet} value={details.diet} />
               <DetailRow icon={Skull} label={t.detailVenom} value={details.venom_toxicity} />
               <DetailRow icon={AlertOctagon} label={t.detailDanger} value={details.danger_to_humans} />
               <DetailRow icon={Shield} label={t.detailPrevention} value={details.prevention} />
               <DetailRow icon={ThermometerSun} label={t.detailBehavior} value={details.behavior} />
             </div>

            {/* Visual Comparison */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
               <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                <Camera size={16} /> {t.compare}
              </h3>
              <div className="flex gap-4 items-center">
                 <div className="w-16 h-16 bg-black rounded-lg overflow-hidden border border-slate-700">
                    {image ? <img src={image} className="w-full h-full object-cover" alt="User upload" /> : <div className="w-full h-full bg-slate-800"></div>}
                 </div>
                 <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-2">Not sure? Compare with verified images.</p>
                    <a 
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.search_term || data.scientific_name || '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold border border-emerald-500/30 px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
                    >
                       <ExternalLink size={14} /> {t.compareBtn}
                    </a>
                 </div>
              </div>
            </div>

            {/* First Aid */}
            <div className="bg-orange-950/40 p-5 rounded-2xl border border-orange-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <HeartPulse size={100} className="text-orange-500" />
              </div>
              <h3 className="text-orange-300 text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2 relative z-10">
                <HeartPulse size={16} className="text-orange-400" /> {t.firstAid}
              </h3>
              <ul className="space-y-3 relative z-10">
                {localized.first_aid.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm text-orange-50/90">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-900/60 border border-orange-500/50 rounded-full flex items-center justify-center text-orange-300 font-bold text-xs">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 mb-6">
               <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                  <BookOpen size={16} /> {t.resources}
               </h3>
               <div className="space-y-2">
                  <a href="https://www.who.int/health-topics/snakebite" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">World Health Organization (WHO)</span>
                        <ExternalLink size={14} className="text-slate-500" />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">Global guidelines on snakebite management.</p>
                  </a>
                  <a href="http://www.toxinology.com/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">Clinical Toxinology Resources</span>
                        <ExternalLink size={14} className="text-slate-500" />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">University of Adelaide generic database.</p>
                  </a>
                  <a href="https://thailandsnakes.com/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">ThailandSnakes.com</span>
                        <ExternalLink size={14} className="text-slate-500" />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">Extensive resource for snakes in Thailand.</p>
                  </a>
                  
                  {/* New Resources */}
                  <a href="https://www.thailandsnakes.com/ebook/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">Free eBook: Thailand Snakes</span>
                        <ExternalLink size={14} className="text-slate-500" />
                     </div>
                     <p className="text-xs text-slate-500 mt-1">Photos of Common Thailand Snakes by Vern Lovic.</p>
                  </a>
               </div>
            </div>

            <button 
              onClick={() => setView('home')}
              className="w-full py-4 bg-slate-800 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <RotateCcw size={20} />
              {t.searchAnother}
            </button>

          </div>
        </div>

        {/* Sticky Disclaimer */}
        {showDisclaimer && (
           <div className="fixed bottom-0 left-0 right-0 bg-red-950/95 backdrop-blur-lg border-t border-red-500/50 p-5 z-50 animate-in slide-in-from-bottom-5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
              <div className="max-w-md mx-auto flex flex-col gap-4">
                 <div className="flex gap-3 items-start">
                    <ShieldAlert className="text-red-400 shrink-0 mt-1" size={20} />
                    <div className="text-left">
                        <p className="text-white text-sm font-bold tracking-wide">
                           {t.safetyWarning}
                        </p>
                        <p className="text-red-200/80 text-xs leading-relaxed mt-1">
                           {t.disclaimer}
                        </p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setShowDisclaimer(false)}
                    className="w-full py-3 bg-white text-red-900 font-bold rounded-lg text-sm hover:bg-red-50 transition-colors shadow-lg active:scale-95"
                 >
                    {t.confirmSafety}
                 </button>
              </div>
           </div>
        )}
      </div>
    );
  }

  // --- VIEW: HOME ---
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <nav className="p-6 flex justify-center items-center z-50 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 overflow-hidden">
            <img src="/images/logo.png" alt="SerpentID Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight">{t.appTitle}<span className="text-emerald-500">ID</span></span>
        </div>
        <button onClick={toggleLang} className="absolute right-6 px-3 py-1 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors flex items-center gap-2 border border-slate-800">
          <Languages size={14} />
          <span className="text-xs font-bold uppercase">{lang === 'en' ? 'EN' : 'TH'}</span>
        </button>
      </nav>

      {/* Hero Section */}
      <main className="px-6 pb-20 pt-4 max-w-md mx-auto relative">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-3 text-red-400 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            {error.includes('photo') || error.includes('image') || error.includes('Confidence') ? (
              <div className="text-xs text-red-300/80 ml-8 space-y-1">
                <p className="font-semibold">💡 Tips for better photos:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Ensure the entire snake is visible in the frame</li>
                  <li>Take photo in good lighting (natural sunlight best)</li>
                  <li>Focus on the head, scales, and color pattern</li>
                  <li>Avoid blurry or partial images</li>
                  <li>Show distinctive markings clearly</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {/* Tagline */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 leading-tight">
             {lang === 'en' ? (
                <>Identify Snakes <br/> in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Seconds</span></>
             ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{t.tagline}</span>
             )}
          </h1>
          <p className="text-slate-400 whitespace-pre-line">{t.subTagline}</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 relative group">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md group-focus-within:bg-emerald-500/30 transition-all"></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl flex items-center p-2 focus-within:border-emerald-500/50 transition-colors">
            <Search className="text-slate-500 ml-3" size={20} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent border-none text-white p-3 focus:outline-none placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-slate-800 p-2 rounded-xl text-emerald-500 hover:bg-slate-700 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </form>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Upload Card */}
          <div className="relative group cursor-pointer overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="absolute inset-0 opacity-0 z-20 cursor-pointer"
              onChange={handleImageUpload}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-slate-900 z-0"></div>
            <div className="p-8 flex flex-col items-center justify-center relative z-10">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-emerald-900/20">
                <Camera className="text-emerald-500 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.takePhoto}</h3>
              <p className="text-slate-400 text-sm text-center">{t.uploadText}</p>
            </div>
          </div>

          {/* Recent Scans */}
          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">{t.recent}</h3>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} onClick={() => {setData(item); setView('result');}} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.is_venomous ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                      {item.is_venomous ? <Skull size={20} /> : <Shield size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.data[lang].name}</p>
                      <p className="text-xs text-slate-400">{item.scientific_name}</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-600" size={16} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* Decorative Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
      
    </div>
  );
};

export default SnakeIdentifier;