import React from 'react';
import FuturisticCard from '../components/ui/FuturisticCard';

const Info: React.FC = () => {
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-white italic">S.M.G</h1>
        <p className="text-cyan-400 font-mono tracking-widest text-sm">BOXING CLUB 01</p>
      </div>

      <FuturisticCard title="À PROPOS">
        <p className="text-sm text-slate-300 leading-relaxed">
          Le S.M.G Boxing Club est dédié à l'excellence sportive. De l'initiation à la compétition de haut niveau, nous formons les champions de demain dans un environnement rigoureux et moderne.
        </p>
      </FuturisticCard>

      <FuturisticCard title="HORAIRES">
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Lundi</span>
            <span>18h00 - 21h00</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Mercredi</span>
            <span>18h00 - 21h00</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span>Vendredi</span>
            <span>19h00 - 21h30</span>
          </div>
           <div className="flex justify-between text-cyan-400 font-bold">
            <span>Samedi (Compétiteurs)</span>
            <span>10h00 - 12h00</span>
          </div>
        </div>
      </FuturisticCard>

      <FuturisticCard title="CONTACT">
        <div className="text-sm text-slate-300 space-y-2">
           <p>📍 Gymnase Pierre de Coubertin</p>
           <p>📞 06 12 34 56 78</p>
           <p>📧 contact@smg-boxing.com</p>
        </div>
      </FuturisticCard>
      
      <div className="text-center text-[10px] text-slate-600 mt-8">
        v1.0.0 - S.M.G App
      </div>
    </div>
  );
};

export default Info;