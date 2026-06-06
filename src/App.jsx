import React, { useState, useEffect } from 'react';
// IMPORT SUPABASE DIHAPUS KARENA KITA MENGGUNAKAN NATIVE REST API

import { 
  Search, Wifi, Plug, Snowflake, Wallet, 
  ArrowLeft, CheckCircle2, XCircle, MapPin, 
  Flame, ChevronDown, Trophy, Clock, Navigation,
  Lock, Edit3, Plus, Trash2, Save, Users, Star
} from 'lucide-react';

// --- KONFIGURASI SUPABASE NATIVE REST API (Solusi Anti-Error) ---
const supabaseUrl = 'https://shcsqmybgigbymdacoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoY3NxbXliZ2lnYnltZGFjb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTc2OTMsImV4cCI6MjA5NTg3MzY5M30.Az_3c6dweX1hZhrG6fVKIYYAZrrZOS6JU5ezR81vV5M';

// Helper Function untuk menggantikan @supabase/supabase-js
const supabaseFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1${endpoint}`, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation', 
      ...(options.headers || {})
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request ke Supabase gagal');
  }
  
  if (response.status === 204) return null; // No Content (misal untuk DELETE)
  return response.json();
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80";

// --- NONGKI SCORE ENGINE ---
const calculateNongkiScore = (places, criteria) => {
  return places.map(place => {
    let baseScore = 0;
    let breakdown = [];
    const maxBudget = parseInt(criteria.budget);

    if (place.capacity >= criteria.pax) { baseScore += 20; breakdown.push({ text: `Muat untuk ${criteria.pax}+ orang`, met: true }); } 
    else { breakdown.push({ text: `Kapasitas kurang (Maks ${place.capacity})`, met: false }); }

    if (criteria.facilities.wifi) { if (place.facilities.wifi) { baseScore += 20; breakdown.push({ text: "Tersedia WiFi", met: true }); } else { breakdown.push({ text: "Tidak ada WiFi", met: false }); } } 
    else { baseScore += 20; }

    if (criteria.facilities.colokan) { if (place.facilities.colokan) { baseScore += 20; breakdown.push({ text: "Banyak colokan", met: true }); } else { breakdown.push({ text: "Minim colokan", met: false }); } } 
    else { baseScore += 20; }

    if (criteria.facilities.ac) { if (place.facilities.ac) { baseScore += 15; breakdown.push({ text: "Ruangan ber-AC", met: true }); } else { breakdown.push({ text: "Tidak ber-AC", met: false }); } } 
    else { baseScore += 15; }

    if (criteria.area === 'any' || place.area.includes(criteria.area)) { baseScore += 10; breakdown.push({ text: "Sesuai pilihan area", met: true }); } 
    else { breakdown.push({ text: `Bukan area ${criteria.area}`, met: false }); }

    if (place.budget <= maxBudget || maxBudget === 100000) { baseScore += 15; breakdown.push({ text: "Sesuai budget", met: true }); } 
    else { breakdown.push({ text: "Melebihi budget", met: false }); }

    let penalty = 0;
    if (place.status === 'ramai') penalty += 8;
    else if (place.status === 'normal') penalty += 3;
    if (place.capacity === criteria.pax) penalty += 2; 
    if (place.budget > 0 && place.budget >= maxBudget * 0.8 && maxBudget !== 100000) penalty += 3;

    let finalScore = baseScore - penalty;
    if (finalScore > 100) finalScore = 100;
    if (finalScore < 0) finalScore = 0;

    return { ...place, score: finalScore, breakdown };
  }).sort((a, b) => b.score - a.score); 
};

const getAlternativeLabel = (place, index) => {
  if (index === 0) return { label: "🥈 Alternatif Terbaik", color: "text-[#D6D0CC]", bg: "bg-[#2A2624]" };
  if (place.budget <= 25000) return { label: "🥉 Pilihan Hemat", color: "text-[#E4B381]", bg: "bg-[#B3673B]/20" };
  if (place.status === 'ramai') return { label: "🔥 Lagi Ramai", color: "text-[#FF4D4D]", bg: "bg-[#FF4D4D]/10" };
  if (place.facilities.wifi && place.facilities.colokan) return { label: "📚 Cocok Buat Nugas", color: "text-[#00D4FF]", bg: "bg-[#00D4FF]/10" };
  return { label: "✨ Pilihan Menarik", color: "text-[#B3673B]", bg: "bg-[#B3673B]/20" };
};


// --- KOMPONEN VISUAL ---
const BrandLogo = () => (
  <div className="flex flex-col items-center justify-center pt-8 pb-4">
    <svg viewBox="0 0 120 120" className="w-24 h-24 mb-1 drop-shadow-[0_0_15px_rgba(228,179,129,0.15)]">
      <defs>
        <linearGradient id="copperGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D6A1" />
          <stop offset="50%" stopColor="#E4B381" />
          <stop offset="100%" stopColor="#B3673B" />
        </linearGradient>
      </defs>
      <path d="M45 35 C35 25, 55 15, 48 0" stroke="url(#copperGold)" strokeWidth="4" strokeLinecap="round" fill="none" className="animate-pulse" />
      <path d="M70 40 C60 25, 85 20, 75 5" stroke="url(#copperGold)" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
      <path d="M20 50 Q20 100 60 100 Q100 100 100 50 Z" fill="url(#copperGold)" />
      <ellipse cx="60" cy="50" rx="40" ry="12" fill="#12100E" />
      <ellipse cx="60" cy="52" rx="35" ry="9" fill="url(#copperGold)" opacity="0.3" />
      <path d="M95 55 C115 55, 115 85, 90 85" stroke="url(#copperGold)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M60 40 Q48 40 48 53 Q48 65 60 78 Q72 65 72 53 Q72 40 60 40 Z" fill="#12100E" />
      <circle cx="60" cy="53" r="5" fill="url(#copperGold)" />
    </svg>
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1">
        NONGKI<span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F5D6A1] to-[#B3673B]">KUY</span>
      </h1>
      <span className="text-[9px] font-bold text-[#8C8681] tracking-[0.2em] uppercase">Powered by Nongki Score™</span>
    </div>
  </div>
);

const CoffeeLineArtBg = () => (
  <div className="absolute right-0 top-10 opacity-[0.03] pointer-events-none z-0">
    <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke="#E4B381" strokeWidth="1">
      <path d="M20 50 Q50 90 80 50" />
      <ellipse cx="50" cy="50" rx="30" ry="10" />
      <path d="M80 55 C90 55, 90 70, 75 70" />
      <path d="M40 30 Q45 10 35 0 M60 35 Q65 15 55 5" strokeDasharray="2 2" />
    </svg>
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    sepi: { dot: "bg-[#00FFA3]", text: "text-[#00FFA3]/90", label: "SEPI" },
    normal: { dot: "bg-[#E4B381]", text: "text-[#E4B381]/90", label: "NORMAL" },
    ramai: { dot: "bg-[#FF4D4D]", text: "text-[#FF4D4D]/90", label: "RAMAI" }
  };
  const conf = configs[status] || configs.normal;
  return (
    <div className="flex items-center gap-1.5 bg-[#12100E]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5">
      <span className={`w-2 h-2 rounded-full ${conf.dot} shadow-[0_0_5px_currentColor]`}></span>
      <span className={`text-[9px] font-bold tracking-widest ${conf.text}`}>{conf.label}</span>
    </div>
  );
};

const CircularScoreBadge = ({ score, size = "md" }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  let strokeColor = "url(#scoreGrad)";
  let textColor = "text-transparent bg-clip-text bg-gradient-to-b from-[#F5D6A1] to-[#E4B381]";
  
  if (score < 60) {
    strokeColor = "#8C8681";
    textColor = "text-[#8C8681]";
  }

  let sizeClasses = "w-12 h-12 text-sm";
  if (size === "lg") sizeClasses = "w-16 h-16 text-xl";
  if (size === "xl") sizeClasses = "w-32 h-32 text-5xl";

  const sWidth = size === "xl" ? "8" : "4";
  const r = size === "xl" ? 48 : radius;
  const circ = 2 * Math.PI * r;
  const circOffset = circ - (score / 100) * circ;

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses}`}>
      <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_12px_rgba(228,179,129,0.3)]" viewBox={size === "xl" ? "0 0 104 104" : "0 0 52 52"}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D6A1" />
            <stop offset="100%" stopColor="#B3673B" />
          </linearGradient>
        </defs>
        <circle cx="50%" cy="50%" r={r} className="stroke-[#2A2624]" strokeWidth={sWidth} fill="none" />
        <circle cx="50%" cy="50%" r={r} stroke={strokeColor} strokeWidth={sWidth} fill="none" strokeDasharray={circ} strokeDashoffset={circOffset} strokeLinecap="round" />
      </svg>
      <span className={`font-black z-10 ${textColor}`}>{score}</span>
    </div>
  );
};


