import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Users, Trophy, User as UserIcon, ShieldAlert } from 'lucide-react';

import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './pages/Home';
import Members from './features/members/Members';
import Profile from './features/members/Profile';
import SystemDashboard from './features/admin/SystemDashboard';
import Tournament from './features/tournament/Tournament';
import { User, Announcement, AppRoute } from './types';

const BottomNav = ({ role }: { role: string }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =;

  if (role === 'Admin') {
    navItems.push({ id: 'system', icon: ShieldAlert, path: '/system', label: 'Cortex' });
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 h-16 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button 
            key={item.id} 
            onClick={() => navigate(item.path)} 
            className={`flex flex-col items-center justify-center transition-all ${isActive? 'text-cyan-400 scale-110' : 'text-slate-500'}`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{item.label}</span>
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
  const [announcements, setAnnouncements] = useState<Announcement>();

  useEffect(() => {
    const stored = localStorage.getItem('smg_current_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('smg_current_user');
      }
    }
    setIsInitializing(false);
  },);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/home');
  };

  if (isInitializing) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-cyan-500 font-mono">SYNC S.M.G...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#eee] flex justify-center">
      <main className="w-full max-w-md relative min-h-screen shadow-2xl border-x border-slate-900/50 overflow-x-hidden">
        <Routes>
          <Route path="/login" element={!currentUser? <Login onLogin={handleLogin} onNavigate={(r) => navigate('/' + r.toLowerCase())} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!currentUser? <Register onLogin={handleLogin} onNavigate={(r) => navigate('/' + r.toLowerCase())} /> : <Navigate to="/home" />} />
          <Route path="/home" element={currentUser? <Home currentUser={currentUser} announcements={announcements} onNavigate={(r) => navigate('/' + r.toLowerCase())} /> : <Navigate to="/login" />} />
          <Route path="/members" element={currentUser? <Members currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={currentUser? <Profile user={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('smg_current_user'); navigate('/login'); }} /> : <Navigate to="/login" />} />
          <Route path="/system" element={currentUser?.role === 'Admin'? <SystemDashboard /> : <Navigate to="/home" />} />
          <Route path="/tournament" element={currentUser? <Tournament currentUser={currentUser} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={currentUser? "/home" : "/login"} />} />
        </Routes>
        {currentUser && <BottomNav role={currentUser.role} />}
      </main>
    </div>
  );
};

export default function App() { return <Router><AppContent /></Router>; }