import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2 
} from 'lucide-react';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smg-boxing-club';

// --- COMPOSANTS UI ---

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentification (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Synchronisation des données (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      } else {
        setView('register');
      }
      setLoading(false);
    }, (err) => console.error("Profile sync error:", err));

    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    }, (err) => console.error("Chat sync error:", err));

    return () => { unsubProfile(); unsubChat(); };
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
    if (view === 'register') return (
      <div className="p-8 space-y-6 animate-in fade-in">
        <h1 className="text-3xl font-black italic text-white uppercase leading-none">Nouveau<br/><span className="text-cyan-500">Profil</span></h1>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (!user) return;
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
            firstName: f.get('fn'), 
            lastName: f.get('ln'), 
            phone: f.get('ph'), 
            role: 'Member', 
            joinedAt: serverTimestamp()
          });
          setView('home');
        }} className="space-y-4">
          <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-cyan-500" required />
          <input name="ln" placeholder="Nom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-cyan-500" required />
          <input name="ph" placeholder="Téléphone" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-cyan-500" required />
          <button className="w-full bg-cyan-600 p-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl shadow-cyan-900/20 active:scale-95 transition-all">S'inscrire</button>
        </form>
      </div>
    );

    if (view === 'chat') return (
      <div className="flex flex-col h-screen pb-20 bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft className="text-cyan-500" size={20}/></button>
          <div>
            <h2 className="text-white font-bold text-sm">Club Général</h2>
            <span className="text-[10px] text-cyan-400 font-mono">En ligne</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${m.uid === user.uid ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                <div className="text-[10px] opacity-50 mb-1 font-bold">{m.sender}</div>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/95 border-t border-slate-800 flex gap-2 sticky bottom-0">
          <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-white text-sm outline-none focus:border-cyan-500 transition-all"/>
          <button className="bg-cyan-600 p-2.5 rounded-full text-white shadow-lg shadow-cyan-900/20 active:scale-90 transition-transform"><Send size={18}/></button>
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

    return (
      <div className="p-4 space-y-6 pb-24 animate-in fade-in">
        <div className="flex flex-col items-center py-10 relative">
          <div className="absolute top-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
          <Skull size={80} className="text-cyan-500 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">S.M.G Boxing</h1>
          <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase font-mono mt-2">Noyau Shogun v19.0</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-6">
            <TimerIcon size={32} className="text-cyan-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Entraînement</span>
          </FuturisticCard>
          <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-6">
            <MessageSquare size={32} className="text-rose-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span>
          </FuturisticCard>
        </div>

        <FuturisticCard title="DERNIÈRE INFORMATION" borderColor="slate">
          <div className="flex items-start gap-3">
            <Megaphone className="text-cyan-400 shrink-0 mt-1" size={16} />
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Bienvenue {profile?.firstName}. Le système Shogun est synchronisé. Prêt pour l'entraînement."
            </p>
          </div>
        </FuturisticCard>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 border-x border-slate-900/50 relative shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">{renderContent()}</main>
        
        {profile && view !== 'chat' && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50">
             <button onClick={() => setView('home')} className={`p-2 transition-colors ${view === 'home' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}><HomeIcon size={20}/></button>
             <button onClick={() => setView('timer')} className={`p-2 transition-colors ${view === 'timer' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}><TimerIcon size={20}/></button>
             <button onClick={() => setView('chat')} className={`p-2 transition-colors ${view === 'chat' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}><MessageSquare size={20}/></button>
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

// Montage final
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;