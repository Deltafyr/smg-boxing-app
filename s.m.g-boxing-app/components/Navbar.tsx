import React from 'react';
import { Timer, MessageSquare, Home, User, ShieldCheck } from 'lucide-react';
import { AppRoute, User as UserType } from '../types';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: UserType | null;
}

const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate, currentUser }) => {
  const navItems = [
    { id: AppRoute.HOME, icon: Home, label: 'Accueil' },
    { id: AppRoute.TIMER, icon: Timer, label: 'Chrono' },
    { id: AppRoute.CHAT, icon: MessageSquare, label: 'Chat' },
    { id: AppRoute.PROFILE, icon: User, label: 'Profil' },
  ];

  // Add Admin Tab if user is Admin or Coach
  if (currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Coach')) {
    navItems.push({ id: AppRoute.ADMIN, icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                isActive ? 'text-cyan-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon size={isActive ? 24 : 18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-8 bg-cyan-500/20 blur-xl rounded-full pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;