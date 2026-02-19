import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, orderBy 
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ARMAND (PRODUCTION SYNC) ---
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

// --- COMPOSANTS UI CYBERPUNK ---

const FuturisticCard = ({ children, className = '', title, borderColor = 'slate', onClick }: any) => {
  const borderColors: any = {
    cyan: 'border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.1)]',
    rose: 'border-rose-500/30 shadow-[0_0_15px_-5px_rgba(244,63,94,0.1)]',
    slate: 'border-slate-700/50',
  };
  const accent = borderColor === 'cyan' ? 'border-cyan-400' : borderColor === 'rose' ? 'border-rose-400' : 'border-slate-500';

  return (
    <div onClick={onClick} className={`relative bg-slate-900/50 backdrop-blur-md border ${borderColors[borderColor] || borderColors.slate} rounded-2xl p-4 overflow-hidden transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl-lg ${accent}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 rounded-tr-lg ${accent}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 rounded-bl-lg ${accent}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 rounded-br-lg ${accent}`} />
      {title && <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-3 border-b border-slate-800 pb-1">{title}</h3>}
      {children}
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LOGIQUE DU TIMER
  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Authentification Initiale
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
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

  // 2. Synchronisation Temps Réel (Firestore)
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    // Écoute du profil personnel
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        // Si l'utilisateur vient de s'inscrire, on le redirige vers l'accueil
        if (view === 'register') setView('home');
      } else {
        setProfile(null);
        setView('register');
      }
      setLoading(false);
    }, (err) => {
      console.error("Profile sync error:", err);
      setLoading(false);
    });

    // Écoute du chat (ordonné par temps)
    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    // Écoute des membres du club
    const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (s) => {
      setMembers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubProfile(); unsubChat(); unsubMembers(); };
  }, [user]);

  // 3. Moteur du Chronomètre de Boxe
  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      // Transition automatique Round / Repos
      if (!isResting) {
        setIsResting(true);
        setSeconds(60); // 1 minute de repos
      } else {
        setIsResting(false);
        setSeconds(180); // Retour à 3 minutes
        setCurrentRound((r) => r + 1);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isResting]);

  // Scroll auto pour le chat
  useEffect(() => { 
    if(view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, view]);

  // --- ACTIONS ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    
    const textToSend = inputText;
    setInputText(''); // Vider immédiatement l'input pour la sensation de vitesse
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        text: textToSend,
        uid: user.uid,
        sender: profile?.firstName || 'Anonyme',
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Chat Error:", err);
      setInputText(textToSend); // Restaurer en cas d'échec
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
        firstName: formData.get('fn'), 
        lastName: formData.get('ln'), 
        phone: formData.get('ph'), 
        role: 'Member', 
        joinedAt: serverTimestamp(),
        isMedicalOk: false
      }, { merge: true });
      // La redirection se fera via le listener onSnapshot du profil
    } catch (err) {
      console.error("Registration Error:", err);
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- VUES ---

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Skull size={64} className="text-cyan-500 relative z-10" />
      </div>
      <h1 className="text-white font-black tracking-tighter text-xl uppercase">S.M.G Boxing</h1>
      <p className="text-cyan-600 text-[10px] animate-pulse mt-2 uppercase tracking-widest">Initialisation Shogun Core...</p>
    </div>
  );

  const renderContent = () => {
    // Écran d'inscription (Visible si aucun profil trouvé)
    if (!profile || view === 'register') return (
      <div className="p-8 space-y-6 animate-in fade-in pb-32">
        <div className="flex flex-col items-center mb-10">
           <div className="p-5 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/20 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <UserIcon size={48} className="text-cyan-500" />
           </div>
           <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center tracking-tighter">Rejoindre<br/><span className="text-cyan-500 text-2xl tracking-normal font-sans not-italic font-bold">Le Club SMG</span></h1>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <input name="fn" placeholder="Prénom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
             <input name="ln" placeholder="Nom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
          </div>
          <input name="ph" placeholder="N° de Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600" required disabled={isSubmitting} />
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full p-5 rounded-2xl font-black text-white uppercase text-sm tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isSubmitting ? 'bg-slate-800' : 'bg-cyan-600 shadow-cyan-900/30'}`}
          >
            {isSubmitting ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
            {isSubmitting ? 'Synchronisation...' : 'Valider mon profil'}
          </button>
        </form>
        <p className="text-[10px] text-slate-700 text-center uppercase font-bold tracking-[0.3em] mt-8">Shogun Boxing Management v24.0</p>
      </div>
    );

    if (view === 'chat') return (
      <div className="flex flex-col h-screen pb-20 bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20">
          <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><ArrowLeft className="text-cyan-500" size={20}/></button>
          <div>
            <h2 className="text-white font-bold text-sm leading-none">Club Chat</h2>
            <span className="text-[9px] text-cyan-400 font-mono flex items-center gap-1 mt-1"><span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span> Liaison Shogun Active</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 to-transparent">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.uid === user.uid ? 'bg-cyan-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(6,182,212,0.2)]' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                {m.uid !== user.uid && <div className="text-[9px] text-cyan-500 mb-1 font-black uppercase tracking-tighter">{m.sender}</div>}
                <div className="leading-relaxed">{m.text}</div>
                <div className="text-[8px] opacity-30 mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/95 border-t border-slate-800 flex gap-2 sticky bottom-0">
          <input 
            value={inputText} 
            onChange={e => setInputText(e.target.value)} 
            placeholder="Écrire un message..." 
            className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500 transition-all"
          />
          <button type="submit" className="bg-cyan-600 p-3 rounded-full text-white shadow-lg active:scale-90 transition-transform">
            <Send size={18}/>
          </button>
        </form>
      </div>
    );

    if (view === 'timer') return (
      <div className="p-6 space-y-8 flex flex-col items-center justify-center h-full animate-in slide-in-from-bottom-4">
         <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
         <div className={`w-72 h-72 rounded-full border-[10px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20 scale-95' : 'border-slate-800 shadow-rose-500/20'}`}>
            {isActive && <div className={`absolute inset-0 rounded-full border-2 animate-ping ${isResting ? 'border-cyan-500/30' : 'border-rose-500/30'}`}></div>}
            <div className="text-7xl font-black text-white font-mono tracking-tighter">{formatTime(seconds)}</div>
            <div className={`text-xs font-black tracking-[0.4em] mt-3 uppercase ${isResting ? 'text-cyan-400' : 'text-rose-500'}`}>
               {isResting ? 'REPOS' : `Round ${currentRound}`}
            </div>
         </div>
         <div className="flex gap-4 w-full max-w-xs">
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`flex-1 p-5 rounded-3xl font-black uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isActive ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-black'}`}
            >
              {isActive ? <Pause size={24}/> : <Play size={24}/>}
              {isActive ? 'Pause' : 'C\'est parti'}
            </button>
            <button 
              onClick={() => {
                setIsActive(false);
                setSeconds(180);
                setCurrentRound(1);
                setIsResting(false);
              }}
              className="p-5 border border-slate-800 rounded-3xl text-slate-400 hover:text-white hover:border-slate-600 active:rotate-180 transition-all duration-500"
            >
              <RotateCcw size={24}/>
            </button>
         </div>
         <button onClick={() => setView('home')} className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-2 hover:text-cyan-500 transition-colors"><ArrowLeft size={12}/> Retour au Noyau</button>
      </div>
    );

    if (view === 'roster') return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32">
           <div className="flex items-center gap-3">
              <button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800"><ArrowLeft className="text-cyan-500" size={18}/></button>
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Athlètes <span className="text-cyan-500">SMG</span></h2>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{members.length} Profils Synchronisés</span>
              </div>
           </div>
           <div className="space-y-3">
              {members.map(m => (
                 <FuturisticCard key={m.id} borderColor={m.role === 'admin' ? 'rose' : 'slate'} className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-500 font-black border border-slate-700 shadow-lg">{m.firstName?.charAt(0)}</div>
                       <div>
                          <div className="text-sm font-bold text-white uppercase tracking-tight">{m.firstName} {m.lastName}</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{m.role} • BOXEUR ELITE</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {m.isMedicalOk ? <CheckCircle2 size={18} className="text-cyan-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-800"></div>}
                    </div>
                 </FuturisticCard>
              ))}
           </div>
        </div>
    );

    // --- ACCUEIL (HOME) ---
    return (
      <div className="p-5 space-y-6 pb-24 animate-in fade-in">
        <div className="flex flex-col items-center py-10 relative">
          <div className="absolute top-10 w-40 h-40 bg-cyan-500/5 blur-[80px] rounded-full"></div>
          <Skull size={84} className="text-cyan-500 mb-4 relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">S.M.G Boxing</h1>
          <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2">Noyau Shogun OS v24.0</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-7 group">
            <TimerIcon size={36} className="text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Entraînement</span>
          </FuturisticCard>
          <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-7 group">
            <MessageSquare size={36} className="text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Club Chat</span>
          </FuturisticCard>
          <FuturisticCard borderColor="slate" onClick={() => setView('roster')} className="flex flex-col items-center gap-4 py-7 col-span-2 group">
            <Users size={32} className="text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Roster Officiel</span>
          </FuturisticCard>
        </div>

        <FuturisticCard title="SYSTÈME OPÉRATIONNEL" borderColor="slate">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg"><Megaphone className="text-cyan-400" size={18} /></div>
            <div className="flex-1">
               <p className="text-[11px] text-slate-300 leading-relaxed italic">
                 "Bienvenue Coach. Le moteur de combat est prêt. Le timer est réglé sur les standards SMG : 3 minutes de travail, 1 minute de repos."
               </p>
            </div>
          </div>
        </FuturisticCard>

        <button onClick={handleLogout} className="w-full p-4 border border-slate-800/50 rounded-2xl text-[9px] text-slate-700 uppercase font-black tracking-[0.3em] flex items-center justify-center gap-2 mt-4 hover:text-rose-600 transition-all">
          <LogOut size={12} /> Déconnecter la Session
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">{renderContent()}</main>
        
        {profile && view !== 'chat' && view !== 'register' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50 px-6">
             <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-400'}`}><HomeIcon size={22}/></button>
             <button onClick={() => setView('timer')} className={`p-3 rounded-2xl transition-all ${view === 'timer' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-400'}`}><TimerIcon size={22}/></button>
             <button onClick={() => setView('chat')} className={`p-3 rounded-2xl transition-all ${view === 'chat' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-slate-400'}`}><MessageSquare size={22}/></button>
          </nav>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0ea5e9; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}

export default App;