// --- APP UTAMA ---
export default function App() {
  const [view, setView] = useState('home'); 
  
  // STATE SUPABASE
  const [placesDB, setPlacesDB] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // State Filter Pencarian
  const [pax, setPax] = useState(4);
  const [budget, setBudget] = useState('50000');
  const [facilities, setFacilities] = useState({ wifi: true, colokan: true, ac: false });
  const [area, setArea] = useState('any');

  // State Admin
  const [adminPin, setAdminPin] = useState('');
  const [editingPlace, setEditingPlace] = useState(null);
  const [formImagePreview, setFormImagePreview] = useState('');

  // 1. FUNGSI FETCH DARI SUPABASE (VIA REST API)
  const loadPlaces = async () => {
    setIsLoading(true);
    try {
      // Mengambil data dari tabel places, urutkan dari ID terbaru
      const data = await supabaseFetch('/places?select=*&order=id.desc');
      
      if (data) {
        // Mapping kolom database baru ke format state frontend yang diharapkan
        const formattedData = data.map(dbPlace => ({
          ...dbPlace,
          image: dbPlace.cover_image_url || FALLBACK_IMAGE, 
          openHours: dbPlace.open_hours || '08:00 - 22:00', 
          budget: dbPlace.budget_max || dbPlace.budget_min || 25000, 
          status: dbPlace.status || 'normal', 
          facilities: { 
            wifi: dbPlace.has_wifi, 
            colokan: dbPlace.has_power_outlet, 
            ac: dbPlace.has_ac 
          },
          area: [
            dbPlace.area_indoor ? 'indoor' : null, 
            dbPlace.area_outdoor ? 'outdoor' : null
          ].filter(Boolean)
        }));
        setPlacesDB(formattedData);
      }
    } catch (error) {
      console.error("Gagal memuat data dari Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Muat data saat aplikasi pertama kali dijalankan
  useEffect(() => {
    loadPlaces();
  }, []);

  const toggleFacility = (key) => setFacilities(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSearch = () => {
    const scoredPlaces = calculateNongkiScore(placesDB, { pax, budget, facilities, area });
    setResults(scoredPlaces);
    setView('results');
  };

  const handleViewDetail = (place) => {
    setSelectedPlace(place);
    setView('detail');
  };

  // --- LOGIKA ADMIN SUPABASE ---
  const handleAdminLogin = () => {
    if (adminPin === '2026') { 
      setView('admin_dash');
      setAdminPin('');
    } else {
      alert("PIN Salah. Gunakan 2026");
    }
  };

  // 2. FUNGSI INSERT / UPDATE KE SUPABASE (VIA REST API)
  const handleSavePlace = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const capacity = parseInt(formData.get('capacity'));
    const budgetValue = parseInt(formData.get('budget'));
    
    if (capacity < 1) return alert("Kapasitas minimal 1 orang.");
    if (budgetValue < 0) return alert("Budget tidak boleh negatif.");

    let imageUrl = formData.get('image').trim();
    
    // Payload disesuaikan dengan skema kolom Supabase yang baru
    const dbPayload = {
      name: formData.get('name'),
      address: formData.get('address'),
      cover_image_url: imageUrl || null,
      open_hours: formData.get('openHours'),
      capacity: capacity,
      budget_min: budgetValue, 
      budget_max: budgetValue,
      status: formData.get('status'),
      has_wifi: formData.get('wifi') === 'on',
      has_power_outlet: formData.get('colokan') === 'on',
      has_ac: formData.get('ac') === 'on',
      area_indoor: formData.get('area_indoor') === 'on',
      area_outdoor: formData.get('area_outdoor') === 'on',
      city: 'Purwokerto'
    };

    try {
      if (editingPlace) {
        // Mode Edit: UPDATE (PATCH request)
        await supabaseFetch(`/places?id=eq.${editingPlace.id}`, {
          method: 'PATCH',
          body: JSON.stringify(dbPayload)
        });
      } else {
        // Mode Baru: INSERT (POST request)
        await supabaseFetch('/places', {
          method: 'POST',
          body: JSON.stringify(dbPayload)
        });
      }
      
      await loadPlaces(); // Sinkronisasi ulang (Refresh)
      setView('admin_dash');
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data ke database.");
    }
  };

  // 3. FUNGSI DELETE DARI SUPABASE (VIA REST API)
  const handleDeletePlace = async (id) => {
    if (window.confirm("Yakin ingin menghapus tempat ini dari database?")) {
      try {
        await supabaseFetch(`/places?id=eq.${id}`, {
          method: 'DELETE'
        });
        await loadPlaces(); // Sinkronisasi
      } catch (error) {
        alert("Gagal menghapus data.");
      }
    }
  };

  // 4. FUNGSI QUICK UPDATE STATUS SUPABASE (VIA REST API)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await supabaseFetch(`/places?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      await loadPlaces(); // Sinkronisasi
    } catch (error) {
      alert("Gagal update status.");
    }
  };


  return (
    <div className="min-h-screen bg-[#12100E] font-sans selection:bg-[#B3673B]/40 text-[#FAFAFA] flex justify-center sm:pb-0">
      <div className="w-full max-w-md bg-[#12100E] min-h-screen relative shadow-2xl overflow-x-hidden border-x border-[#1C1917]/50 flex flex-col">
        
        {view === 'home' && (
          <main className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 relative flex-1 overflow-y-auto">
            <CoffeeLineArtBg />
            <BrandLogo />
            
            <div className="px-5 mb-4 text-center z-10 relative">
              <p className="text-[10px] font-bold text-[#B3673B] tracking-widest uppercase mb-1">Temukan Tempat Terbaik</p>
              <h2 className="text-xl font-medium text-[#8C8681] leading-tight">
                Cari <span className="text-white font-bold">tempat nugas</span> & <span className="text-white font-bold">rapat</span> tanpa ribet.
              </h2>
            </div>

            <div className="bg-[#1C1917] rounded-3xl p-5 shadow-2xl border border-[#2A2624] relative z-10 mx-4">
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={16} className="text-[#E4B381]" />
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">Kebutuhan Tim</h2>
              </div>
              
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm text-[#8C8681] font-medium">Berapa Orang?</span>
                <div className="flex items-center gap-4 bg-[#12100E] rounded-full p-1 border border-[#2A2624]">
                  <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-8 h-8 rounded-full bg-[#1C1917] text-[#A8A29E] hover:text-white flex items-center justify-center font-bold pb-0.5 transition-colors">−</button>
                  <span className="text-lg font-bold text-[#E4B381] w-6 text-center">{pax}</span>
                  <button onClick={() => setPax(Math.min(50, pax + 1))} className="w-8 h-8 rounded-full bg-[#1C1917] text-[#A8A29E] hover:text-white flex items-center justify-center font-bold pb-0.5 transition-colors">+</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[ { id: 'wifi', icon: Wifi, label: 'WiFi' }, { id: 'colokan', icon: Plug, label: 'Colokan' }, { id: 'ac', icon: Snowflake, label: 'AC' } ].map(item => {
                  const isActive = facilities[item.id];
                  return (
                    <button key={item.id} onClick={() => toggleFacility(item.id)} className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-gradient-to-b from-[#2A2624] to-[#1C1917] border-[#B3673B]/50 text-[#E4B381]' : 'bg-[#12100E] border-[#2A2624] text-[#8C8681] hover:bg-[#1A1816]'}`}>
                      <item.icon size={20} className="mb-2" strokeWidth={isActive ? 2.5 : 1.5} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#12100E] rounded-xl border border-[#2A2624] relative flex items-center">
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white py-3.5 pl-4 pr-10 appearance-none focus:outline-none">
                    <option value="25000">≤ 25.000</option>
                    <option value="50000">≤ 50.000</option>
                    <option value="100000">Semua Harga</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 text-[#8C8681] pointer-events-none" />
                </div>
                <div className="bg-[#12100E] rounded-xl border border-[#2A2624] relative flex items-center">
                  <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white py-3.5 pl-4 pr-10 appearance-none focus:outline-none capitalize">
                    <option value="any">Semua Area</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 text-[#8C8681] pointer-events-none" />
                </div>
              </div>

              <button 
                onClick={handleSearch} 
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-[#E4B381] via-[#D48C5B] to-[#B3673B] text-[#12100E] font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_15px_rgba(179,103,59,0.3)] transition-opacity flex justify-center items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'}`}
              >
                <Search size={18} strokeWidth={2.5} /> {isLoading ? 'Menyiapkan Data...' : 'Cari Rekomendasi'}
              </button>
            </div>
            
            <div className="flex justify-center mt-12 mb-4">
              <button onClick={() => setView('admin_login')} className="flex items-center gap-1.5 text-[10px] font-bold text-[#2A2624] hover:text-[#5C5651] transition-colors">
                <Lock size={10} /> Partner Login
              </button>
            </div>
          </main>
        )}

        {view === 'results' && (
          <main className="animate-in fade-in slide-in-from-right-4 duration-500 pb-24 flex-1 overflow-y-auto">
            <div className="pt-8 pb-4 px-5 sticky top-0 z-40 bg-[#12100E]/90 backdrop-blur-xl border-b border-[#1C1917] flex items-center gap-3">
              <button onClick={() => setView('home')} className="w-8 h-8 bg-[#1C1917] rounded-full flex items-center justify-center text-[#8C8681] hover:text-white transition-colors border border-[#2A2624]">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Hasil Rekomendasi</h2>
                <p className="text-[10px] text-[#B3673B] font-medium">Berdasarkan kebutuhan tim Anda</p>
              </div>
            </div>

            <div className="px-4 mt-6">
              {results.length > 0 ? (
                <div className="mb-8">
                  {/* BEST MATCH CARD */}
                  <div className="bg-[#1C1917] rounded-[32px] border border-[#B3673B]/40 shadow-[0_0_30px_rgba(179,103,59,0.1)] overflow-hidden relative mb-10">
                    <div className="flex flex-col items-center justify-center pt-10 pb-8 bg-gradient-to-b from-[#1C1917] to-[#12100E] border-b border-[#2A2624]">
                      <div className="text-[11px] font-black text-[#E4B381] tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                        <Trophy size={16} className="text-[#F5D6A1]"/> BEST MATCH
                      </div>
                      <CircularScoreBadge score={results[0].score} size="xl" />
                      <div className="mt-6 text-center px-6">
                        <p className="text-[13px] text-[#A8A29E] leading-relaxed">
                          Tempat ini <span className="text-white font-bold">{results[0].score}% cocok</span> dengan preferensi tim Anda.
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-5 relative">
                      <div className="h-32 rounded-2xl overflow-hidden relative mb-4 border border-[#2A2624]">
                         <img src={results[0].image} alt={results[0].name} className="w-full h-full object-cover opacity-70" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#12100E] to-transparent"></div>
                         <div className="absolute bottom-3 left-4"><StatusBadge status={results[0].status} /></div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1 leading-tight text-center">{results[0].name}</h3>
                      <p className="text-xs text-[#8C8681] text-center mb-6">{results[0].address}</p>
                      <button onClick={() => handleViewDetail(results[0])} className="w-full bg-[#12100E] border border-[#B3673B]/50 text-[#E4B381] font-bold text-[11px] uppercase tracking-widest py-4 rounded-xl hover:bg-[#B3673B]/10 transition-colors flex justify-center items-center gap-2">
                        Lihat Detail Tempat <ArrowLeft size={14} className="rotate-180" />
                      </button>
                    </div>
                  </div>

                  {/* ALTERNATIF - TAMPILKAN SELURUH HASIL SISA */}
                  {results.length > 1 && (
                    <>
                      <h3 className="text-[11px] font-bold text-[#8C8681] uppercase tracking-widest mb-4 px-2">Alternatif Terbaik Lainnya</h3>
                      <div className="space-y-4">
                        {results.slice(1).map((place, index) => {
                          const labelData = getAlternativeLabel(place, index);
                          return (
                            <div key={place.id} onClick={() => handleViewDetail(place)} className="bg-[#1C1917] rounded-2xl border border-[#2A2624] overflow-hidden group cursor-pointer">
                              <div className={`px-4 py-1.5 ${labelData.bg} border-b border-[#2A2624]/50`}>
                                <span className={`text-[10px] font-bold tracking-widest uppercase ${labelData.color}`}>{labelData.label}</span>
                              </div>
                              <div className="p-3 flex gap-4 items-center">
                                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden relative border border-[#2A2624]">
                                  <img src={place.image} alt={place.name} className="w-full h-full object-cover opacity-60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-[#FAFAFA] truncate text-sm mb-1">{place.name}</h4>
                                  <div className="flex items-center gap-2 text-[10px] text-[#A8A29E] font-medium">
                                    <span className="flex items-center gap-1"><Wallet size={10} className="text-[#B3673B]"/> {place.budget === 0 ? 'Gratis' : `${place.budget / 1000}K`}</span>
                                    <span className="text-[#2A2624]">•</span>
                                    <span className="uppercase text-[#8C8681]">{place.status}</span>
                                  </div>
                                </div>
                                <div className="pl-3 border-l border-[#2A2624] flex flex-col items-center justify-center min-w-[50px]">
                                  <span className="text-[9px] text-[#8C8681] font-bold mb-0.5">SCORE</span>
                                  <span className={`font-black text-sm ${place.score >= 80 ? 'text-[#E4B381]' : place.score >= 60 ? 'text-[#A8A29E]' : 'text-[#8C8681]'}`}>{place.score}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 px-5">
                  <p className="text-[#8C8681] text-sm">Belum ada tempat yang cocok dengan kriteria Anda, atau database kosong.</p>
                </div>
              )}
            </div>
          </main>
        )}

        {view === 'detail' && selectedPlace && (
          <main className="animate-in fade-in slide-in-from-bottom-8 duration-500 flex-1 overflow-y-auto bg-[#12100E] flex flex-col">
            <div className="relative h-72 shrink-0">
              <img src={selectedPlace.image} alt={selectedPlace.name} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12100E] via-[#12100E]/40 to-transparent"></div>
              <button onClick={() => setView('results')} className="absolute top-6 left-4 w-10 h-10 bg-[#12100E]/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#1C1917] transition-colors border border-white/10 z-10">
                <ArrowLeft size={20} />
              </button>
              <div className="absolute bottom-0 left-0 w-full px-5 pb-5 translate-y-4">
                <div className="flex justify-between items-end mb-3">
                  <StatusBadge status={selectedPlace.status} />
                  {selectedPlace.score && (
                    <div className="bg-[#1C1917]/90 backdrop-blur-md border border-[#B3673B]/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                      <span className="text-[9px] text-[#8C8681] font-bold uppercase tracking-widest">Nongki Score</span>
                      <span className="text-lg font-black text-[#E4B381]">{selectedPlace.score}</span>
                    </div>
                  )}
                </div>
                
                {/* Judul & Cache Rating dari DB */}
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl font-black text-white leading-tight">{selectedPlace.name}</h1>
                   {selectedPlace.rating_average > 0 && (
                     <div className="flex items-center gap-1 bg-[#2A2624]/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-[#B3673B]/30 shrink-0">
                       <Star size={12} className="text-[#E4B381] fill-[#E4B381]" />
                       <span className="text-[11px] font-bold text-[#E4B381]">{selectedPlace.rating_average}</span>
                       <span className="text-[9px] text-[#A8A29E]">({selectedPlace.review_count})</span>
                     </div>
                   )}
                </div>

                <p className="text-sm text-[#A8A29E] flex items-start gap-1.5 leading-snug">
                  <MapPin size={16} className="text-[#B3673B] shrink-0 mt-0.5" />
                  {selectedPlace.address}
                </p>
              </div>
            </div>

            <div className="px-5 pt-10 pb-32 flex-1 relative">
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#1C1917] border border-[#2A2624] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-[#8C8681] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={12}/> Jam Operasional</span>
                  <span className="text-sm font-bold text-white">{selectedPlace.openHours}</span>
                </div>
                <div className="bg-[#1C1917] border border-[#2A2624] rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-[#8C8681] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12}/> Estimasi Harga</span>
                  <span className="text-sm font-bold text-white">{selectedPlace.budget === 0 ? 'Gratis' : `~Rp ${(selectedPlace.budget/1000).toFixed(0)}K / Org`}</span>
                </div>
              </div>

              {/* Deskripsi Tempat (Jika Admin Mengisi) */}
              {selectedPlace.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Tentang Tempat Ini</h3>
                  <p className="text-[#A8A29E] text-sm leading-relaxed">{selectedPlace.description}</p>
                </div>
              )}

              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Fasilitas Tersedia</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedPlace.facilities.wifi && <span className="bg-[#2A2624] text-[#D6D0CC] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"><Wifi size={14} className="text-[#E4B381]"/> WiFi Ngebut</span>}
                {selectedPlace.facilities.colokan && <span className="bg-[#2A2624] text-[#D6D0CC] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"><Plug size={14} className="text-[#E4B381]"/> Banyak Colokan</span>}
                {selectedPlace.facilities.ac && <span className="bg-[#2A2624] text-[#D6D0CC] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"><Snowflake size={14} className="text-[#E4B381]"/> Ruang Ber-AC</span>}
                <span className="bg-[#2A2624] text-[#D6D0CC] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">Maks. {selectedPlace.capacity} Orang</span>
              </div>

              {selectedPlace.breakdown && selectedPlace.breakdown.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Mengapa direkomendasikan?</h3>
                  <div className="bg-[#1C1917] rounded-2xl p-5 border border-[#2A2624]">
                    <div className="space-y-3">
                      {selectedPlace.breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          {item.met ? 
                            <CheckCircle2 size={18} className="text-[#E4B381] shrink-0 mt-0.5" /> : 
                            <XCircle size={18} className="text-[#5C5651] shrink-0 mt-0.5" />
                          }
                          <span className={item.met ? "text-[#D6D0CC] font-medium" : "text-[#5C5651] line-through"}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="fixed bottom-0 w-full max-w-md bg-gradient-to-t from-[#12100E] via-[#12100E] to-transparent pt-10 pb-6 px-5 border-x border-[#1C1917]/50">
              <a 
                // Menggunakan google_maps_url dari database, atau fallback ke pencarian nama jalan
                href={selectedPlace.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(selectedPlace.name + ' ' + selectedPlace.address)}`} 
                target="_blank" rel="noreferrer"
                className="w-full bg-[#E4B381] hover:bg-[#D48C5B] text-[#12100E] font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_15px_rgba(228,179,129,0.3)] transition-colors flex justify-center items-center gap-2"
              >
                <Navigation size={18} strokeWidth={2.5} /> Buka di Google Maps
              </a>
            </div>
          </main>
        )}

        {view === 'admin_login' && (
          <main className="flex-1 flex flex-col justify-center items-center px-6 animate-in fade-in">
            <div className="w-full max-w-xs bg-[#1C1917] p-8 rounded-3xl border border-[#2A2624] text-center">
              <Lock size={32} className="text-[#E4B381] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Admin Akses</h2>
              <p className="text-xs text-[#8C8681] mb-6">Masukkan PIN rahasia (PIN: 2026)</p>
              
              <input 
                type="password" 
                maxLength="4"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full bg-[#12100E] border border-[#2A2624] text-white text-center text-2xl tracking-[0.5em] font-bold p-4 rounded-xl mb-4 focus:outline-none focus:border-[#E4B381]"
                placeholder="••••"
              />
              <button onClick={handleAdminLogin} className="w-full bg-[#E4B381] text-[#12100E] font-bold py-3 rounded-xl hover:bg-[#D48C5B] transition-colors">
                Masuk
              </button>
              <button onClick={() => setView('home')} className="mt-4 text-[11px] text-[#8C8681] font-bold">Batal</button>
            </div>
          </main>
        )}

        {view === 'admin_dash' && (
          <main className="flex-1 flex flex-col pb-24 overflow-y-auto bg-[#12100E]">
            <div className="pt-8 pb-4 px-5 sticky top-0 z-40 bg-[#12100E]/90 backdrop-blur-xl border-b border-[#1C1917] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">Partner Dashboard</h2>
                <p className="text-[10px] text-[#E4B381] font-bold uppercase tracking-widest">{placesDB.length} Tempat Terkelola</p>
              </div>
              <button onClick={() => setView('home')} className="w-8 h-8 bg-[#1C1917] rounded-full flex items-center justify-center text-[#8C8681] hover:text-white transition-colors border border-[#2A2624]">
                <ArrowLeft size={16} />
              </button>
            </div>

            <div className="px-5 mt-6">
              <button 
                onClick={() => { setEditingPlace(null); setFormImagePreview(''); setView('admin_form'); }}
                className="w-full bg-gradient-to-r from-[#E4B381] to-[#B3673B] text-[#12100E] font-black text-sm py-4 rounded-2xl transition-all shadow-[0_4px_15px_rgba(228,179,129,0.2)] hover:shadow-[0_4px_20px_rgba(228,179,129,0.4)] flex justify-center items-center gap-2 mb-8"
              >
                <Plus size={18} strokeWidth={2.5} /> Tambah Tempat Baru
              </button>

              <h3 className="text-xs font-bold text-[#8C8681] uppercase tracking-widest mb-4">Daftar Tempat Database</h3>
              
              <div className="space-y-4">
                {placesDB.map((place) => (
                  <div key={place.id} className="bg-[#1C1917] p-4 rounded-2xl border border-[#2A2624] flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                      <img src={place.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#2A2624]" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{place.name}</h4>
                        <p className="text-[10px] text-[#8C8681] truncate mt-0.5">{place.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingPlace(place); setFormImagePreview(place.cover_image_url || ''); setView('admin_form'); }} className="w-8 h-8 bg-[#2A2624] rounded-xl flex items-center justify-center text-[#E4B381] hover:bg-[#E4B381] hover:text-[#12100E] transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeletePlace(place.id)} className="w-8 h-8 bg-[#2A2624] rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[#2A2624]">
                      <span className="text-[11px] font-bold text-[#8C8681] uppercase tracking-wider">Status Keramaian</span>
                      <div className="bg-[#12100E] rounded-lg border border-[#2A2624] p-1 flex gap-1">
                        {[
                          { val: 'sepi', label: '🟢 Sepi' },
                          { val: 'normal', label: '🟡 Normal' },
                          { val: 'ramai', label: '🔴 Ramai' }
                        ].map(st => (
                          <button
                            key={st.val}
                            onClick={() => handleStatusChange(place.id, st.val)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${place.status === st.val ? 'bg-[#2A2624] text-white shadow-sm' : 'text-[#5C5651] hover:text-[#8C8681]'}`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {placesDB.length === 0 && !isLoading && (
                  <div className="text-center py-10 text-[#8C8681] text-sm">Database masih kosong.<br/>Silakan isi tabel Anda di Supabase.</div>
                )}
              </div>
            </div>
          </main>
        )}

        {view === 'admin_form' && (
          <main className="flex-1 flex flex-col pb-10 overflow-y-auto bg-[#12100E]">
            <div className="pt-8 pb-4 px-5 sticky top-0 z-40 bg-[#12100E]/90 backdrop-blur-xl border-b border-[#1C1917] flex items-center gap-3">
              <button onClick={() => setView('admin_dash')} className="w-8 h-8 bg-[#1C1917] rounded-full flex items-center justify-center text-[#8C8681] hover:text-white transition-colors border border-[#2A2624]">
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">{editingPlace ? 'Edit Tempat' : 'Tambah Tempat Baru'}</h2>
            </div>

            <form onSubmit={handleSavePlace} className="px-5 mt-6 space-y-6">
              
              <div className="space-y-4 bg-[#1C1917] p-5 rounded-3xl border border-[#2A2624] shadow-lg">
                <h3 className="text-[11px] font-bold text-[#E4B381] uppercase tracking-widest flex items-center gap-2">
                   Info Dasar
                </h3>
                
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Nama Tempat</label>
                  <input required name="name" defaultValue={editingPlace?.name || ''} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" placeholder="Kopi Nalar" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Alamat Lengkap</label>
                  <input required name="address" defaultValue={editingPlace?.address || ''} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" placeholder="Jl. Sudirman No. 12" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">URL Foto Cover (Opsional)</label>
                  <input name="image" value={formImagePreview} onChange={(e) => setFormImagePreview(e.target.value)} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" placeholder="Kosongkan untuk pakai foto otomatis" />
                  <div className="mt-3 h-24 rounded-lg overflow-hidden border border-[#2A2624]">
                    <img src={formImagePreview || FALLBACK_IMAGE} alt="Preview" className="w-full h-full object-cover opacity-70" />
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-[#1C1917] p-5 rounded-3xl border border-[#2A2624] shadow-lg">
                <h3 className="text-[11px] font-bold text-[#E4B381] uppercase tracking-widest">Operasional & Harga</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Kapasitas Maks.</label>
                    <div className="relative">
                      <input required type="number" min="1" name="capacity" defaultValue={editingPlace?.capacity || 20} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 pr-10 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" />
                      <Users size={16} className="absolute right-4 top-4 text-[#5C5651]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Budget / Orang</label>
                    <div className="relative">
                      <input required type="number" min="0" name="budget" defaultValue={editingPlace?.budget || 25000} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 pl-10 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" />
                      <span className="absolute left-4 top-4 text-[#5C5651] font-bold text-sm">Rp</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Jam Buka</label>
                  <div className="relative">
                    <input required name="openHours" defaultValue={editingPlace?.openHours || '08:00 - 22:00 WIB'} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 pl-10 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors" />
                    <Clock size={16} className="absolute left-4 top-4 text-[#5C5651]" />
                  </div>
                </div>
                
                <div>
                    <label className="block text-[11px] font-bold text-[#8C8681] mb-2 uppercase tracking-wider">Status Awal</label>
                    <select name="status" defaultValue={editingPlace?.status || 'normal'} className="w-full bg-[#12100E] border border-[#2A2624] text-white p-4 rounded-xl text-sm focus:outline-none focus:border-[#E4B381] transition-colors appearance-none">
                      <option value="sepi">🟢 Sepi (Banyak kursi kosong)</option>
                      <option value="normal">🟡 Normal (Ada beberapa kursi)</option>
                      <option value="ramai">🔴 Ramai (Hampir penuh)</option>
                    </select>
                </div>
              </div>

              <div className="space-y-4 bg-[#1C1917] p-5 rounded-3xl border border-[#2A2624] shadow-lg">
                <h3 className="text-[11px] font-bold text-[#E4B381] uppercase tracking-widest">Fasilitas Database</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <label className="cursor-pointer group">
                    <input type="checkbox" name="wifi" defaultChecked={editingPlace ? editingPlace.has_wifi : true} className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#2A2624] bg-[#12100E] peer-checked:bg-[#B3673B]/20 peer-checked:border-[#E4B381] peer-checked:text-[#E4B381] text-[#5C5651] transition-all">
                      <Wifi size={20} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">WiFi</span>
                    </div>
                  </label>
                  
                  <label className="cursor-pointer group">
                    <input type="checkbox" name="colokan" defaultChecked={editingPlace ? editingPlace.has_power_outlet : true} className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#2A2624] bg-[#12100E] peer-checked:bg-[#B3673B]/20 peer-checked:border-[#E4B381] peer-checked:text-[#E4B381] text-[#5C5651] transition-all">
                      <Plug size={20} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Colokan</span>
                    </div>
                  </label>

                  <label className="cursor-pointer group">
                    <input type="checkbox" name="ac" defaultChecked={editingPlace ? editingPlace.has_ac : false} className="peer hidden" />
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#2A2624] bg-[#12100E] peer-checked:bg-[#B3673B]/20 peer-checked:border-[#E4B381] peer-checked:text-[#E4B381] text-[#5C5651] transition-all">
                      <Snowflake size={20} className="mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">AC</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4 bg-[#1C1917] p-5 rounded-3xl border border-[#2A2624] shadow-lg mb-8">
                <h3 className="text-[11px] font-bold text-[#E4B381] uppercase tracking-widest">Kategori Area Database</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer group">
                    <input type="checkbox" name="area_indoor" defaultChecked={editingPlace ? editingPlace.area_indoor : true} className="peer hidden" />
                    <div className="flex items-center gap-3 p-3 w-full rounded-xl border border-[#2A2624] bg-[#12100E] peer-checked:bg-[#B3673B]/20 peer-checked:border-[#E4B381] peer-checked:text-[#E4B381] text-[#5C5651] transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider mx-auto">Area Indoor</span>
                    </div>
                  </label>

                  <label className="cursor-pointer group">
                    <input type="checkbox" name="area_outdoor" defaultChecked={editingPlace ? editingPlace.area_outdoor : false} className="peer hidden" />
                    <div className="flex items-center gap-3 p-3 w-full rounded-xl border border-[#2A2624] bg-[#12100E] peer-checked:bg-[#B3673B]/20 peer-checked:border-[#E4B381] peer-checked:text-[#E4B381] text-[#5C5651] transition-all">
                      <span className="text-[10px] font-bold uppercase tracking-wider mx-auto">Area Outdoor</span>
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-[#E4B381] to-[#B3673B] text-[#12100E] font-black text-sm uppercase tracking-widest py-4 rounded-2xl hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-[0_4px_15px_rgba(228,179,129,0.3)]">
                <Save size={18} strokeWidth={2.5} /> Simpan Data Database
              </button>
            </form>
          </main>
        )}
      </div>
    </div>
  );
}
