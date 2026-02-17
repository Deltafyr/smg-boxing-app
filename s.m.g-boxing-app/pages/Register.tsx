import React, { useState } from 'react';
import { AppRoute, User, ChildProfile } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { User as UserIcon, Lock, Mail, Share2, Smartphone, Calendar, Users, Baby, Plus, X, Check } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onNavigate }) => {
  // Identité Adulte / Tuteur
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'H' | 'F'>('H');

  // Rôle
  const [isParent, setIsParent] = useState(false);
  const [isPractitioner, setIsPractitioner] = useState(true); // Par défaut, on s'inscrit pour soi

  // Enfants
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  
  // Formulaire temporaire enfant
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | ''>('');
  const [childGender, setChildGender] = useState<'H' | 'F'>('H');

  const handleAddChild = () => {
    if (!childName || !childAge) return;
    
    const newChild: ChildProfile = {
      id: Date.now().toString() + Math.random().toString(),
      name: childName,
      age: Number(childAge),
      gender: childGender
    };

    setChildrenList([...childrenList, newChild]);
    // Reset temp form
    setChildName('');
    setChildAge('');
    setChildGender('H');
  };

  const handleRemoveChild = (id: string) => {
    setChildrenList(childrenList.filter(c => c.id !== id));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Déterminer la catégorie
    let category: User['category'] = 'Loisir'; // Default
    if (isParent && !isPractitioner) {
      category = 'Parent';
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      age: Number(age),
      gender,
      role: 'Member',
      category: category,
      isParent,
      isPractitioner,
      children: isParent ? childrenList : []
    };

    // Sauvegarde "Mock"
    const storedUsers = localStorage.getItem('smg_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    users.push(newUser);
    localStorage.setItem('smg_users', JSON.stringify(users));

    onLogin(newUser);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Lien d\'inscription copié !');
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pb-24 space-y-6">
      <div className="text-center mt-4">
         <h1 className="text-2xl font-black text-white italic">NOUVEAU PROFIL</h1>
         <p className="text-slate-400 text-xs mt-1">Rejoignez la team S.M.G</p>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        
        {/* --- BLOC 1 : IDENTITÉ PRINCIPALE --- */}
        <FuturisticCard title="VOTRE IDENTITÉ" borderColor="cyan">
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
                  placeholder="Nom & Prénom"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
                  placeholder="Mot de passe"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <div className="relative">
                <Smartphone className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {/* Age & Genre */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="number" 
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
                  placeholder="Age"
                />
              </div>
              <div className="flex bg-slate-950 rounded-lg border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => setGender('H')}
                  className={`px-4 rounded transition-colors text-sm font-bold ${gender === 'H' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`px-4 rounded transition-colors text-sm font-bold ${gender === 'F' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}
                >
                  F
                </button>
              </div>
            </div>
          </div>
        </FuturisticCard>

        {/* --- BLOC 2 : RÔLE --- */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
           {/* Toggle Parent */}
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <Users className="text-cyan-400" />
                 <div>
                    <div className="text-sm font-bold text-white">Famille / Parent</div>
                    <div className="text-[10px] text-slate-500">Je supervise des enfants</div>
                 </div>
              </div>
              <button
                type="button"
                onClick={() => {
                   const newState = !isParent;
                   setIsParent(newState);
                   if (!newState) {
                     setChildrenList([]); // Reset children if untoggled? Optional.
                     setIsPractitioner(true);
                   }
                }}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isParent ? 'bg-cyan-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isParent ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>

           {/* Sous-option si Parent : Pratiquant ou Non */}
           {isParent && (
             <div className="flex items-center justify-between pt-4 border-t border-slate-800 animate-fade-in">
               <div className="text-sm text-slate-300">
                  Je pratique aussi la boxe
               </div>
               <div className="flex items-center space-x-2">
                 <button
                   type="button"
                   onClick={() => setIsPractitioner(true)}
                   className={`px-3 py-1 rounded text-xs font-bold border ${isPractitioner ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-slate-700 text-slate-500'}`}
                 >
                   OUI
                 </button>
                 <button
                   type="button"
                   onClick={() => setIsPractitioner(false)}
                   className={`px-3 py-1 rounded text-xs font-bold border ${!isPractitioner ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-500'}`}
                 >
                   NON
                 </button>
               </div>
             </div>
           )}
        </div>

        {/* --- BLOC 3 : ENFANTS (Si Parent) --- */}
        {isParent && (
          <FuturisticCard title="MES ENFANTS BOXEURS" borderColor="rose">
             {/* Liste des enfants ajoutés */}
             {childrenList.length > 0 && (
               <div className="space-y-2 mb-4">
                 {childrenList.map((child) => (
                   <div key={child.id} className="flex justify-between items-center bg-slate-900 border border-slate-700 p-2 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${child.gender === 'H' ? 'bg-cyan-900 text-cyan-400' : 'bg-rose-900 text-rose-400'}`}>
                          {child.gender}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{child.name}</div>
                          <div className="text-[10px] text-slate-400">{child.age} ans</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveChild(child.id)} className="text-slate-500 hover:text-rose-500">
                        <X size={16} />
                      </button>
                   </div>
                 ))}
               </div>
             )}

             {/* Formulaire ajout enfant */}
             <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 border-dashed">
                <div className="text-xs text-slate-500 font-bold mb-2 uppercase flex items-center">
                  <Baby size={14} className="mr-2" /> Ajouter un enfant
                </div>
                <div className="grid grid-cols-[1fr_80px] gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Prénom" 
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="Age" 
                    value={childAge}
                    onChange={e => setChildAge(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex space-x-2">
                      <button type="button" onClick={() => setChildGender('H')} className={`w-8 h-8 rounded text-xs font-bold ${childGender === 'H' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>H</button>
                      <button type="button" onClick={() => setChildGender('F')} className={`w-8 h-8 rounded text-xs font-bold ${childGender === 'F' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'}`}>F</button>
                   </div>
                   <button 
                     type="button" 
                     onClick={handleAddChild}
                     disabled={!childName || !childAge}
                     className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <Plus size={14} /> <span>AJOUTER</span>
                   </button>
                </div>
             </div>
          </FuturisticCard>
        )}

        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all transform active:scale-95"
        >
          VALIDER L'INSCRIPTION
        </button>
      </form>

      <div className="w-full max-w-sm pt-6">
        <button 
          onClick={copyLink}
          className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-white transition-colors p-3 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed hover:border-slate-600"
        >
           <Share2 size={16} />
           <span className="text-xs">Copier le lien d'invitation</span>
        </button>
      </div>

      <button 
        onClick={() => onNavigate(AppRoute.LOGIN)}
        className="text-slate-500 text-xs mt-2 hover:text-white"
      >
        Retour à la connexion
      </button>
    </div>
  );
};

export default Register;