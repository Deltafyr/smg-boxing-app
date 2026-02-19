import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, Trophy, User as UserIcon, ShieldAlert, Calendar } from 'lucide-react';

// --- Imports de l'architecture Feature-Based ---
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './pages/Home';
import Members from './features/members/Members';
import Profile from './features/members/Profile';
import Admin from './features/admin/Admin';
import SystemDashboard from './features/admin/SystemDashboard';
import CalendarPage from './features/calendar/Calendar';
import Chat from './features/chat/Chat';
import Info from './pages/Info';
import TimerPage from './features/training/Timer';
import Tournament from './features/tournament/Tournament';

// --- Types ---
import { User, Announcement } from './types'; // Assure-toi que types.ts est bien dans src/

// --- Barre de Navigation Mobile ---
const BottomNav = ({ role }: { role: string }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =;

  if (role === 'Admin') {
    navItems.push({ id: 'system', icon: ShieldAlert, path: '/system', label: 'Système' });
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 px-2 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300 ${
                isActive? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <item.icon size={isActive? 22 : 20} className="mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
              {isActive && <div className="absolute top-0 w-8 h-0.5 bg-cyan-400 rounded-b-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Composant Principal ---
const AppContent = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // État partagé pour les annonces (à lier à Firebase ultérieurement)
  const [announcements, setAnnouncements] = useState<Announcement>();

  // Restauration de session
  useEffect(() => {
    const storedUser = localStorage.getItem('smg_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsInitializing(false);
  },);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smg_current_user');
    navigate('/login');
  };

  // Convertisseur de route pour tes anciens composants
  const handleNavigate = (routeStr: string) => {
    navigate(`/${routeStr.toLowerCase()}`);
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-cyan-500 font-mono animate-pulse">SÉQUENCE D'AMORÇAGE...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans selection:bg-cyan-500/30 selection:text-cyan-100 flex justify-center">
      <main className="w-full max-w-md relative bg-[#121212] min-h-screen shadow-2xl border-x border-slate-900/50 overflow-x-hidden">
        
        <Routes>
          {/* Routes Publiques */}
          <Route path="/login" element={!currentUser? <Login onLogin={handleLogin} onNavigate={handleNavigate} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!currentUser? <Register onLogin={handleLogin} onNavigate={handleNavigate} /> : <Navigate to="/home" />} />
          <Route path="/info" element={<Info />} />

          {/* Routes Protégées */}
          <Route path="/" element={currentUser? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route path="/home" element={currentUser? <Home currentUser={currentUser} announcements={announcements} onNavigate={handleNavigate} /> : <Navigate to="/login" />} />
          <Route path="/members" element={currentUser? <Members currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={currentUser? <Profile user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={currentUser? <CalendarPage /> : <Navigate to="/login" />} />
          <Route path="/chat" element={currentUser? <Chat currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/timer" element={currentUser? <TimerPage /> : <Navigate to="/login" />} />
          <Route path="/tournament" element={currentUser? <Tournament currentUser={currentUser} /> : <Navigate to="/login" />} />
          
          {/* Routes d'Administration */}
          <Route path="/admin" element={currentUser?.role === 'Admin'? <Admin currentUser={currentUser} announcements={announcements} onAddAnnouncement={(a) => setAnnouncements([...announcements, a])} /> : <Navigate to="/home" />} />
          <Route path="/system" element={currentUser?.role === 'Admin'? <SystemDashboard /> : <Navigate to="/home" />} />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to={currentUser? "/home" : "/login"} replace />} />
        </Routes>

        {/* Affichage conditionnel de la Bottom Nav si l'utilisateur est connecté */}
        {currentUser && <BottomNav role={currentUser.role} />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}