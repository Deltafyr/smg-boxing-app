import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function SystemDashboard() {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <ShieldAlert size={48} className="text-cyan-500 mb-4 animate-pulse" />
      <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Cortex Admin</h2>
      <p className="text-xs text-slate-400 font-mono">Module synchronisé. Interface en cours de restauration.</p>
    </div>
  );
}