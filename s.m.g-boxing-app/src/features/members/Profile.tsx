import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { ChevronRight, ArrowLeft, Save, LogOut, User as UserIcon, AlertCircle, Activity } from 'lucide-react';

interface ProfileProps {
  currentUser: User;
  onUpdate: (u: User) => void;
  onNavigate: (route: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdate, onNavigate }) => {
  const [formData, setFormData] = useState({
    phone: currentUser.phone || '',
    weight: currentUser.weight || '',
    emergencyContact: currentUser.emergencyContact || '',
    emergencyPhone: currentUser.emergencyPhone || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    signOut(getAuth());
    localStorage.removeItem('smg_current_user');
    window.location.reload();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');
    try {
      const userRef = doc(db, 'members', currentUser.id);
      await updateDoc(userRef, formData);
      onUpdate({ ...currentUser, ...formData });
      setMsg('Données tactiques mises à jour.');
    } catch (err) {
      setMsg('Erreur lors de la synchronisation.');
    }
    setIsLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 space-y-4 pb-24">
      <div className="w-full max-w-sm flex justify-between items-center mb-2 pt-4">
        <button onClick={() => onNavigate('home')} className="text-slate-500 hover:text-cyan-400 flex items-center text-xs font-bold uppercase transition-colors">
          <ArrowLeft size={14} className="mr-1" /> Retour
        </button>
        <button onClick={handleLogout} className="text-rose-500 hover:text-rose-400 flex items-center text-xs font-bold uppercase transition-colors bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
          <LogOut size={14} className="mr-2" /> Déconnexion
        </button>
      </div>

      <div className="text-center w-full mb-2">
        <div className="w-20 h-20 bg-slate-900 border border-cyan-500/50 rounded-full mx-auto mb-3 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
           <UserIcon size={32} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">{currentUser.name}</h1>
        <div className="flex justify-center items-center space-x-2">
           <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest px-2 py-0.5 bg-cyan-950/50 border border-cyan-900 rounded">{currentUser.role}</span>
           <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${currentUser.category === 'Compétiteur' ? 'bg-amber-950/50 text-amber-500 border-amber-900' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {currentUser.category || 'Loisir'}
           </span>
        </div>
      </div>
      
      <FuturisticCard className="w-full max-w-sm" borderColor="cyan">
        <form onSubmit={handleSave} className="space-y-5">
          
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 border-b border-slate-800 pb-1 mb-2 uppercase tracking-widest flex items-center"><Activity size={12} className="mr-2 text-cyan-500"/> Variables Ajustables</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Téléphone</label>
                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" placeholder="06..." />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Poids (kg)</label>
                <input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500 text-center" placeholder="Ex: 75.5" />
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20 mt-2">
            <h3 className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-widest flex items-center"><AlertCircle size={12} className="mr-2"/> Contact d'Urgence</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[9px] text-rose-400/80 font-bold uppercase mb-1 block">Nom du contact</label>
                <input name="emergencyContact" type="text" value={formData.emergencyContact} onChange={handleChange} className="w-full bg-slate-950 border border-rose-500/30 rounded-lg p-2 text-white text-xs outline-none focus:border-rose-500" placeholder="Proche à joindre" />
              </div>
              <div>
                <label className="text-[9px] text-rose-400/80 font-bold uppercase mb-1 block">Téléphone Urgence</label>
                <input name="emergencyPhone" type="tel" value={formData.emergencyPhone} onChange={handleChange} className="w-full bg-slate-950 border border-rose-500/30 rounded-lg p-2 text-white text-xs outline-none focus:border-rose-500" placeholder="Numéro" />
              </div>
            </div>
          </div>

          {msg && <p className={`text-[10px] text-center font-bold p-2 rounded ${msg.includes('Erreur') ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{msg}</p>}
          
          <div className="pt-2 border-t border-slate-800">
            <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3 rounded-xl flex justify-center items-center uppercase text-xs shadow-lg shadow-cyan-600/20 active:scale-95 transition-all">
              {isLoading ? 'ÉCRITURE...' : 'METTRE À JOUR'} <Save size={14} className="ml-2" />
            </button>
          </div>
        </form>
      </FuturisticCard>
    </div>
  );
};
export default Profile;
