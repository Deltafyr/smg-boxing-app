import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { ChevronRight, ArrowLeft, User as UserIcon, AlertCircle } from 'lucide-react';

export default function Register({ onLogin, onNavigate }: { onLogin: (u: User)=>void, onNavigate: (r: string)=>void }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', birthDate: '', gender: 'Homme', memberType: 'Adulte', weight: '', emergencyContact: '', emergencyPhone: '' });
  const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser: User = { id: cred.user.uid, name: `${formData.firstName} ${formData.lastName}`.trim(), firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone, birthDate: formData.birthDate, gender: formData.gender as any, memberType: formData.memberType as any, category: 'Loisir', weight: formData.weight, emergencyContact: formData.emergencyContact, emergencyPhone: formData.emergencyPhone, role: 'Member' };
      await setDoc(doc(db, 'members', cred.user.uid), newUser);
      localStorage.setItem('smg_current_user', JSON.stringify(newUser));
      onLogin(newUser);
    } catch (err: any) { setError('Erreur de création: ' + err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 space-y-4">
      <div className="w-full max-w-sm flex justify-start mb-2 pt-4"><button onClick={() => onNavigate('login')} className="text-slate-500 hover:text-cyan-400 flex items-center text-xs font-bold uppercase transition-colors"><ArrowLeft size={14} className="mr-1" /> Retour</button></div>
      <div className="text-center w-full mb-4"><h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">Dossier Combattant</h1><p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Incorporation S.M.G</p></div>
      <FuturisticCard className="w-full max-w-sm max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-10" borderColor="cyan">
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 border-b border-slate-800 pb-1 mb-2 uppercase tracking-widest flex items-center"><UserIcon size={12} className="mr-2 text-cyan-500"/> Identité Civile</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Prénom *</label><input name="firstName" type="text" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" required /></div>
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Nom *</label><input name="lastName" type="text" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Naissance *</label><input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500 text-center" required /></div>
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Sexe</label><select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500"><option value="Homme">Homme</option><option value="Femme">Femme</option><option value="Autre">Autre</option></select></div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 border-b border-slate-800 pb-1 mb-2 uppercase tracking-widest flex items-center"><ChevronRight size={12} className="mr-2 text-cyan-500"/> Accès & Contact</h3>
            <div className="grid grid-cols-1 gap-3">
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Email (Identifiant) *</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Mot de Passe *</label><input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" required minLength={6} placeholder="••••••••" /></div>
                <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Téléphone *</label><input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" required placeholder="06..." /></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 border-b border-slate-800 pb-1 mb-2 uppercase tracking-widest flex items-center"><ChevronRight size={12} className="mr-2 text-cyan-500"/> Profil Club</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Type de Membre</label><select name="memberType" value={formData.memberType} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500"><option value="Enfant">Enfant (-12)</option><option value="Junior">Junior (12-17)</option><option value="Adulte">Adulte (+18)</option><option value="Parent">Parent (Non-prat.)</option></select></div>
              <div><label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Poids (kg) - Opt.</label><input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-cyan-500" placeholder="Ex: 75.5" /></div>
            </div>
            <p className="text-[8px] text-slate-500 italic mt-1 bg-slate-900/50 p-2 rounded border border-slate-800">Statut par défaut: <strong className="text-cyan-500">LOISIR</strong>.</p>
          </div>
          <div className="space-y-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
            <h3 className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-widest flex items-center"><AlertCircle size={12} className="mr-2"/> Contact d'Urgence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-rose-400/80 font-bold uppercase mb-1 block">Nom *</label><input name="emergencyContact" type="text" value={formData.emergencyContact} onChange={handleChange} className="w-full bg-slate-950 border border-rose-500/30 rounded-lg p-2 text-white text-xs outline-none focus:border-rose-500" required placeholder="Proche à joindre" /></div>
              <div><label className="text-[9px] text-rose-400/80 font-bold uppercase mb-1 block">Téléphone *</label><input name="emergencyPhone" type="tel" value={formData.emergencyPhone} onChange={handleChange} className="w-full bg-slate-950 border border-rose-500/30 rounded-lg p-2 text-white text-xs outline-none focus:border-rose-500" required placeholder="Numéro" /></div>
            </div>
          </div>
          {error && <p className="text-rose-500 text-[10px] text-center font-bold bg-rose-500/10 p-2 rounded">{error}</p>}
          <div className="pt-4 pb-2 border-t border-slate-800"><button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl flex justify-center items-center uppercase text-xs shadow-lg shadow-cyan-600/20 active:scale-95 transition-all">{isLoading ? 'GÉNÉRATION...' : 'VALIDER L\'INCORPORATION'} <ChevronRight size={16} className="ml-2" /></button></div>
        </form>
      </FuturisticCard>
    </div>
  );
}
