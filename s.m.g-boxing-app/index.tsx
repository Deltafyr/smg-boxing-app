import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, Activity, LogOut,
  User as UserIcon, Trash2, Zap, Clock
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ARMAND (PRODUCTION) ---
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    // Listener de profil personnel
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
        if (view === 'register') setView('home');
      } else {
        setProfile(null);
        setView('register'); // Si pas de document, on force l'inscription
      }
      setLoading(false);
    }, (err) => {
      console.error("Profile sync error:", err);
      setLoading(false);
    });

    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (s) => {
      setMembers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubProfile(); unsubChat(); unsubMembers(); };
  }, [user]);

  useEffect(() => { 
    if(view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, view]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      text: inputText,
      uid: user.uid,
      sender: profile?.firstName || 'Anonyme',
      timestamp: Date.now()
    });
    setInputText('');
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Skull size={64} className="text-cyan-500 relative z-10" />
      </div>
      <h1 className="text-white font-black tracking-tighter text-xl uppercase">S.M.G Boxing</h1>
      <p className="text-cyan-600 text-[10px] animate-pulse mt-2 uppercase tracking-widest">Liaison Shogun Core...</p>
    </div>
  );

  const renderContent = () => {
    // Si pas de profil en base, on affiche l'inscription
    if (!profile || view === 'register') return (
      <div className="p-8 space-y-6 animate-in fade-in pb-32">
        <div className="flex flex-col items-center mb-8">
           <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-4">
              <UserIcon size={40} className="text-cyan-500" />
           </div>
           <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center">Nouveau<br/><span className="text-cyan-500 text-2xl">Profil Club</span></h1>
        </div>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (!user) return;
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
            firstName: f.get('fn'), 
            lastName: f.get('ln'), 
            phone: f.get('ph'), 
            role: 'Member', 
            joinedAt: serverTimestamp(),
            isMedicalOk: false
          }, { merge: true });
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <input name="fn" placeholder="Prénom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />
             <input name="ln" placeholder="Nom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />
          </div>
          <input name="ph" placeholder="N° Téléphone" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500 transition-all" required />
          <button className="w-full bg-cyan-600 p-5 rounded-2xl font-black text-white uppercase text-sm tracking-widest shadow-xl shadow-cyan-900/30 active:scale-95 transition-all">Valider Inscription</button>
        </form>
      </div>
    );

    if (view === 'chat') return (
      <div className="flex flex-col h-screen pb-20 bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft className="text-cyan-500" size={20}/></button>
          <div><h2 className="text-white font-bold text-sm leading-none">Club Chat</h2><span className="text-[9px] text-cyan-400 font-mono">Sync Active</span></div>
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
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/95 border-t border-slate-800 flex gap-2 sticky bottom-0">
          <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-white text-sm outline-none focus:border-cyan-500"/>
          <button className="bg-cyan-600 p-2.5 rounded-full text-white shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
        </form>
      </div>
    );

    if (view === 'timer') return (
      <div className="p-6 space-y-8 flex flex-col items-center justify-center h-full animate-in slide-in-from-bottom-4">
         <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
         <div className="w-64 h-64 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center bg-slate-900/50 shadow-2xl relative">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-pulse"></div>
            <div className="text-6xl font-black text-white font-mono tracking-tighter">03:00</div>
            <div className="text-[10px] text-rose-500 font-bold tracking-[0.3em] mt-2 uppercase">Round 1</div>
         </div>
         <div className="flex gap-4 w-full max-w-xs">
            <button className="flex-1 bg-white text-black p-4 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">Start</button>
            <button onClick={() => setView('home')} className="p-4 border border-slate-800 rounded-2xl text-slate-400 active:rotate-180 transition-all duration-500"><RotateCcw/></button>
         </div>
      </div>
    );

    if (view === 'roster') return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right-4 pb-32">
           <div className="flex items-center gap-3">
              <button onClick={() => setView('home')}><ArrowLeft className="text-cyan-500"/></button>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Membres <span className="text-cyan-500">SMG</span></h2>
           </div>
           <div className="space-y-3">
              {members.map(m => (
                 <FuturisticCard key={m.id} borderColor={m.role === 'admin' ? 'rose' : 'slate'} className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-500 font-black border border-slate-700">{m.firstName?.charAt(0)}</div>
                       <div><div className="text-sm font-bold text-white uppercase">{m.firstName} {m.lastName}</div><div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{m.role}</div></div>
                    </div>
                    <CheckCircle2 size={18} className={m.isMedicalOk ? 'text-cyan-500' : 'text-slate-800'} />
                 </FuturisticCard>
              ))}
           </div>
        </div>
    );

    return (
      <div className="p-4 space-y-6 pb-24 animate-in fade-in">
        <div className="flex flex-col items-center py-10 relative">
          <div className="absolute top-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
          <Skull size={80} className="text-cyan-500 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">S.M.G Boxing</h1>
          <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase font-mono mt-2 tracking-widest">Noyau Shogun v22.0</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-6">
            <TimerIcon size={32} className="text-cyan-500" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Training</span>
          </FuturisticCard>
          <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-6">
            <MessageSquare size={32} className="text-rose-500" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span>
          </FuturisticCard>
          <FuturisticCard borderColor="slate" onClick={() => setView('roster')} className="flex flex-col items-center gap-3 py-6 col-span-2">
            <Users size={32} className="text-slate-400" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Roster Athlètes</span>
          </FuturisticCard>
        </div>

        <FuturisticCard title="SYSTÈME OPÉRATIONNEL" borderColor="slate">
          <div className="flex items-start gap-3">
            <Megaphone className="text-cyan-400 shrink-0 mt-1" size={16} />
            <p className="text-xs text-slate-300 leading-relaxed italic">"Bienvenue {profile?.firstName}. Ton application est synchronisée. Tu peux maintenant l'utiliser sur ton téléphone."</p>
          </div>
        </FuturisticCard>

        {/* BOUTON TEST INSCRIPTION */}
        <button onClick={handleLogout} className="w-full p-4 border border-slate-800 rounded-2xl text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2 mt-4 hover:text-rose-500 transition-colors">
          <LogOut size={12} /> Réinitialiser pour Test Inscription
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">{renderContent()}</main>
        {profile && view !== 'chat' && view !== 'register' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50">
             <button onClick={() => setView('home')} className={`p-2 ${view === 'home' ? 'text-cyan-400' : 'text-slate-600'}`}><HomeIcon size={20}/></button>
             <button onClick={() => setView('timer')} className={`p-2 ${view === 'timer' ? 'text-cyan-400' : 'text-slate-600'}`}><TimerIcon size={20}/></button>
             <button onClick={() => setView('chat')} className={`p-2 ${view === 'chat' ? 'text-cyan-400' : 'text-slate-600'}`}><MessageSquare size={20}/></button>
             <button onClick={handleLogout} className="p-2 text-rose-500/50"><LogOut size={18}/></button>
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