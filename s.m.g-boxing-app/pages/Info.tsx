import React from 'react';
import FuturisticCard from '../components/ui/FuturisticCard';
import { Download } from 'lucide-react';

const Info: React.FC = () => {
  const downloadMock = (fileName: string) => {
    alert(`Téléchargement de ${fileName} (Simulation)`);
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 p-2 shadow-lg shadow-cyan-900/20">
          <img src="/logo.png?v=2" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
            <h1 className="text-3xl font-black text-white italic">S.M.G</h1>
            <p className="text-cyan-400 font-mono tracking-widest text-sm">BOXING CLUB 01</p>
        </div>
      </div>

      <FuturisticCard title="À PROPOS">
        <p className="text-sm text-slate-300 leading-relaxed">
          Le S.M.G Boxing Club est dédié à l'excellence sportive. De l'initiation à la compétition de haut niveau, nous formons les champions de demain dans un environnement rigoureux et moderne.
        </p>
      </FuturisticCard>

      <FuturisticCard title="DOCUMENTS À TÉLÉCHARGER" borderColor="cyan">
        <div className="space-y-2">
          <p className="text-xs text-slate-400 mb-2">
            Téléchargez les formulaires vierges ci-dessous, remplissez-les et déposez-les dans votre Espace Profil.
          </p>
          {[
            "Certificat Médical Type.pdf",
            "Règlement Intérieur 2024.pdf",
            "Autorisation Parentale.pdf",
            "Fiche Inscription Compétiteur.pdf"
          ].map((doc, idx) => (
            <button 
              key={idx}
              onClick={() => downloadMock(doc)}
              className="w-full flex justify-between items-center bg-slate-950 hover:bg-slate-800 p-3 rounded border border-slate-800 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">{doc}</span>
              <Download size={16} className="text-cyan-500" />
            </button>
          ))}
        </div>
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
        v1.0.2 - S.M.G App
      </div>
    </div>
  );
};

export default Info;