import React, { useState, useEffect } from 'react';
import { AppRoute, User, Announcement } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimerPage from './pages/Timer';
import Members from './pages/Members';
import Tournament from './pages/Tournament';
import CalendarPage from './pages/Calendar';
import Info from './pages/Info';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';

// Composant Splash Screen Interne
const SplashScreen = () => (
  <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
       {/* Effet de pulsation derrière le logo */}
       <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-ping"></div>
       <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-rose-500/30 rounded-full blur-md animate-pulse"></div>
       
       {/* Logo CSS */}
       <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-black border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
         <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white tracking-tighter pr-1">SMG</span>
       </div>
    </div>
    <div className="flex flex-col items-center space-y-2">
      <h1 className="text-2xl font-black italic tracking-tighter text-white">S.M.G</h1>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <div className="text-cyan-600 font-mono text-[10px] tracking-[0.3em] animate-pulse mt-2">
        INITIALISATION...
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LOGIN);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: '1', title: 'Bienvenue au S.M.G', content: 'L\'application est désormais en ligne !', date: '25/10/2023', author: 'Admin', priority: 'High' }
  ]);

  // Simulation du chargement initial et vérification session
  useEffect(() => {
    // Check session storage
    const storedUser = localStorage.getItem('smg_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setCurrentRoute(AppRoute.HOME);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('smg_current_user', JSON.stringify(user));
    setCurrentRoute(AppRoute.HOME);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smg_current_user');
    setCurrentRoute(AppRoute.LOGIN);
  };

  const addAnnouncement = (ann: Announcement) => {
    setAnnouncements([...announcements, ann]);
  };

  const renderPage = () => {
    // Routes publiques
    if (currentRoute === AppRoute.LOGIN) return <Login onLogin={handleLogin} onNavigate={setCurrentRoute} />;
    if (currentRoute === AppRoute.REGISTER) return <Register onLogin={handleLogin} onNavigate={setCurrentRoute} />;

    // Routes protégées
    if (!currentUser) {
       return <Login onLogin={handleLogin} onNavigate={setCurrentRoute} />;
    }

    switch (currentRoute) {
      case AppRoute.HOME:
        return <Home onNavigate={setCurrentRoute} announcements={announcements} currentUser={currentUser} />;
      case AppRoute.TIMER:
        return <TimerPage />;
      case AppRoute.MEMBERS:
        // Passage de currentUser pour gérer les droits d'édition
        return <Members currentUser={currentUser} />;
      case AppRoute.TOURNAMENT:
        // Passage de currentUser pour gérer l'affichage Admin vs Competiteur
        return <Tournament currentUser={currentUser} />;
      case AppRoute.CALENDAR:
        return <CalendarPage />;
      case AppRoute.INFO:
        return <Info />;
      case AppRoute.CHAT:
        return <Chat currentUser={currentUser} />;
      case AppRoute.PROFILE:
        return <Profile user={currentUser} onLogout={handleLogout} />;
      case AppRoute.ADMIN:
        // Sécurité supplémentaire : si pas admin/coach, retour home
        if (currentUser.role !== 'Admin' && currentUser.role !== 'Coach') {
          return <Home onNavigate={setCurrentRoute} announcements={announcements} currentUser={currentUser} />;
        }
        return <Admin currentUser={currentUser} announcements={announcements} onAddAnnouncement={addAnnouncement} />;
      default:
        return <Home onNavigate={setCurrentRoute} announcements={announcements} currentUser={currentUser} />;
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="max-w-md mx-auto min-h-screen bg-slate-950 relative shadow-2xl shadow-black overflow-hidden flex flex-col">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-transparent opacity-50 pointer-events-none z-0"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <main className="relative z-10 flex-1 overflow-y-auto scroll-smooth">
          {renderPage()}
        </main>

        {currentUser && (
           <Navbar currentRoute={currentRoute} onNavigate={setCurrentRoute} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default App;