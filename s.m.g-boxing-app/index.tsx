import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, getDocs, deleteDoc, updateDoc
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity, AlertTriangle,
  LogIn, UserPlus, Fingerprint, ChevronRight, Sword, Medal,
  Calendar, Info, Target, DownloadCloud, ClipboardCheck,
  FileBadge, Box, X, Save, History, Scale, Hash
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ARMAND (VERSION STABLE) ---
const firebaseConfig = {
  apiKey: "AIzaSyBn56Ylv05xEJtStcmqb2CpjPr1IoqxQLY",
  authDomain: "smg-boxing-club.firebaseapp.com",
  projectId: "smg-boxing-club",
  storageBucket: "smg-boxing-club.firebasestorage.app",
  messagingSenderId: "680615984001",
  appId: "1:680615984001:web:9147a52aa9e602fd694680",
  measurementId: "G-Y4W98BNTHN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'smg-boxing-club';

// URL de ton Google Apps Script (Proxy FFKMDA)
const SHOGUN_API_URL = "https://script.google.com/macros/s/AKfycbz.../exec";

// --- UTILS : LOGIQUE FFKMDA & AGES ---
const getFFKMDACategory = (birthDate: any) => {
  if (!birthDate) return { age: '?', cat: 'N/C' };
  const date = birthDate.seconds ? new Date(birthDate.seconds * 1000) : new Date(birthDate);
  const age = 2026 - date.getFullYear();
  let cat = "Senior";
  if (age >= 41) cat = "Vétéran";
  else if (age >= 19) cat = "Senior";
  else if (age >= 17) cat = "Junior";
  else if (age >= 15) cat = "Cadet";
  else if (age >= 13) cat = "Minime";
  else if (age >= 11) cat = "Benjamin";
  else cat = "Poussin";
  return { age, cat };
};

// --- COMPOSANTS UI CYBERPUNK ---

const FuturisticCard = ({ children, className = '', title, borderColor = 'slate', onClick }: any) => {
  const borderColors: any = {
    cyan: 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    rose: 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]',
    gold: 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]',
    slate: 'border-slate-800',
  };
  const accent = borderColor === 'cyan' ? 'border-cyan-400' : borderColor === 'rose' ? 'border-rose-400' : borderColor === 'gold' ? 'border-yellow-500' : 'border-slate-600';

  return (
    <div onClick={onClick} className={`relative bg-slate-900/80 backdrop-blur-md border ${borderColors[borderColor] || borderColors.slate} rounded-2xl p-4 transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${accent}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${accent}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${accent}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${accent}`} />
      {title && <h3 className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-3 border-b border-slate-800/50 pb-1">{title}</h3>}
      {children}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [view, setView] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer States
  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Authentification (Strict Armand Logic)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth init error:", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Synchronisation Cloud Temps Réel
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        setError(null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Sync Error:", err);
      setLoading(false);
    });

    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (s) => {
      setMembers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubFights = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'fights'), (s) => {
      setFights(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubProfile(); unsubChat(); unsubMembers(); unsubFights(); };
  }, [user]);

  // 3. Moteur Timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      if (!isResting) {
        setIsResting(true);
        setSeconds(60);
      } else {
        setIsResting(false);
        setSeconds(180);
        setCurrentRound((r) => r + 1);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isResting]);

  useEffect(() => { 
    if(view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, view]);

  // --- ACTIONS (REPRISE DU CODE STABLE ARMAND) ---

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("Système non initialisé. Patiente un instant.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const f = new FormData(e.currentTarget);
    const fn = f.get('fn')?.toString().trim();
    const ph = f.get('ph')?.toString().trim();
    const ln = f.get('ln')?.toString().trim();

    try {
      if (authMode === 'login') {
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'members');
        const snap = await getDocs(q);
        const existing = snap.docs.find(d => 
          d.data().firstName?.toLowerCase() === fn?.toLowerCase() && 
          d.data().phone === ph
        );

        if (existing) {
          const data = existing.data();
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
            ...data,
            lastSeen: serverTimestamp()
          });
          if (existing.id !== user.uid) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', existing.id));
          }
        } else {
          setError("Profil introuvable. Vérifie tes informations ou inscris-toi.");
          setIsSubmitting(false);
        }
      } else {
        if (!ln) { setError("Le nom de famille est requis."); setIsSubmitting(false); return; }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
          firstName: fn, lastName: ln, phone: ph, role: 'member', category: 'Compétiteur',
          birthDate: new Date(f.get('bd')?.toString() || ""),
          joinedAt: serverTimestamp(), isMedicalOk: false,
          authorizations: { imageRights: true, transportParental: true, emergencySurgery: true },
          palmares: { wins: 0, losses: 0, draws: 0 }
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError("Erreur réseau Cloud. Vérifie ta connexion.");
      setIsSubmitting(false);
    }
  };

  const scanFFKMDA = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${SHOGUN_API_URL}?action=AUTO_SCAN_PLANNING`);
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    const text = inputText;
    setInputText('');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        text, uid: user.uid, sender: profile?.firstName || 'Boxeur', timestamp: Date.now()
      });
    } catch (e) { setInputText(text); }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDU ---

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono p-10">
      <Skull size={64} className="text-cyan-500 animate-pulse mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]" />
      <h1 className="text-white font-black text-xl tracking-widest uppercase text-center leading-relaxed">SMG CORE INITIALIZED</h1>
      <p className="text-cyan-800 text-[10px] mt-2 animate-bounce uppercase tracking-[0.3em]">Kernel_v38_Stable</p>
    </div>
  );

  const renderAuth = () => (
    <div className="p-8 space-y-8 animate-in fade-in pb-32 h-screen overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center mt-12">
        <div className="p-6 bg-cyan-500/10 rounded-[3rem] border border-cyan-500/20 mb-6 shadow-2xl relative">
          <Fingerprint size={56} className="text-cyan-500 relative z-10" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center tracking-tighter">
          {authMode === 'login' ? 'Accès Club' : 'Elite Boxe'}<br/>
          <span className="text-cyan-500 text-xl font-bold not-italic tracking-[0.3em] uppercase">S.M.G BOXING</span>
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-[11px] font-bold uppercase animate-shake">
          <AlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-3">
           <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
           {authMode === 'register' && (
             <>
               <input name="ln" placeholder="Nom de famille" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
               <div className="space-y-1">
                 <label className="text-[9px] text-slate-500 uppercase font-bold px-1 tracking-widest">Date de Naissance</label>
                 <input name="bd" type="date" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400 outline-none focus:border-cyan-500" required disabled={isSubmitting} />
               </div>
             </>
           )}
           <input name="ph" placeholder="N° de Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`w-full p-5 rounded-2xl font-black text-white uppercase text-sm tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-6 ${isSubmitting ? 'bg-slate-800 opacity-50' : 'bg-cyan-600 shadow-cyan-900/40'}`}
        >
          {isSubmitting ? <Activity className="animate-spin" size={20} /> : (authMode === 'login' ? <LogIn size={20}/> : <UserPlus size={20}/>)}
          {isSubmitting ? 'TRAITEMENT...' : (authMode === 'login' ? 'Entrer dans l\'arène' : 'Initialiser Profil')}
        </button>
      </form>

      <div className="text-center pt-4">
        <button 
          onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }} 
          className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          {authMode === 'login' ? "Nouveau membre ? S'inscrire" : "Déjà membre ? Se connecter"}
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="p-5 space-y-6 pb-28 animate-in fade-in">
      <header className="flex justify-between items-start py-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full"></div>
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none tracking-tighter">SMG <span className="text-cyan-500">Boxe</span></h1>
          <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2 tracking-widest font-bold">Coach {profile?.firstName} • BMF2 Master</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <Skull size={24} className="text-cyan-500" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-8 group active:scale-95 transition-all">
          <TimerIcon size={36} className="text-cyan-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Training</span>
        </FuturisticCard>
        <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-8 group active:scale-95 transition-all">
          <MessageSquare size={36} className="text-rose-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span>
        </FuturisticCard>
        <FuturisticCard borderColor="gold" onClick={() => setView('tournament')} className="flex flex-col items-center gap-4 py-8 col-span-2 group active:scale-95 transition-all">
          <Trophy size={32} className="text-yellow-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Arène Elite & FFKMDA</span>
        </FuturisticCard>
      </div>

      <section className="space-y-3">
        <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] px-1">Accès Noyau</h3>
        <button onClick={() => setView('roster')} className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-cyan-500/50 transition-all active:scale-[0.98]">
           <div className="flex items-center gap-3">
             <Users size={18} className="text-slate-500 group-hover:text-cyan-400" />
             <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Athlètes SMG</span>
           </div>
           <ChevronRight size={14} className="text-slate-700" />
        </button>
      </section>

      <div className="flex items-center justify-between p-4 bg-blue-900/5 border border-blue-900/10 rounded-2xl opacity-30">
        <div className="flex items-center gap-3"><Box size={16} className="text-blue-500" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Renault Trucks Logistics</span></div>
        <span className="text-[8px] text-blue-900 font-black">VÉNISSIEUX_HUB</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {!profile ? renderAuth() : (
            <div className="pb-32">
              {view === 'home' && renderHome()}
              
              {view === 'timer' && (
                <div className="p-6 h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 min-h-[85vh]">
                  <h2 className="text-3xl font-black italic text-white uppercase mb-8 tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
                  <div className={`w-72 h-72 rounded-full border-[15px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 shadow-rose-500/20'}`}>
                    {isActive && <div className={`absolute inset-0 rounded-full border-2 animate-ping ${isResting ? 'border-cyan-500/20' : 'border-rose-500/20'}`}></div>}
                    <div className="text-7xl font-black text-white font-mono tracking-tighter">{formatTime(seconds)}</div>
                    <div className={`text-xs font-black mt-3 uppercase tracking-widest ${isResting ? 'text-cyan-400' : 'text-rose-500'}`}>{isResting ? 'REPOS' : `Round ${currentRound}`}</div>
                  </div>
                  <div className="flex gap-4 w-full max-w-xs mt-12">
                    <button onClick={() => setIsActive(!isActive)} className={`flex-1 p-5 rounded-3xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all ${isActive ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-black'}`}>
                      {isActive ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={() => { setIsActive(false); setSeconds(180); setCurrentRound(1); setIsResting(false); }} className="p-5 border border-slate-800 rounded-3xl text-slate-400 hover:text-white transition-all"><RotateCcw/></button>
                  </div>
                  <button onClick={() => setView('home')} className="text-slate-600 text-[10px] font-bold uppercase mt-12 flex items-center gap-2 hover:text-cyan-500 transition-colors"><ArrowLeft size={12}/> Retour</button>
                </div>
              )}

              {view === 'chat' && (
                <div className="flex flex-col h-screen pb-20 bg-slate-950 animate-in slide-in-from-right-4">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-20 shadow-lg">
                    <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-xl text-cyan-500"><ArrowLeft size={20}/></button>
                    <div><h2 className="text-white font-bold text-sm leading-none">Club Chat</h2><span className="text-[9px] text-cyan-400 font-mono mt-1 block tracking-tighter">Sync Cloud Active</span></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((m: any) => (
                      <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.uid === user.uid ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                          {m.uid !== user.uid && <div className="text-[9px] text-cyan-500 mb-1 font-black uppercase tracking-tighter">{m.sender}</div>}
                          <div className="leading-relaxed">{m.text}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 sticky bottom-0">
                    <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500 transition-all" />
                    <button type="submit" className="bg-cyan-600 p-2.5 rounded-full text-white shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
                  </form>
                </div>
              )}

              {view === 'tournament' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-yellow-500 shadow-lg"><ArrowLeft size={18}/></button>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none tracking-tighter">Arene <span className="text-yellow-500">Elite</span></h2>
                    <button onClick={scanFFKMDA} disabled={isSubmitting} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-cyan-500 active:scale-90 transition-all">
                      <DownloadCloud size={18} className={isSubmitting ? 'animate-bounce' : ''} />
                    </button>
                  </div>
                  
                  <FuturisticCard title="MODE HYBRIDE ACTIF" borderColor="gold" className="py-3">
                     <p className="text-[9px] text-slate-400 italic">Cliquez sur un combat pour forcer les détails manuellement (Aires, coins).</p>
                  </FuturisticCard>

                  <div className="space-y-3">
                    {fights.map(f => (
                      <FuturisticCard key={f.id} borderColor={f.coin === 'Rouge' ? 'rose' : 'cyan'} onClick={() => setSelectedFight(f)} className="flex items-center justify-between group active:bg-slate-800">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-white border border-slate-700 shadow-inner">
                               {f.numCombat || "?"}
                            </div>
                            <div>
                               <div className="text-sm font-black text-white uppercase leading-none">{f.nomCombattant}</div>
                               <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">AIRE {f.aire}</span>
                                  <span className={f.coin === 'Rouge' ? 'text-rose-500' : 'text-cyan-400'}>COIN {f.coin}</span>
                               </div>
                            </div>
                         </div>
                         <div className={`text-[10px] font-black uppercase ${f.resultat === 'Victoire' ? 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-slate-600'}`}>
                            {f.resultat || "Attente"}
                         </div>
                      </FuturisticCard>
                    ))}
                    {fights.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                         <Skull size={40} className="mx-auto text-slate-800 mb-4" />
                         <p className="text-slate-700 italic uppercase text-[10px] font-black tracking-widest">Aucun planning détecté</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'roster' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32 h-full">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-cyan-500 shadow-lg"><ArrowLeft size={18}/></button>
                      <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">Roster <span className="text-cyan-500">SMG</span></h2>
                   </div>
                   <div className="space-y-3 overflow-y-auto pr-1">
                      {members.map(m => {
                         const { age, cat } = getFFKMDACategory(m.birthDate);
                         return (
                           <FuturisticCard key={m.id} borderColor={m.role === 'Admin' ? 'rose' : 'slate'} className="flex justify-between items-center py-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-cyan-500 font-black border border-slate-800 shadow-xl">{m.firstName?.charAt(0)}</div>
                                 <div>
                                    <div className="text-sm font-bold text-white uppercase tracking-tight leading-none">{m.firstName} {m.lastName}</div>
                                    <div className="flex gap-2 mt-2">
                                       <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">{cat}</span>
                                       <span className="text-[8px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{age} ANS</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 {m.isMedicalOk ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-rose-500 animate-pulse" />}
                                 <ChevronRight size={14} className="text-slate-800" />
                              </div>
                           </FuturisticCard>
                         );
                      })}
                   </div>
                </div>
              )}

              {view === 'profile' && (
                <div className="p-8 space-y-8 animate-in fade-in pb-32 text-center">
                   <div className="relative inline-block mx-auto mt-10">
                      <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-10"></div>
                      <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-4xl font-black shadow-2xl relative shadow-cyan-900/40 text-white italic">
                        {profile?.firstName?.charAt(0)}
                      </div>
                   </div>
                   <div><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{profile?.firstName} {profile?.lastName}</h2><p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.3em]">{profile?.role} • BOXEUR ELITE</p></div>
                   
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                         <div className="text-[10px] text-green-500 font-black">W</div>
                         <div className="text-xl font-black text-white">{profile?.palmares?.wins || 0}</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                         <div className="text-[10px] text-rose-500 font-black">L</div>
                         <div className="text-xl font-black text-white">{profile?.palmares?.losses || 0}</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                         <div className="text-[10px] text-slate-500 font-black">D</div>
                         <div className="text-xl font-black text-white">{profile?.palmares?.draws || 0}</div>
                      </div>
                   </div>

                   <FuturisticCard title="PALMARÈS FINAL" borderColor="gold">
                      <div className="flex items-center gap-4 text-left">
                         <Medal size={32} className="text-yellow-500 shrink-0" />
                         <div>
                            <div className="text-xs font-bold text-white uppercase tracking-tighter">Historique de Combat</div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">Les résultats officiels FFKMDA sont synchronisés après chaque tournoi.</p>
                         </div>
                      </div>
                   </FuturisticCard>

                   <button onClick={() => signOut(auth)} className="w-full p-5 bg-rose-950/20 border border-rose-900/30 rounded-3xl flex justify-between items-center text-rose-500 active:scale-95 transition-all mt-6 font-black uppercase text-[10px] tracking-widest">
                     <span>Détruire la session</span>
                     <LogOut size={16}/>
                   </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* MODAL EDITION MANUELLE SHOGUN */}
        <Modal isOpen={!!selectedFight} onClose={() => setSelectedFight(null)} title="Détails Combat Shogun">
           <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><MapPin size={10}/> Aire</label>
                    <input defaultValue={selectedFight?.aire} id="m_aire" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-yellow-500 shadow-inner" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><Hash size={10}/> Combat N°</label>
                    <input defaultValue={selectedFight?.numCombat} id="m_num" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-yellow-500 shadow-inner" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Résultat Direct</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateFightManual(selectedFight.id, { resultat: 'Victoire' })} className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl text-green-500 font-bold text-xs uppercase hover:bg-green-500/10">Victoire</button>
                    <button onClick={() => updateFightManual(selectedFight.id, { resultat: 'Défaite' })} className="p-3 bg-rose-900/20 border border-rose-500/30 rounded-xl text-rose-500 font-bold text-xs uppercase hover:bg-rose-500/10">Défaite</button>
                 </div>
              </div>
              <button 
                onClick={async () => {
                  const updates = {
                    aire: (document.getElementById('m_aire') as HTMLInputElement).value,
                    numCombat: (document.getElementById('m_num') as HTMLInputElement).value
                  };
                  await updateFightManual(selectedFight.id, updates);
                }}
                className="w-full p-5 bg-yellow-600 rounded-2xl font-black uppercase text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <Save size={20}/> Sauvegarder Shogun
              </button>
           </div>
        </Modal>

        {profile && view !== 'chat' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-600'}`}><HomeIcon size={24}/></button>
             <button onClick={() => setView('tournament')} className={`p-3 rounded-2xl transition-all ${view === 'tournament' ? 'text-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-slate-600'}`}><Trophy size={24}/></button>
             <button onClick={() => setView('timer')} className={`p-3 rounded-2xl transition-all ${view === 'timer' ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-600'}`}><TimerIcon size={24}/></button>
             <button onClick={() => setView('profile')} className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-600'}`}><UserIcon size={24}/></button>
          </nav>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0ea5e9; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

const updateFightManual = async (fightId: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fights', fightId), updates);
    // Envoi vers ton Google Apps Script
    await fetch(SHOGUN_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'UPDATE_FULL_DETAILS', fightId, ...updates })
    });
  } catch (e) { console.error(e); }
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}

export default App;