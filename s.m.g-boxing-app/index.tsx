import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp, query, getDocs, deleteDoc, orderBy, updateDoc
} from 'firebase/firestore';
import { 
  Shield, Skull, MessageSquare, Users, Send, Trophy, 
  Timer as TimerIcon, Home as HomeIcon, ArrowLeft, 
  RotateCcw, Megaphone, CheckCircle2, LogOut,
  User as UserIcon, Play, Pause, Zap, Activity, AlertTriangle,
  LogIn, UserPlus, Fingerprint, ChevronRight, Sword, Medal,
  Calendar, Info, Scale, Hash, Target, DownloadCloud, ClipboardCheck,
  FileBadge, Box, X, Save, Edit3, Smartphone
} from 'lucide-react';

// --- CONFIGURATION EXTERNE ---
// ⚠️ Armand : Colle ici l'URL de ton Google Apps Script (Code.gs V81)
const SHOGUN_API_URL = "https://script.google.com/macros/s/AKfycbz.../exec";

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

// --- UTILS : CATEGORIES FFKMDA ---
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

// --- COMPOSANTS UI ---
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
          <h2 className="text-xl font-black text-white uppercase italic">{title}</h2>
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [view, setView] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [fights, setFights] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer States
  const [seconds, setSeconds] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  // 1. Authentification
  useEffect(() => {
    const init = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };
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
    
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), (snap) => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      else setProfile(null);
      setLoading(false);
    });

    const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (s) => {
      setMembers(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubFights = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'fights'), (s) => {
      setFights(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubChat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), (s) => {
      const msgs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)));
    });

    return () => { unsubProfile(); unsubMembers(); unsubFights(); unsubChat(); };
  }, [user]);

  // 3. Moteur Timer
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

  // --- ACTIONS SHOGUN (HYBRID) ---

  const scanFFKMDA = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${SHOGUN_API_URL}?action=AUTO_SCAN_PLANNING`);
      const result = await response.json();
      // Le script met à jour le Google Sheet et l'app reçoit les updates via Firestore si synchronisé
      // Sinon, on peut forcer un re-fetch ici.
      console.log("Scan result:", result);
    } catch (e) { console.error("Sync Error", e); }
    setIsSyncing(false);
  };

  const updateFightManual = async (fightId: string, updates: any) => {
    try {
      const fightRef = doc(db, 'artifacts', appId, 'public', 'data', 'fights', fightId);
      await updateDoc(fightRef, updates);
      // Envoi vers Google Sheet via Apps Script (V81 logic)
      await fetch(SHOGUN_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'UPDATE_FULL_DETAILS', fightId, ...updates })
      });
      setSelectedFight(null);
    } catch (e) { console.error(e); }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fn = f.get('fn')?.toString();
    const ph = f.get('ph')?.toString();
    
    if (authMode === 'login') {
      const existing = members.find(m => m.firstName?.toLowerCase() === fn?.toLowerCase() && m.phone === ph);
      if (existing) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), { ...existing, lastSeen: serverTimestamp() });
      }
    } else {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
        firstName: fn, lastName: f.get('ln'), phone: ph, birthDate: new Date(f.get('bd')?.toString() || ""),
        role: 'member', joinedAt: serverTimestamp(), isMedicalOk: false, category: 'Compétiteur',
        authorizations: { imageRights: true, transportParental: true, emergencySurgery: true }
      });
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDU ---

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono">
      <Skull size={64} className="text-cyan-500 animate-pulse mb-4 shadow-[0_0_30px_rgba(6,182,212,0.4)]" />
      <h1 className="text-white font-black text-xl tracking-[0.4em] uppercase">SMG Kernel</h1>
      <p className="text-cyan-800 text-[9px] mt-2 animate-bounce uppercase">Loading_Modules...</p>
    </div>
  );

  const renderAuth = () => (
    <div className="p-8 space-y-8 animate-in fade-in pb-32">
      <div className="flex flex-col items-center mt-12">
        <div className="p-6 bg-cyan-500/10 rounded-[3rem] border border-cyan-500/20 mb-6 shadow-2xl relative">
          <Fingerprint size={56} className="text-cyan-500" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase leading-none text-center">
          {authMode === 'login' ? 'Accès Club' : 'Elite Recruitment'}<br/>
          <span className="text-cyan-500 text-xl font-bold not-italic tracking-[0.3em]">S.M.G BOXING</span>
        </h1>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <input name="fn" placeholder="Prénom" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
        {authMode === 'register' && (
          <>
            <input name="ln" placeholder="Nom de famille" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
            <input name="bd" type="date" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400" required />
          </>
        )}
        <input name="ph" placeholder="N° de Téléphone" type="tel" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
        <button type="submit" className="w-full p-5 bg-cyan-600 rounded-2xl font-black text-white uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all">
          {authMode === 'login' ? 'Entrer dans l\'arène' : 'Initialiser Profil'}
        </button>
      </form>

      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-cyan-400">
        {authMode === 'login' ? "Nouveau ? M'inscrire" : "Déjà membre ? Se connecter"}
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
                      <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">SMG <span className="text-cyan-500">Boxe</span></h1>
                      <p className="text-[10px] text-slate-500 tracking-[0.5em] uppercase font-mono mt-2 tracking-widest">Coach {profile?.firstName} • BMF2</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"><Skull size={24} className="text-cyan-500" /></div>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <FuturisticCard borderColor="cyan" onClick={() => setView('timer')} className="flex flex-col items-center gap-3 py-8">
                      <TimerIcon size={36} className="text-cyan-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Training</span>
                    </FuturisticCard>
                    <FuturisticCard borderColor="rose" onClick={() => setView('chat')} className="flex flex-col items-center gap-3 py-8">
                      <MessageSquare size={36} className="text-rose-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Club Chat</span>
                    </FuturisticCard>
                    <FuturisticCard borderColor="gold" onClick={() => setView('tournament')} className="flex flex-col items-center gap-4 py-8 col-span-2">
                      <Trophy size={32} className="text-yellow-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Tournois & FFKMDA</span>
                    </FuturisticCard>
                  </div>

                  <FuturisticCard title="ALBEDO SHOGUN" borderColor="slate">
                    <div className="flex items-start gap-4">
                      <Zap className="text-cyan-400 mt-1" size={16} />
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">"Prêt Armand. Le noyau est synchronisé avec les API FFKMDA. {fights.length} combats détectés au planning."</p>
                    </div>
                  </FuturisticCard>

                  {/* Renault Trucks Sync Discret */}
                  <div className="flex items-center justify-between p-4 bg-blue-900/5 border border-blue-900/10 rounded-2xl opacity-40">
                     <div className="flex items-center gap-3"><Box size={16} className="text-blue-500" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Renault Trucks Logistics</span></div>
                     <span className="text-[8px] text-blue-900 font-black">VÉNISSIEUX_HUB</span>
                  </div>
                </div>
              )}

              {view === 'tournament' && (
                <div className="p-6 space-y-6 animate-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setView('home')} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-yellow-500"><ArrowLeft size={18}/></button>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Arene <span className="text-yellow-500">Elite</span></h2>
                    <button onClick={scanFFKMDA} disabled={isSyncing} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-cyan-500">
                      <DownloadCloud size={18} className={isSyncing ? 'animate-bounce' : ''} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {fights.map(f => (
                      <FuturisticCard key={f.id} borderColor={f.coin === 'Rouge' ? 'rose' : 'cyan'} onClick={() => setSelectedFight(f)} className="flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-white border border-slate-700">
                               {f.numCombat || "?"}
                            </div>
                            <div>
                               <div className="text-sm font-black text-white uppercase">{f.nomCombattant}</div>
                               <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aire {f.aire} • Coin {f.coin}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className={`text-[10px] font-black uppercase ${f.resultat === 'Victoire' ? 'text-green-500' : f.resultat === 'Défaite' ? 'text-rose-500' : 'text-slate-600'}`}>
                               {f.resultat || "En attente"}
                            </div>
                         </div>
                      </FuturisticCard>
                    ))}
                    {fights.length === 0 && <p className="text-center py-20 text-slate-700 italic uppercase text-[10px] font-black tracking-widest">Aucun combat au planning</p>}
                  </div>
                </div>
              )}

              {view === 'timer' && (
                <div className="p-6 h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 min-h-[80vh]">
                  <h2 className="text-3xl font-black italic text-white uppercase mb-12 tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
                  <div className={`w-72 h-72 rounded-full border-[15px] transition-all duration-700 flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl relative ${isResting ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 shadow-rose-500/20'}`}>
                    <div className="text-7xl font-black text-white font-mono tracking-tighter">{formatTime(seconds)}</div>
                    <div className={`text-xs font-black mt-4 uppercase tracking-[0.3em] ${isResting ? 'text-cyan-400' : 'text-rose-500'}`}>{isResting ? 'REPOS' : `Round ${currentRound}`}</div>
                  </div>
                  <div className="flex gap-4 w-full max-w-xs mt-12">
                    <button onClick={() => setIsActive(!isActive)} className={`flex-1 p-6 rounded-3xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all ${isActive ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}>
                      {isActive ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={() => { setIsActive(false); setSeconds(180); setCurrentRound(1); setIsResting(false); }} className="p-6 border border-slate-800 rounded-3xl text-slate-400"><RotateCcw/></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* MODAL EDITION MANUELLE */}
        <Modal isOpen={!!selectedFight} onClose={() => setSelectedFight(null)} title="Forcer Détails Combat">
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Aire</label>
                    <input defaultValue={selectedFight?.aire} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-yellow-500" id="m_aire" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Combat N°</label>
                    <input defaultValue={selectedFight?.numCombat} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-yellow-500" id="m_num" />
                 </div>
              </div>
              <button 
                onClick={() => updateFightManual(selectedFight.id, { 
                  aire: (document.getElementById('m_aire') as HTMLInputElement).value,
                  numCombat: (document.getElementById('m_num') as HTMLInputElement).value
                })}
                className="w-full p-4 bg-yellow-600 rounded-2xl font-black uppercase text-white shadow-xl flex items-center justify-center gap-3"
              >
                <Save size={18}/> Sauvegarder Shogun
              </button>
           </div>
        </Modal>

        {profile && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 flex justify-around items-center z-50 px-6">
             <button onClick={() => setView('home')} className={`p-3 rounded-2xl ${view === 'home' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}`}><HomeIcon size={22}/></button>
             <button onClick={() => setView('tournament')} className={`p-3 rounded-2xl ${view === 'tournament' ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600'}`}><Trophy size={22}/></button>
             <button onClick={() => setView('timer')} className={`p-3 rounded-2xl ${view === 'timer' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600'}`}><TimerIcon size={22}/></button>
             <button onClick={() => signOut(auth)} className="p-3 text-rose-500 opacity-40"><LogOut size={18}/></button>
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