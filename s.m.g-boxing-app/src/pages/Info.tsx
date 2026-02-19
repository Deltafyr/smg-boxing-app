import React from 'react';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Download } from 'lucide-react';

const Info: React.FC = () => {
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 p-1 flex items-center justify-center overflow-hidden"><img src="/logo.png?v=2" alt="SMG Logo" className="w-full h-full object-contain" /></div>
        <div><h1 className="text-3xl font-black text-white italic">S.M.G</h1><p className="text-cyan-400 font-mono tracking-widest text-sm">BOXING CLUB 01</p></div>
      </div>
      <FuturisticCard title="À PROPOS"><p className="text-sm text-slate-300">Le S.M.G Boxing Club est dédié à l'excellence sportive.</p></FuturisticCard>
    </div>
  );
};
export default Info;
