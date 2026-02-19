import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, serverTimestamp
} from 'firebase/firestore';
import { 
  Shield, Activity, Zap, Clock, Skull, MessageSquare, 
  Users, Send, Calendar, Trophy, AlertCircle, CheckCircle2,
  UserPlus, Target, Medal, Sword, Award, User as UserIcon,
  Timer as TimerIcon, Play, Pause, RotateCcw, LogOut, Home as HomeIcon,
  Plus, Trash2, Megaphone, LayoutGrid
} from 'lucide-react';

// --- CONFIGURATION FIREBASE RÉELLE (SYNC ARMAND) ---
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

// --- ROUTES ---
const AppRoute = {
  REGISTER: 'register', HOME: 'home', TIMER: 'timer',
  CHAT: 'chat', PROFILE: 'profile', ADMIN: 'admin'
};

// --- COMPOSANTS UI CYBERPUNK ---

const FuturisticCard = ({ children, className = '', title, borderColor = 'slate', onClick }) => {
  const borderColors = {
    cyan: 'border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.1)]',
    rose: 'border-rose-500/30 shadow-[0_0_15px_-5px_rgba(244,63,94,0.1)]',
    slate: 'border-slate-700/50',
  };
  const accent = borderColor === 'cyan' ? 'border-cyan-400' : borderColor === 'rose' ? 'border-rose-400' : 'border-slate-500';

  return (
    <div onClick={onClick} className={`relative bg-slate-900/50 backdrop-blur-md border ${borderColors[borderColor]} rounded-2xl p-4 overflow-hidden transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl-lg ${accent}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 rounded-tr-lg ${accent}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 rounded-bl-lg ${accent}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 rounded-br-lg ${accent}`} />
      {title && <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-3 border-b border-slate-800 pb-1">{title}</h3>}
      {children}
    </div>
  );
};

const Navbar = ({ currentRoute, onNavigate, profile }) => {
  if (!profile) return null;
  const isStaff = profile.role === 'Admin' || profile.role === 'Coach';

  const navItems = [
    { id: AppRoute.HOME, icon: HomeIcon, label: 'Accueil' },
    { id: AppRoute.TIMER, icon: TimerIcon, label: 'Chrono' },
    { id: AppRoute.CHAT, icon: MessageSquare, label: 'Chat' },
    { id: AppRoute.PROFILE, icon: UserIcon, label: 'Profil' },
  ];
  if (isStaff) navItems.push({ id: AppRoute.ADMIN, icon: Shield, label: 'Admin' });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyan-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
              <item.icon size={isActive ? 22 : 18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[8px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- PAGES ---

const HomePage = ({ onNavigate, announcements, profile }) => {
  const latestAnnouncement = announcements[0] || { title: 'Shogun OS Online', content: 'Base de données synchronisée.', priority: 'Low' };
  
  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in">
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-rose-500 rounded-full opacity-20 blur-xl"></div>
          <div className="relative w-32 h-32 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800 shadow-2xl">
             <Skull size={64} className="text-cyan-500" />
          </div>
        </div>
        <div className="text-center space-y-1">
             <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-rose-500">S.M.G BOXING</h1>
             <p className="text-[10px] text-slate-400 tracking-[0.5em] uppercase font-mono">Club 01 • {profile?.firstName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(AppRoute.TIMER)} className="group col-span-2">
          <FuturisticCard className="h-full flex flex-row items-center justify-between px-6 py-5" borderColor="cyan">
             <div className="flex items-center space-x-4">
                <div className="bg-cyan-500/10 p-3 rounded-xl"><TimerIcon className="w-6 h-6 text-cyan-400" /></div>
                <div className="text-left"><span className="block font-bold text-lg text-slate-100">Entraînement</span><span className="text-xs text-slate-500">Timer & Tabata</span></div>
             </div>
             <div className="text-cyan-500 opacity-50">▶</div>
          </FuturisticCard>
        </button>
      </div>

      <FuturisticCard title="INFO CLUB" borderColor={latestAnnouncement.priority === 'High' ? 'rose' : 'slate'}>
        <div className="flex items-start space-x-3">
          <Megaphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1">
             <span className="font-bold text-slate-200 text-sm block mb-1">{latestAnnouncement.title}</span>
             <p className="text-xs text-slate-400 leading-relaxed">{latestAnnouncement.content}</p>
          </div>
        </div>
      </FuturisticCard>
    </div>
  );
};

// --- APP ROOT ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(AppRoute.HOME);
  const [announcements, setAnnouncements] = useState([]);

  // Authentification et Initialisation
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { 
        console.error("Auth Error:", err); 
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Synchronisation des données
  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'public', 'data'];
    
    // Listener Profil
    const unsubProfile = onSnapshot(doc(db, ...path, 'members', user.uid), (snap) => {
      if (snap.exists()) { 
        setProfile({ id: snap.id, ...snap.data() });
      } else { 
        setCurrentRoute(AppRoute.REGISTER); 
      }
      setLoading(false);
    }, (err) => {
        console.error("Firestore Error:", err);
        setLoading(false);
    });

    // Listener Annonces
    const unsubAnnounce = onSnapshot(collection(db, ...path, 'announcements'), s => {
      setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.timestamp - a.timestamp));
    });

    return () => { unsubProfile(); unsubAnnounce(); };
  }, [user]);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
         <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-ping"></div>
         <Skull size={64} className="text-cyan-500 relative z-10" />
      </div>
      <h1 className="text-2xl font-black italic tracking-tighter text-white">S.M.G BOXING</h1>
      <div className="text-cyan-600 font-mono text-[10px] tracking-[0.3em] animate-pulse mt-2 uppercase">Initialisation Shogun Core...</div>
    </div>
  );

  const renderPage = () => {
    if (currentRoute === AppRoute.REGISTER) {
      return (
        <div className="p-8 pt-20 space-y-8 animate-in fade-in pb-32">
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Nouveau<br/><span className="text-cyan-500">Profil</span></h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.target);
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), {
              firstName: f.get('fname'), lastName: f.get('lname'),
              phone: f.get('phone'), role: 'Member', category: 'Loisir',
              joinedAt: serverTimestamp(),
            }, { merge: true });
            setCurrentRoute(AppRoute.HOME);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input name="fname" placeholder="Prénom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
              <input name="lname" placeholder="Nom" className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none focus:border-cyan-500" required />
            </div>
            <input name="phone" placeholder="Téléphone" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none" required />
            <button type="submit" className="w-full bg-cyan-600 p-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-cyan-900/30 active:scale-95 transition-all">S'inscrire</button>
          </form>
        </div>
      );
    }

    switch (currentRoute) {
      case AppRoute.HOME: return <HomePage onNavigate={setCurrentRoute} announcements={announcements} profile={profile} />;
      case AppRoute.PROFILE: return (
        <div className="p-8 space-y-8 text-center pb-32">
           <div className="w-24 h-24 rounded-3xl bg-cyan-600 mx-auto flex items-center justify-center text-4xl font-black text-white italic shadow-2xl">
             {profile?.firstName?.charAt(0)}
           </div>
           <div><h2 className="text-2xl font-black text-white uppercase italic">{profile?.firstName} {profile?.lastName}</h2><p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">{profile?.role}</p></div>
           <button onClick={() => auth.signOut()} className="w-full p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-rose-500 font-black uppercase text-[10px]">Déconnexion</button>
        </div>
      );
      case AppRoute.TIMER: return (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 pb-32">
           <button onClick={() => setCurrentRoute(AppRoute.HOME)} className="flex items-center gap-2 text-cyan-500 text-[10px] font-bold uppercase"><ArrowLeft size={14}/> Retour</button>
           <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Boxing <span className="text-rose-500">Timer</span></h2>
           <div className="p-10 rounded-[3rem] border-4 border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center space-y-4 shadow-2xl">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">WORK</div>
              <div className="text-8xl font-black text-white font-mono tabular-nums">03:00</div>
           </div>
           <div className="flex gap-4">
              <button className="flex-1 bg-white text-black p-5 rounded-2xl font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">Start</button>
              <button className="p-5 border border-slate-800 rounded-2xl text-slate-400"><RotateCcw/></button>
           </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 relative shadow-2xl flex flex-col border-x border-slate-900/50">
        <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
          {renderPage()}
        </main>
        {user && profile && currentRoute !== AppRoute.REGISTER && (
           <Navbar currentRoute={currentRoute} onNavigate={setCurrentRoute} profile={profile} />
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;