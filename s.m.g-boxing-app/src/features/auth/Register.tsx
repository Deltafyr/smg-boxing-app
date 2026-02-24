import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onNavigate: (route: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    category: 'Loisir'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Création de l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Préparation du profil
      const newUser: User = {
        id: uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        role: 'Member', // Membre par défaut
      };

      // 3. Sauvegarde dans la base de données Firestore
      await setDoc(doc(db, 'members', uid), newUser);

      // 4. Session locale et redirection
      localStorage.setItem('smg_current_user', JSON.stringify(newUser));
      onLogin(newUser);

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit faire au moins 6 caractères.');
      } else {
        setError('Erreur lors de la création du profil.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-6">
      <div className="w-full flex justify-start">
        <button onClick={() => onNavigate('login')} className="text-slate-500 hover:text-cyan-400 flex items-center text-xs font-bold uppercase transition-colors">
          <ArrowLeft size={14} className="mr-1" /> Retour
        </button>
      </div>

      <div className="text-center w-full">
        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">Nouveau Combattant</h1>
        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Initialisation du profil</p>
      </div>
      
      <FuturisticCard className="w-full max-w-sm" borderColor="cyan">
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Nom Complet</label>
            <input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-cyan-500" placeholder="ex: Jean Dupont" required />
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Adresse Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-cyan-500" placeholder="jean@exemple.com" required />
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Mot de Passe (6 car. min)</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-cyan-500" placeholder="••••••••" required minLength={6} />
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Numéro de Téléphone</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-cyan-500" placeholder="06 12 34 56 78" required />
          </div>

          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">Catégorie</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-cyan-500">
              <option value="Loisir">Loisir</option>
              <option value="Compétiteur">Compétiteur</option>
              <option value="Pro">Professionnel</option>
              <option value="Parent">Parent d'élève</option>
            </select>
          </div>

          {error && <p className="text-rose-500 text-[10px] text-center font-bold bg-rose-500/10 p-2 rounded">{error}</p>}
          
          <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3 rounded-lg flex justify-center items-center uppercase text-xs shadow-lg active:scale-95 transition-all mt-4">
            {isLoading ? 'GÉNÉRATION...' : 'CRÉER LE PROFIL'} <ChevronRight size={16} className="ml-2" />
          </button>
        </form>
      </FuturisticCard>
    </div>
  );
};
export default Register;
