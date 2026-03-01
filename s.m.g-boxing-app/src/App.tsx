import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, Trophy, ShieldAlert } from 'lucide-react';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './pages/Home';
import Members from './features/members/Members';
import Profile from './features/members/Profile';
import SystemDashboard from './features/admin/SystemDashboard';
import Tournament from './features/tournament/Tournament';
import CalendarPage from './features/calendar/Calendar';
import TimerPage from './features/training/Timer';
import { User } from './types';

const BottomNav = ({ role }: { role: string }) => {
  const navigate = useNavigate(); const location = useLocation();
  const navItems = [
    { id: 'home', icon: HomeIcon, path: '/home', label: 'Accueil' },
    { id: 'members', icon: Users, path: '/members', label: 'Membres' },
    { id: 'tournament', icon: Trophy, path: '/tournament', label: 'Arène' }
  ];
  if (role === 'Admin') navItems.push({ id: 'system', icon: ShieldAlert, path: '/system', label: 'Cortex' });

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 h-16 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button key={item.id} onClick={() => navigate(item.path)} className={`flex flex-col items-center justify-center transition-all ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-400'}`}>
            <item.icon size={20} /><span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('smg_current_user');
    if (stored) { try { setCurrentUser(JSON.parse(stored)); } catch (e) { localStorage.removeItem('smg_current_user'); } }
    setIsInitializing(false);
  }, []);

  const handleUpdateUser = (u: User) => { setCurrentUser(u); localStorage.setItem('smg_current_user', JSON.stringify(u)); };

  if (isInitializing) return <div className="min-min-min-min-min-min-h-screen bg-[#121212] flex items-center justify-center text-cyan-500 font-mono">SYNC...</div>;

  return (
    <div className="min-min-min-min-min-min-h-screen bg-[#121212] text-[#eee] flex justify-center selection:bg-cyan-500/30">
      <main className="w-full max-w-md relative min-min-min-min-min-min-h-screen shadow-2xl border-x border-slate-900/50 overflow-x-hidden">
        <Routes>
          <Route path="/login" element={!currentUser ? <Login onLogin={(u) => {setCurrentUser(u); navigate('/home');}} onNavigate={(r) => navigate('/' + r)} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!currentUser ? <Register onLogin={(u) => {setCurrentUser(u); navigate('/home');}} onNavigate={(r) => navigate('/' + r)} /> : <Navigate to="/home" />} />
          <Route path="/home" element={currentUser ? <Home currentUser={currentUser} onNavigate={(r) => navigate('/' + r.toLowerCase())} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={currentUser ? <Profile currentUser={currentUser} onUpdate={handleUpdateUser} onNavigate={(r) => navigate('/' + r.toLowerCase())} /> : <Navigate to="/login" />} />
          <Route path="/members" element={currentUser ? <Members currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/system" element={currentUser?.role === 'Admin' ? <SystemDashboard /> : <Navigate to="/home" />} />
          <Route path="/tournament" element={currentUser ? <Tournament currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={currentUser ? <CalendarPage currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/timer" element={currentUser ? <TimerPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} />} />
        </Routes>
        {currentUser && <BottomNav role={currentUser.role} />}
      </main>
    </div>
  );
};
export default function App() { return <Router><AppContent /></Router>; }
