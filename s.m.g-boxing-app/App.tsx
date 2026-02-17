import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimerPage from './pages/Timer';
import Members from './pages/Members';
import Tournament from './pages/Tournament';
import CalendarPage from './pages/Calendar';
import Info from './pages/Info';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);

  const renderPage = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <Home onNavigate={setCurrentRoute} />;
      case AppRoute.TIMER:
        return <TimerPage />;
      case AppRoute.MEMBERS:
        return <Members />;
      case AppRoute.TOURNAMENT:
        return <Tournament />;
      case AppRoute.CALENDAR:
        return <CalendarPage />;
      case AppRoute.INFO:
        return <Info />;
      case AppRoute.CHAT:
        return <Chat />;
      case AppRoute.PROFILE:
        return <Profile />;
      default:
        return <Home onNavigate={setCurrentRoute} />;
    }
  };

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

        <Navbar currentRoute={currentRoute} onNavigate={setCurrentRoute} />
      </div>
    </div>
  );
};

export default App;