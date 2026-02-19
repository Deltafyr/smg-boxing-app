import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, getDocs, deleteDoc, updateDoc, orderBy, limit
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity, AlertTriangle,
  LogIn, UserPlus, Fingerprint, ChevronRight, Sword, Medal,
  Calendar, Info, Target, DownloadCloud, ClipboardCheck,
  FileBadge, Box, X, Save, Edit3, Settings, MapPin, Hash, Trash2, History, Scale,
  CheckSquare, Square, XCircle, Award
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

// URL de ton Google Apps Script (Shogun Engine V81)
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
  
  // Collections States
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  
  // UI States
  const [inputText, setInputText] = useState('');
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer States
  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Authentification (Reprise stricte base Armand)
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error("Auth init error:", e); }
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
    
    const unsubProfile = onSnapshot(doc(db, ...path, 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        setError(null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const unsubChat = onSnapshot(collection(db, ...path, 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    const unsubMembers = onSnapshot(collection(db, ...path, 'members'), (s) => setMembers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubFights = onSnapshot(collection(db, ...path, 'fights'), (s) => setFights(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubAgenda = onSnapshot(collection(db, ...path, 'agenda'), (s) => setAgenda(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTourneys = onSnapshot(collection(db, ...path, 'competitions'), (s) => {
        const comps = s.docs.map(d => ({id: d.id, ...d.data()}));
        setCompetitions(comps.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        if (!selectedCompId && comps.length > 0) setSelectedCompId(comps[0].id);
    });

    return () => { unsubProfile(); unsubChat(); unsubMembers(); unsubFights(); unsubAgenda(); unsubTourneys(); };
  }, [user, selectedCompId]);

  // 3. Moteur Timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      if (!isResting) {
        setIsResting(true); setSeconds(60);
      } else {
        setIsResting(false); setSeconds(180); setCurrentRound((r) => r + 1);
      }
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
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), { ...existing.data(), lastSeen: serverTimestamp() });
        } else {
          setError("Profil introuvable."); setIsSubmitting(false);
        }
      } else {
        if (!ln) { setError("Nom requis."); setIsSubmitting(false); return; }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
          firstName: fn, lastName: ln, phone: ph, role: 'Member', category: 'Loisir', birthDate: new Date(f.get('bd')?.toString() || ""),
          joinedAt: serverTimestamp(), isMedicalOk: false, palmares: { wins: 0, losses: 0, draws: 0 }
        });
      }
    } catch (err) { setError("Erreur Cloud."); setIsSubmitting(false); }
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
      <p className="text-cyan-800 text-[10px] mt-4 animate-bounce uppercase tracking-[0.3em]">Kernel_v40_Active</p>
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
      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-500 text-[11px] font-bold uppercase animate-shake"><AlertTriangle size={18} /> {error}</div>}
      <form onSubmit={handleAuth} className="space-y-4">
        <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required disabled={isSubmitting} />
        {authMode === 'register' && (
          <>
            <input name="ln" placeholder="Nom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white" required />
            <input name="bd" type="date" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400" required />
          </>
        )}
        <input name="ph" placeholder="Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white" required disabled={isSubmitting} />
        <button type="submit" disabled={isSubmitting} className={`w-full p-5 rounded-2xl font-black text-white uppercase text-sm tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-6 ${isSubmitting ? 'bg-slate-800' : 'bg-cyan-600 shadow-cyan-900/40'}`}>
          {isSubmitting ? <Activity className="animate-spin" size={20} /> : (authMode === 'login' ? <LogIn size={20}/> : <UserPlus size={20}/>)}
          {isSubmitting ? 'CHRONOS_SYNC...' : (authMode === 'login' ? 'Entrer dans l\'arène' : 'Initialiser Profil')}
        </button>
      </form>
      <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }} className="w-full text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-cyan-400">
        {authMode === 'login' ? "Nouveau membre ? S'inscrire" : "Déjà membre ? Se connecter"}
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="p-5 space-y-6 pb-28 animate-in fade-in">
      <header className="flex justify-between items-start py-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full"></div>
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none tracking-tighter">SMG <span className="text-cyan-500">Boxe</span></h1>
          <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2 font-bold">Coach {profile?.firstName} • BMF2 Master</p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"><Skull size={24} className="text-cyan-500" /></div>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-8 group active:scale-95 transition-all"><TimerIcon size={36} className="text-cyan-500 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Training</span></FuturisticCard>
        <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-8 group active:scale-95 transition-all"><MessageSquare size={36} className="text-rose-500 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span></FuturisticCard>
        <FuturisticCard borderColor="gold" onClick={() => setView('tournament')} className="flex flex-col items-center gap-4 py-8 col-span-2 group active:scale-95 transition-all"><Trophy size={32} className="text-yellow-500" /><span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Arène Elite & FFKMDA Data</span></FuturisticCard>
      </div>
      <section className="space-y-3">
        <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] px-1">Accès Noyau</h3>
        <button onClick={() => setView('roster')} className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-cyan-500/50 transition-all active:scale-[0.98]"><div className="flex items-center gap-3"><Users size={18} className="text-slate-500 group-hover:text-cyan-400" /><span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Athlètes SMG</span></div><ChevronRight size={14} className="text-slate-700" /></button>
        <button onClick={() => setView('calendar')} className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-purple-500/50 transition-all active:scale-[0.98]"><div className="flex items-center gap-3"><Calendar size={18} className="text-purple-500" /><span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Agenda Club</span></div><ChevronRight size={14} className="text-slate-700" /></button>
      </section>
      <div className="flex items-center justify-between p-4 bg-blue-900/5 border border-blue-900/10 rounded-2xl opacity-30"><div className="flex items-center gap-3"><Box size={16} className="text-blue-500" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Renault Trucks Logistics</span></div><span className="text-[8px] text-blue-900 font-black">VÉNISSIEUX_HUB</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {!profile ? renderAuth() : (
            <div className="pb-32">
              {view === 'home' && renderHome()}
              
              {view === 'tournament' && (
                  <TournamentModule 
                    profile={profile} 
                    members={members} 
                    competitions={competitions} 
                    fights={fights} 
                    selectedCompId={selectedCompId}
                    setSelectedCompId={setSelectedCompId}
                    onNavigate={() => setView('home')}
                    onScan={scanFFKMDA}
                    isSyncing={isSubmitting}
                  />
              )}

              {view === 'timer' && (
                <div className="p-6 h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 min-h-[85vh]">
                  <h2 className="text-3xl font-black italic text-white uppercase mb-8 tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
                  <div className={`w-72 h-72 rounded-full border-[15px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 shadow-rose-500/20'}`}>
                    {isActive && <div className={`absolute inset-0 rounded-full border-2 animate-ping ${isResting ? 'border-cyan-500/20' : 'border-rose-500/20'}`}></div>}
                    <div className="text-7xl font-black text-white font-mono tracking-tighter">{formatTime(seconds)}</div>
                    <div className={`text-xs font-black mt-3 uppercase tracking-widest ${isResting ? 'text-cyan-400' : 'text-rose-500'}`}>{isResting ? 'REPOS' : `Round ${currentRound}`}</div>
                  </div>
                  <div className="flex gap-4 w-full max-w-xs mt-12">
                    <button onClick={() => setIsActive(!isActive)} className={`flex-1 p-5 rounded-3xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all ${isActive ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-black'}`}>{isActive ? 'Pause' : 'Start'}</button>
                    <button onClick={() => { setIsActive(false); setSeconds(180); setCurrentRound(1); setIsResting(false); }} className="p-5 border border-slate-800 rounded-3xl text-slate-400 hover:text-white transition-all"><RotateCcw/></button>
                  </div>
                  <button onClick={() => setView('home')} className="text-slate-600 text-[10px] font-bold uppercase mt-12 flex items-center gap-2 hover:text-cyan-500 transition-colors"><ArrowLeft size={12}/> Retour</button>
                </div>
              )}

              {view === 'chat' && (
                <div className="flex flex-col h-screen pb-20 bg-slate-950 animate-in slide-in-from-right-4">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-20 shadow-lg"><button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-xl text-cyan-500"><ArrowLeft size={20}/></button><div><h2 className="text-white font-bold text-sm leading-none">Club Chat</h2><span className="text-[9px] text-cyan-400 font-mono mt-1 block tracking-tighter">Sync Cloud Active</span></div></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">{messages.map((m: any) => (<div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.uid === user.uid ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>{m.uid !== user.uid && <div className="text-[9px] text-cyan-500 mb-1 font-black uppercase tracking-tighter">{m.sender}</div>}<div className="leading-relaxed">{m.text}</div></div></div>))}<div ref={messagesEndRef} /></div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 sticky bottom-0"><input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500 transition-all" /><button type="submit" className="bg-cyan-600 p-2.5 rounded-full text-white shadow-lg active:scale-90 transition-transform"><Send size={18}/></button></form>
                </div>
              )}

              {view === 'calendar' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 pb-32">
                   <div className="flex items-center gap-3"><button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-purple-500 shadow-lg"><ArrowLeft size={18}/></button><h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">Agenda <span className="text-purple-500">Club</span></h2></div>
                   <div className="space-y-4 relative pl-4"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent"></div>{agenda.sort((a,b) => a.date - b.date).map(ev => (<div key={ev.id} className="relative pl-8"><div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-slate-950 border border-purple-500 z-10 flex items-center justify-center text-[8px] font-black text-purple-400">{new Date(ev.date?.seconds * 1000).getDate()}</div><FuturisticCard title={new Date(ev.date?.seconds * 1000).toLocaleDateString()} borderColor="slate"><h3 className="text-sm font-bold text-white uppercase italic">{ev.title}</h3><p className="text-[10px] text-slate-500 mt-1 italic leading-relaxed">{ev.description}</p></FuturisticCard></div>))}</div>
                </div>
              )}

              {view === 'roster' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32 h-full">
                   <div className="flex items-center gap-3"><button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-cyan-500 shadow-lg"><ArrowLeft size={18}/></button><h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">Roster <span className="text-cyan-500">SMG</span></h2></div>
                   <div className="space-y-3 overflow-y-auto">{members.map(m => { const { age, cat } = getFFKMDACategory(m.birthDate); return (<FuturisticCard key={m.id} borderColor={m.role === 'Admin' ? 'rose' : 'slate'} className="flex justify-between items-center py-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-cyan-500 font-black border border-slate-800 shadow-xl">{m.firstName?.charAt(0)}</div><div><div className="text-sm font-bold text-white uppercase tracking-tight leading-none">{m.firstName} {m.lastName}</div><div className="flex gap-2 mt-2"><span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">{cat}</span><span className="text-[8px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{age} ANS</span></div></div></div><div className="flex items-center gap-3">{m.isMedicalOk ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-rose-500 animate-pulse" />}<ChevronRight size={14} className="text-slate-800" /></div></FuturisticCard>); })}</div>
                </div>
              )}

              {view === 'profile' && (
                <div className="p-8 space-y-8 animate-in fade-in pb-32 text-center">
                   <div className="relative inline-block mx-auto mt-10"><div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-10"></div><div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-4xl font-black shadow-2xl relative shadow-cyan-900/40 text-white italic">{profile?.firstName?.charAt(0)}</div></div>
                   <div><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{profile?.firstName} {profile?.lastName}</h2><p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.3em]">{profile?.role} • BOXEUR ELITE</p></div>
                   <div className="grid grid-cols-3 gap-3"><div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl"><div className="text-[10px] text-green-500 font-black uppercase">Wins</div><div className="text-xl font-black text-white">{profile?.palmares?.wins || 0}</div></div><div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl"><div className="text-[10px] text-rose-500 font-black uppercase">Losses</div><div className="text-xl font-black text-white">{profile?.palmares?.losses || 0}</div></div><div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl"><div className="text-[10px] text-slate-500 font-black uppercase">Draws</div><div className="text-xl font-black text-white">{profile?.palmares?.draws || 0}</div></div></div>
                   <FuturisticCard title="PALMARÈS FINAL" borderColor="gold"><div className="flex items-center gap-4 text-left"><Medal size={32} className="text-yellow-500 shrink-0" /><div><div className="text-xs font-bold text-white uppercase tracking-tighter">Historique Elite</div><p className="text-[10px] text-slate-500 leading-relaxed italic">Synchronisation FFKMDA en cours...</p></div></div></FuturisticCard>
                   <button onClick={() => signOut(auth)} className="w-full p-5 bg-rose-950/20 border border-rose-900/30 rounded-3xl flex justify-between items-center text-rose-500 active:scale-95 transition-all mt-6 font-black uppercase text-[10px] tracking-widest"><span>Détruire la session</span><LogOut size={16}/></button>
                </div>
              )}
            </div>
          )}
        </main>
        {profile && view !== 'chat' && (<nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"><button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-600'}`}><HomeIcon size={24}/></button><button onClick={() => setView('tournament')} className={`p-3 rounded-2xl transition-all ${view === 'tournament' ? 'text-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-slate-600'}`}><Trophy size={24}/></button><button onClick={() => setView('timer')} className={`p-3 rounded-2xl transition-all ${view === 'timer' ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-600'}`}><TimerIcon size={24}/></button><button onClick={() => setView('profile')} className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-600'}`}><UserIcon size={24}/></button></nav>)}
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

// --- MODULE COMPETITION COMPLET (REPRISE TOURNAMENT.TSX) ---

const TournamentModule = ({ profile, members, competitions, fights, selectedCompId, setSelectedCompId, onNavigate, onScan, isSyncing }: any) => {
  const isStaff = profile.role === 'Admin' || profile.role === 'Coach';
  const [activeTab, setActiveTab] = useState<'GESTION' | 'TIMELINE' | 'PALMARES' | 'PLANNING'>(isStaff ? 'GESTION' : 'TIMELINE');
  const [selectedFight, setSelectedFight] = useState<any>(null);
  
  const currentCompetition = competitions.find((c: any) => c.id === selectedCompId);
  const liveFights = fights.filter((f: any) => f.competitionId === selectedCompId && f.status !== 'Finished');

  // Utils
  const getAutoStage = (fighterId: string, currentFightId: string): string => {
    const fighterFights = fights.filter((f: any) => f.fighterId === fighterId && f.competitionId === selectedCompId).sort((a: any, b: any) => a.fightNumber - b.fightNumber);
    const index = fighterFights.findIndex((f: any) => f.id === currentFightId);
    const reverseIndex = fighterFights.length - 1 - index;
    if (reverseIndex === 0) return 'Finale';
    if (reverseIndex === 1) return 'Demi-finale';
    return 'Éliminatoire';
  };

  const handleAddComp = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), {
        name: f.get('name'), discipline: f.get('discipline'), date: f.get('date'), location: f.get('location'), participants: []
    });
    e.target.reset();
  };

  const toggleReg = async (userId: string) => {
    if (!currentCompetition) return;
    const participants = currentCompetition.participants || [];
    const newParticipants = participants.includes(userId) ? participants.filter((id: string) => id !== userId) : [...participants, userId];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'competitions', selectedCompId), { participants: newParticipants });
  };

  const addFight = async (fighter: any) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fights'), {
        competitionId: selectedCompId, fighterId: fighter.id, fighterName: `${fighter.firstName} ${fighter.lastName}`,
        fightNumber: 1, ring: "1", helmetColor: "Inconnu", status: "Pending"
    });
  };

  const updateFight = async (id: string, updates: any) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fights', id), updates);
    setSelectedFight(null);
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center">
        <button onClick={onNavigate} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-yellow-500"><ArrowLeft size={18}/></button>
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Arena Elite</h2>
        <button onClick={onScan} disabled={isSyncing} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-500 active:scale-90"><DownloadCloud size={18} className={isSyncing ? 'animate-bounce' : ''} /></button>
      </div>

      <select value={selectedCompId} onChange={e => setSelectedCompId(e.target.value)} className="w-full bg-slate-900 text-xs text-cyan-400 font-bold p-4 rounded-2xl border border-slate-800 outline-none shadow-xl">
        {competitions.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({new Date(c.date).toLocaleDateString()})</option>)}
      </select>

      <div className="flex space-x-1 bg-slate-950/50 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
        {['PLANNING', 'GESTION', 'TIMELINE', 'PALMARES'].map((tab: any) => (
          (tab === 'PLANNING' || tab === 'GESTION') && !isStaff ? null :
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[80px] py-2.5 text-[9px] font-black rounded-xl transition-all ${activeTab === tab ? 'bg-cyan-600 text-white shadow-xl' : 'text-slate-500'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'PLANNING' && (
        <FuturisticCard title="PLANIFIER TOURNOI" borderColor="cyan">
           <form onSubmit={handleAddComp} className="space-y-4">
              <input name="name" placeholder="Nom..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
              <div className="grid grid-cols-2 gap-2">
                 <input name="date" type="date" className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" required />
                 <input name="discipline" placeholder="Discipline..." className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" />
              </div>
              <input name="location" placeholder="Lieu..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" />
              <button type="submit" className="w-full bg-cyan-600 py-4 rounded-2xl text-[10px] font-black uppercase italic shadow-xl shadow-cyan-900/20">Publier au club</button>
           </form>
        </FuturisticCard>
      )}

      {activeTab === 'GESTION' && (
        <div className="space-y-6">
           <FuturisticCard title="INSCRIPTIONS ATHLÈTES" borderColor="cyan">
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {members.filter((m:any) => m.category === 'Compétiteur' || m.category === 'Loisir').map((m: any) => {
                  const isReg = currentCompetition?.participants?.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleReg(m.id)} className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold ${isReg ? 'bg-cyan-900/20 text-white' : 'text-slate-500'}`}>
                        <span>{m.firstName} {m.lastName}</span>
                        {isReg ? <CheckSquare size={16} className="text-cyan-400" /> : <Square size={16} />}
                    </button>
                  );
                })}
              </div>
           </FuturisticCard>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fiches Combats</h3>
              {members.filter((m: any) => currentCompetition?.participants?.includes(m.id)).map((m: any) => (
                <div key={m.id} className="space-y-2">
                   <div className="flex justify-between items-center border-b border-slate-800 pb-2 px-1">
                      <span className="text-sm font-black text-white italic uppercase">{m.firstName} {m.lastName}</span>
                      <button onClick={() => addFight(m)} className="bg-cyan-600 p-1.5 rounded-lg text-white shadow-lg active:scale-90 transition-all"><Plus size={16}/></button>
                   </div>
                   <div className="grid gap-2">
                      {fights.filter((f:any) => f.fighterId === m.id && f.competitionId === selectedCompId).map((f: any) => (
                        <FuturisticCard key={f.id} onClick={() => setSelectedFight(f)} borderColor={f.status === 'Finished' ? 'slate' : 'cyan'} className={f.status === 'Finished' ? 'opacity-40' : ''}>
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-800"><span className="text-[7px] text-slate-600 font-bold">N°</span><span className="text-lg font-black text-white">{f.fightNumber}</span></div>
                                 <div><div className="text-xs font-black text-white uppercase">{getAutoStage(m.id, f.id)}</div><div className={`text-[8px] font-bold uppercase ${f.helmetColor === 'Rouge' ? 'text-rose-500' : 'text-cyan-400'}`}>Aire {f.ring} • {f.helmetColor}</div></div>
                              </div>
                              {f.status === 'Finished' && <div className={`text-[10px] font-black italic ${f.resultat === 'Victoire' ? 'text-green-500' : 'text-rose-500'}`}>{f.resultat}</div>}
                           </div>
                        </FuturisticCard>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'TIMELINE' && (
        <div className="space-y-8">
           {[...new Set(liveFights.map((f:any) => f.ring))].sort().map(ring => (
             <div key={ring} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2"><MapPin size={14} className="text-cyan-500"/><h3 className="text-xs font-black text-white uppercase italic">Aire {ring}</h3></div>
                <div className="space-y-3">
                   {liveFights.filter((f:any) => f.ring === ring).sort((a:any,b:any) => a.fightNumber - b.fightNumber).map((f: any) => (
                     <div key={f.id} className="relative flex items-center p-4 bg-slate-900 rounded-[1.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                        <div className={`absolute left-0 top-0 w-1 h-full ${f.helmetColor === 'Rouge' ? 'bg-rose-600' : 'bg-cyan-500'}`}></div>
                        <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center mr-4 shadow-inner"><span className="text-[8px] text-slate-600 font-black">N°</span><span className="text-xl font-black text-white">{f.fightNumber}</span></div>
                        <div className="flex-1"><h4 className={`text-lg font-black italic tracking-tighter uppercase leading-none ${f.helmetColor === 'Rouge' ? 'text-rose-500' : 'text-cyan-400'}`}>{f.fighterName}</h4><span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">{getAutoStage(f.fighterId, f.id)}</span></div>
                        {profile.id === f.fighterId && <div className="p-2 bg-cyan-500/10 rounded-xl animate-pulse"><Shield size={20} className="text-cyan-400" /></div>}
                     </div>
                   ))}
                </div>
             </div>
           ))}
           {liveFights.length === 0 && <p className="text-center py-20 text-slate-700 italic uppercase text-[10px] font-black tracking-widest">L'arène est vide</p>}
        </div>
      )}

      {activeTab === 'PALMARES' && (
        <div className="space-y-4">
           {members.map((m: any) => {
               const wins = fights.filter((f:any) => f.fighterId === m.id && f.resultat === 'Victoire').length;
               if (wins === 0 && m.role !== 'Admin') return null;
               return (
                 <FuturisticCard key={m.id} title="ELITE PROFILE" borderColor={wins > 0 ? 'gold' : 'slate'}>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-500 font-black italic">{m.firstName?.charAt(0)}</div>
                          <div><div className="text-sm font-bold text-white uppercase tracking-tighter italic">{m.firstName} {m.lastName}</div><div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Victoires FFKMDA</div></div>
                       </div>
                       <div className="text-right flex flex-col items-end"><Medal size={16} className="text-yellow-500 mb-1"/><span className="text-2xl font-black text-white leading-none">{wins}</span></div>
                    </div>
                 </FuturisticCard>
               );
           })}
        </div>
      )}

      {/* MODAL EDITION MANUELLE */}
      <Modal isOpen={!!selectedFight} onClose={() => setSelectedFight(null)} title="Contrôle Combat">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-[9px] text-slate-500 font-black uppercase">Aire</label><input defaultValue={selectedFight?.ring} id="m_ring" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-yellow-500" /></div>
               <div className="space-y-1"><label className="text-[9px] text-slate-500 font-black uppercase">N° Combat</label><input defaultValue={selectedFight?.fightNumber} id="m_num" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-yellow-500" /></div>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] text-slate-500 font-black uppercase">Résultat Rapide</label>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateFight(selectedFight.id, { resultat: 'Victoire', status: 'Finished' })} className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl text-green-500 font-black text-[10px] uppercase italic">Victoire</button>
                  <button onClick={() => updateFight(selectedFight.id, { resultat: 'Défaite', status: 'Finished' })} className="p-3 bg-rose-900/20 border border-rose-500/30 rounded-xl text-rose-500 font-black text-[10px] uppercase italic">Défaite</button>
               </div>
            </div>
            <button onClick={() => updateFight(selectedFight.id, { ring: (document.getElementById('m_ring') as any).value, fightNumber: (document.getElementById('m_num') as any).value })} className="w-full p-4 bg-yellow-600 rounded-2xl font-black text-white uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save size={18}/> Appliquer Changements</button>
            <button onClick={async () => { if(confirm('Supprimer combat ?')) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fights', selectedFight.id)); setSelectedFight(null); } }} className="w-full py-2 text-rose-500 text-[10px] font-black uppercase flex items-center justify-center gap-1 opacity-50"><Trash2 size={12}/> Détruire Fiche</button>
         </div>
      </Modal>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}

export default App;