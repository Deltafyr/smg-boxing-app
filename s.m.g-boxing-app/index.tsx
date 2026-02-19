import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, getDocs, deleteDoc, updateDoc, orderBy
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity, AlertTriangle,
  LogIn, UserPlus, Fingerprint, ChevronRight, Sword, Medal,
  Calendar, Info, Target, DownloadCloud, ClipboardCheck,
  FileBadge, Box, X, Save, Edit3, Settings, MapPin, Hash, Trash2, Award,
  CheckSquare, Square, Scale, History, Plus, ChevronUp, ChevronDown
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ARMAND (SYSTÈME RÉEL) ---
const firebaseConfig = {
  apiKey: "AIzaSyBn56Ylv05xEJtStcmqb2CpjPr1IoqxQLY",
  authDomain: "smg-boxing-club.firebaseapp.com",
  projectId: "smg-boxing-club",
  storageBucket: "smg-boxing-club.firebasestorage.app",
  messagingSenderId: "680615984001",
  appId: "1:680615984001:web:9147a52aa9e602fd694680",
  measurementId: "G-Y4W98BNTHN"
};

// Détection d'environnement pour éviter les erreurs de clé API dans l'aperçu
const getActiveConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return firebaseConfig;
};

const activeConfig = getActiveConfig();
const app = getApps().length === 0 ? initializeApp(activeConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smg-boxing-club';

// URL de ton Google Apps Script
const SHOGUN_API_URL = "https://script.google.com/macros/s/AKfycbz.../exec";

// --- UTILS : LOGIQUE FFKMDA ---
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
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-10 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900 z-10 py-2">
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
  const [error, setError] = useState<string | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [inputText, setInputText] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Authentification
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        console.error("Auth init error:", e.message);
        setError("Erreur Firebase : " + e.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setLoading(false); setProfile(null); }
    });
    return () => unsubscribe();
  }, []);

  // 2. Synchronisation Cloud
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    const unsubProfile = onSnapshot(doc(db, ...path, 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        setError(null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => { console.error("Sync Error:", err); setLoading(false); });

    const unsubChat = onSnapshot(collection(db, ...path, 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    onSnapshot(collection(db, ...path, 'members'), s => setMembers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, ...path, 'fights'), s => setFights(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, ...path, 'agenda'), s => setAgenda(s.docs.map(d => ({id: d.id, ...d.data()}))));
    onSnapshot(collection(db, ...path, 'announcements'), s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.timestamp - a.timestamp)));
    onSnapshot(collection(db, ...path, 'competitions'), s => {
        const comps = s.docs.map(d => ({id: d.id, ...d.data()}));
        setCompetitions(comps.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        if (!selectedCompId && comps.length > 0) setSelectedCompId(comps[0].id);
    });

    return () => { unsubProfile(); unsubChat(); };
  }, [user, selectedCompId]);

  // 3. Moteur Timer Pro
  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      if (!isResting) { setIsResting(true); setSeconds(60); }
      else { setIsResting(false); setSeconds(180); setCurrentRound((r) => r + 1); }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isResting]);

  useEffect(() => { if(view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, view]);

  // --- ACTIONS ---

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true); setError(null);
    const f = new FormData(e.currentTarget);
    const fn = f.get('fn')?.toString().trim();
    const ph = f.get('ph')?.toString().trim();
    const ln = f.get('ln')?.toString().trim();

    try {
      if (authMode === 'login') {
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'members');
        const snap = await getDocs(q);
        const existing = snap.docs.find(d => d.data().firstName?.toLowerCase() === fn?.toLowerCase() && d.data().phone === ph);
        if (existing) {
          const data = existing.data();
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), { ...data, lastSeen: serverTimestamp() });
          if (existing.id !== user.uid) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', existing.id));
        } else {
          setError("Profil introuvable."); setIsSubmitting(false);
        }
      } else {
        if (!ln) { setError("Le nom est requis."); setIsSubmitting(false); return; }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
          firstName: fn, lastName: ln, phone: ph, role: 'Member', category: 'Loisir', birthDate: new Date(f.get('bd')?.toString() || ""),
          joinedAt: serverTimestamp(), isMedicalOk: false, palmares: { wins: 0, losses: 0, draws: 0 },
          authorizations: { imageRights: true, transportParental: true, emergencySurgery: true }
        });
      }
    } catch (err) { setError("Erreur réseau Cloud."); setIsSubmitting(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    const text = inputText; setInputText('');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), { text, uid: user.uid, sender: profile?.firstName || 'Elite', timestamp: Date.now() });
  };

  const scanFFKMDA = async () => {
    setIsSubmitting(true);
    try { await fetch(`${SHOGUN_API_URL}?action=AUTO_SCAN_PLANNING`); } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60); const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDU ---

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono p-10">
      <Skull size={64} className="text-cyan-500 animate-pulse mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]" />
      <h1 className="text-white font-black text-xl tracking-widest uppercase text-center leading-relaxed">SMG CORE INITIALIZED</h1>
      <p className="text-cyan-800 text-[10px] mt-4 animate-bounce uppercase tracking-[0.3em]">Kernel_v44_Ready</p>
    </div>
  );

  const renderAuth = () => (
    <div className="p-8 space-y-8 animate-in fade-in pb-32 h-screen overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center mt-12">
        <div className="p-6 bg-cyan-500/10 rounded-[3rem] border border-cyan-500/20 mb-6 shadow-2xl relative">
          <Fingerprint size={56} className="text-cyan-500 relative z-10" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center tracking-tighter">
          {authMode === 'login' ? 'Connexion' : 'Inscription'}<br/>
          <span className="text-cyan-500 text-xl font-bold not-italic tracking-[0.3em] uppercase">S.M.G Boxe</span>
        </h1>
      </div>
      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-[11px] font-bold uppercase animate-shake"><AlertTriangle size={18} /> {error}</div>}
      <form onSubmit={handleAuth} className="space-y-4">
        <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
        {authMode === 'register' && (
          <>
            <input name="ln" placeholder="Nom de famille" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
            <div className="space-y-1">
               <label className="text-[9px] text-slate-500 uppercase font-bold px-1 tracking-widest">Date de naissance</label>
               <input name="bd" type="date" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400 outline-none" required />
            </div>
          </>
        )}
        <input name="ph" placeholder="N° de Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none" required disabled={isSubmitting} />
        <button type="submit" disabled={isSubmitting} className={`w-full p-5 rounded-2xl font-black text-white uppercase text-sm tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-6 ${isSubmitting ? 'bg-slate-800 opacity-50' : 'bg-cyan-600 shadow-cyan-900/40'}`}>
          {isSubmitting ? <Activity className="animate-spin" size={20} /> : (authMode === 'login' ? <LogIn size={20}/> : <UserPlus size={20}/>)}
          {isSubmitting ? 'CHRONOS_SYNC...' : (authMode === 'login' ? 'Entrer dans l\'arène' : 'Initialiser Profil')}
        </button>
      </form>
      <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }} className="w-full text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-cyan-400 transition-colors py-2">
        {authMode === 'login' ? "Nouveau membre ? S'inscrire" : "Déjà membre ? Se connecter"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900 relative shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {!profile ? renderAuth() : (
            <div className="pb-32">
              {view === 'home' && (
                <div className="p-5 space-y-6 animate-in fade-in">
                  <header className="flex justify-between items-start py-8 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full"></div>
                    <div>
                      <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none tracking-tighter">SMG <span className="text-cyan-500">Boxe</span></h1>
                      <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2 font-bold">Coach {profile?.firstName} • BMF2 Master</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"><Skull size={24} className="text-cyan-500" /></div>
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
                       <div className="flex items-center gap-3"><Users size={18} className="text-slate-500 group-hover:text-cyan-400" /><span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Athlètes SMG</span></div>
                       <ChevronRight size={14} className="text-slate-700" />
                    </button>
                    <button onClick={() => setView('calendar')} className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-purple-500/50 transition-all active:scale-[0.98]">
                       <div className="flex items-center gap-3"><Calendar size={18} className="text-purple-500" /><span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Agenda Club</span></div>
                       <ChevronRight size={14} className="text-slate-700" />
                    </button>
                  </section>

                  <div className="flex items-center justify-between p-4 bg-blue-900/5 border border-blue-900/10 rounded-2xl opacity-30">
                    <div className="flex items-center gap-3"><Box size={16} className="text-blue-500" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Renault Trucks Logistics</span></div>
                    <span className="text-[8px] text-blue-900 font-black">VÉNISSIEUX_HUB</span>
                  </div>
                </div>
              )}

              {view === 'tournament' && (
                  <TournamentModule 
                    profile={profile} members={members} competitions={competitions} fights={fights} 
                    selectedCompId={selectedCompId} setSelectedCompId={setSelectedCompId}
                    onNavigate={() => setView('home')} isSyncing={isSubmitting}
                  />
              )}

              {view === 'timer' && (
                <div className="p-6 h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 min-h-[80vh]">
                  <h2 className="text-3xl font-black italic text-white uppercase mb-8 tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
                  <div className={`w-72 h-72 rounded-full border-[15px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 shadow-rose-500/20'}`}>
                    {isActive && <div className={`absolute inset-0 rounded-full border-2 animate-ping ${isResting ? 'border-cyan-500/20' : 'border-rose-500/20'}`}></div>}
                    <div className="text-7xl font-black text-white font-mono tracking-tighter">{formatTime(seconds)}</div>
                    <div className={`text-xs font-black mt