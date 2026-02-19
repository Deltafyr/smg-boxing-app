import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity, AlertTriangle,
  LogIn, UserPlus, Fingerprint
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ---
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

// --- COMPOSANTS UI ---

const FuturisticCard = ({ children, className = '', title, borderColor = 'slate', onClick }: any) => {
  const borderColors: any = {
    cyan: 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    rose: 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]',
    slate: 'border-slate-800',
  };
  const accent = borderColor === 'cyan' ? 'border-cyan-400' : borderColor === 'rose' ? 'border-rose-400' : 'border-slate-600';

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

// --- LOGIQUE PRINCIPALE ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer States
  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Initialisation Auth
  useEffect(() => {
    const init = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    init();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setLoading(false); setProfile(null); }
    });
  }, []);

  // 2. Synchronisation Cloud
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    // Listener Profil
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        setError(null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listener Chat
    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    // Listener Membres
    const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (s) => {
      setMembers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubProfile(); unsubChat(); unsubMembers(); };
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

  useEffect(() => { if(view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, view]);

  // --- ACTIONS ---

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const f = new FormData(e.currentTarget);
    const fn = f.get('fn')?.toString().trim();
    const ph = f.get('ph')?.toString().trim();
    const ln = f.get('ln')?.toString().trim();

    try {
      if (authMode === 'login') {
        // Mode Connexion : Recherche par Nom + Tel
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'members'));
        const snap = await getDocs(q);
        const existing = snap.docs.find(d => 
          d.data().firstName?.toLowerCase() === fn?.toLowerCase() && 
          d.data().phone === ph
        );

        if (existing) {
          // On "récupère" le compte en migrant les données vers le nouveau UID
          const data = existing.data();
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
            ...data,
            lastLogin: serverTimestamp()
          });
          // On peut optionnellement supprimer l'ancien doc s'il avait un UID différent
          if (existing.id !== user.uid) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', existing.id));
          }
        } else {
          setError("Profil introuvable. Vérifie ton prénom et téléphone.");
          setIsSubmitting(false);
        }
      } else {
        // Mode Inscription
        if (!ln) { setError("Le nom est requis."); setIsSubmitting(false); return; }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
          firstName: fn, lastName: ln, phone: ph, role: 'Member', joinedAt: serverTimestamp(), isMedicalOk: false
        });
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de liaison Cloud. Réessaie.");
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    const text = inputText;
    setInputText('');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      text, uid: user.uid, sender: profile?.firstName || 'Boxeur', timestamp: Date.now()
    });
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDU ---

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
      <Skull size={64} className="text-cyan-500 animate-pulse mb-4" />
      <h1 className="text-white font-black text-xl tracking-widest uppercase">SMG Kernel</h1>
      <p className="text-cyan-800 text-[10px] mt-2 animate-bounce">SYNC_IN_PROGRESS...</p>
    </div>
  );

  const renderAuth = () => (
    <div className="p-8 space-y-8 animate-in fade-in pb-32">
      <div className="flex flex-col items-center mt-10">
        <div className="p-5 bg-cyan-500/10 rounded-[2.5rem] border border-cyan-500/20 mb-6 shadow-2xl">
          <Fingerprint size={48} className="text-cyan-500" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center">
          {authMode === 'login' ? 'Connexion' : 'Inscription'}<br/>
          <span className="text-cyan-500 text-xl font-bold not-italic tracking-widest">S.M.G BOXING</span>
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-500 text-[11px] font-bold uppercase animate-shake">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />
        {authMode === 'register' && <input name="ln" placeholder="Nom de famille" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />}
        <input name="ph" placeholder="N° de Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />
        
        <button type="submit" disabled={isSubmitting} className="w-full p-5 bg-cyan-600 rounded-2xl font-black text-white uppercase text-sm tracking-[0.2em] shadow-xl shadow-cyan-900/30 active:scale-95 transition-all flex items-center justify-center gap-3">
          {isSubmitting ? <Activity className="animate-spin" size={18} /> : (authMode === 'login' ? <LogIn size={18}/> : <UserPlus size={18}/>)}
          {isSubmitting ? 'SYCHRONISATION...' : (authMode === 'login' ? 'Accéder au Club' : 'Créer mon Profil')}
        </button>
      </form>

      <div className="text-center">
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors">
          {authMode === 'login' ? "Nouveau membre ? M'inscrire ici" : "Déjà membre ? Se connecter"}
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="p-5 space-y-6 pb-28 animate-in fade-in">
      <div className="flex flex-col items-center py-10 relative">
        <div className="absolute top-10 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full"></div>
        <Skull size={80} className="text-cyan-500 mb-4 relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">S.M.G Boxing</h1>
        <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2 tracking-widest text-center">Profil : {profile?.firstName} {profile?.lastName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-7 group">
          <TimerIcon size={36} className="text-cyan-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Entraînement</span>
        </FuturisticCard>
        <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-7 group">
          <MessageSquare size={36} className="text-rose-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span>
        </FuturisticCard>
        <FuturisticCard borderColor="slate" onClick={() => setView('roster')} className="flex flex-col items-center gap-4 py-7 col-span-2 group">
          <Users size={32} className="text-slate-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Roster Officiel</span>
        </FuturisticCard>
      </div>

      <FuturisticCard title="SYSTÈME ACTIF" borderColor="slate">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-cyan-500/10 rounded-lg"><Megaphone className="text-cyan-400" size={18} /></div>
          <p className="text-[11px] text-slate-300 leading-relaxed italic flex-1">"Prêt Armand. Le timer est réglé sur 3min travail / 1min repos. Bonne session de sparring."</p>
        </div>
      </FuturisticCard>

      <button onClick={() => signOut(auth)} className="w-full p-4 border border-slate-800/50 rounded-2xl text-[9px] text-slate-700 uppercase font-black tracking-[0.3em] flex items-center justify-center gap-2 mt-4 hover:text-rose-600">
        <LogOut size={12} /> Quitter la Session
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Viewport Dynamic */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {!profile ? renderAuth() : (
            <>
              {view === 'home' && renderHome()}
              {view === 'timer' && (
                <div className="p-6 h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-4">
                  <h2 className="text-3xl font-black italic text-white uppercase mb-8">Boxing <span className="text-rose-500">Timer</span></h2>
                  <div className={`w-72 h-72 rounded-full border-[12px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 shadow-rose-500/20'}`}>
                    <div className="text-7xl font-black text-white font-mono">{formatTime(seconds)}</div>
                    <div className={`text-xs font-black mt-3 uppercase ${isResting ? 'text-cyan-400' : 'text-rose-500'}`}>{isResting ? 'Repos' : `Round ${currentRound}`}</div>
                  </div>
                  <div className="flex gap-4 w-full max-w-xs mt-10">
                    <button onClick={() => setIsActive(!isActive)} className={`flex-1 p-5 rounded-3xl font-black uppercase text-sm ${isActive ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-black'}`}>
                      {isActive ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={() => { setIsActive(false); setSeconds(180); setCurrentRound(1); setIsResting(false); }} className="p-5 border border-slate-800 rounded-3xl text-slate-400"><RotateCcw/></button>
                  </div>
                  <button onClick={() => setView('home')} className="text-slate-600 text-[10px] font-bold uppercase mt-10 flex items-center gap-2"><ArrowLeft size={12}/> Retour</button>
                </div>
              )}
              {view === 'chat' && (
                <div className="flex flex-col h-screen pb-20 bg-slate-950 animate-in slide-in-from-right-4">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20">
                    <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-xl text-cyan-500"><ArrowLeft size={20}/></button>
                    <div><h2 className="text-white font-bold text-sm leading-none">Club Chat</h2><span className="text-[9px] text-cyan-400 font-mono mt-1 block">Liaison Shogun Active</span></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((m: any) => (
                      <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.uid === user.uid ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                          {m.uid !== user.uid && <div className="text-[9px] text-cyan-500 mb-1 font-black uppercase">{m.sender}</div>}
                          <div className="leading-relaxed">{m.text}</div>
                          <div className="text-[8px] opacity-30 mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 sticky bottom-0">
                    <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-white text-sm outline-none focus:border-cyan-500" />
                    <button type="submit" className="bg-cyan-600 p-2.5 rounded-full text-white shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
                  </form>
                </div>
              )}
              {view === 'roster' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32 h-full">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-cyan-500"><ArrowLeft size={18}/></button>
                      <h2 className="text-2xl font-black text-white italic uppercase leading-none">Roster <span className="text-cyan-500">SMG</span></h2>
                   </div>
                   <div className="space-y-3 overflow-y-auto">
                      {members.map(m => (
                         <FuturisticCard key={m.id} borderColor={m.role === 'Admin' ? 'rose' : 'slate'} className="flex justify-between items-center py-4">
                            <div className="flex items-center gap-4">
                               <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-500 font-black border border-slate-700">{m.firstName?.charAt(0)}</div>
                               <div>
                                  <div className="text-sm font-bold text-white uppercase tracking-tight">{m.firstName} {m.lastName}</div>
                                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{m.role} • BOXEUR ELITE</div>
                               </div>
                            </div>
                            <CheckCircle2 size={18} className={m.isMedicalOk ? 'text-cyan-500' : 'text-slate-800'} />
                         </FuturisticCard>
                      ))}
                   </div>
                </div>
              )}
            </>
          )}
        </main>
        
        {/* Navigation Tab Bar */}
        {profile && view !== 'chat' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50 px-6">
             <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}`}><HomeIcon size={22}/></button>
             <button onClick={() => setView('timer')} className={`p-3 rounded-2xl transition-all ${view === 'timer' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}`}><TimerIcon size={22}/></button>
             <button onClick={() => setView('chat')} className={`p-3 rounded-2xl transition-all ${view === 'chat' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}`}><MessageSquare size={22}/></button>
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

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}

export default App;