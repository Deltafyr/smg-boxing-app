
import React, { useState, useEffect } from 'react';
import { AppRoute, User, ChildProfile } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { User as UserIcon, Lock, Mail, Share2, Smartphone, Calendar, Users, Baby, Plus, X } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onNavigate: (route: AppRoute) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [gender, setGender] = useState<'H' | 'F'>('H');

  const [isParent, setIsParent] = useState(false);
  const [isPractitioner, setIsPractitioner] = useState(true);

  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | ''>('');
  const [childGender, setChildGender] = useState<'H' | 'F'>('H');

  // Calcul auto de l'âge
  useEffect(() => {
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [birthDate]);

  const handleAddChild = () => {
    if (!childName || !childAge) return;
    const newChild: ChildProfile = {
      id: Date.now().toString() + Math.random().toString(),
      name: childName,
      age: Number(childAge),
      gender: childGender
    };
    setChildrenList([...childrenList, newChild]);
    setChildName('');
    setChildAge('');
    setChildGender('H');
  };

  const handleRemoveChild = (id: string) => {
    setChildrenList(childrenList.filter(c => c.id !== id));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    let category: User['category'] = 'Loisir';
    if (isParent && !isPractitioner) category = 'Parent';

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password, // Mot de passe stocké en clair comme demandé
      phone,
      birthDate,
      age: calculatedAge || 0,
      gender,
      role: 'Member',
      category: category,
      isParent,
      isPractitioner,
      children: isParent ? childrenList : []
    };

    const storedUsers = localStorage.getItem('smg_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    users.push(newUser);
    localStorage.setItem('smg_users', JSON.stringify(users));

    onLogin(newUser);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 pb-24 space-y-6">
      <div className="text-center mt-4">
         <h1 className="text-2xl font-black text-white italic">NOUVEAU PROFIL</h1>
         <p className="text-slate-400 text-xs mt-1">S'inscrire au club S.M.G</p>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-6">
        <FuturisticCard title="VOTRE IDENTITÉ" borderColor="cyan">
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm" placeholder="Nom & Prénom" />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm" placeholder="email@exemple.com" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm" placeholder="Mot de passe (en clair)" />
            </div>

            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm" placeholder="Téléphone" />
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="date" 
                  value={birthDate} 
                  onChange={e => setBirthDate(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-2 text-white text-sm" 
                />
              </div>
              <div className="text-cyan-400 font-bold text-xs px-2">
                {calculatedAge !== null ? `${calculatedAge} ans` : '--'}
              </div>
              <div className="flex bg-slate-950 rounded-lg border border-slate-700 p-1">
                <button type="button" onClick={() => setGender('H')} className={`px-3 rounded text-xs font-bold ${gender === 'H' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>H</button>
                <button type="button" onClick={() => setGender('F')} className={`px-3 rounded text-xs font-bold ${gender === 'F' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>F</button>
              </div>
            </div>
          </div>
        </FuturisticCard>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <Users className="text-cyan-400" />
                 <div className="text-sm font-bold text-white">Famille / Parent</div>
              </div>
              <button type="button" onClick={() => setIsParent(!isParent)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isParent ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isParent ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
           {isParent && (
             <div className="flex items-center justify-between pt-3 border-t border-slate-800">
               <span className="text-xs text-slate-300">Je pratique aussi la boxe</span>
               <button type="button" onClick={() => setIsPractitioner(!isPractitioner)} className={`px-3 py-1 rounded text-[10px] font-bold border ${isPractitioner ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-slate-700 text-slate-500'}`}>{isPractitioner ? 'OUI' : 'NON'}</button>
             </div>
           )}
        </div>

        {isParent && (
          <FuturisticCard title="ENFANTS BOXEURS" borderColor="rose">
             {childrenList.map((child) => (
               <div key={child.id} className="flex justify-between items-center bg-slate-900 border border-slate-700 p-2 rounded-lg mb-2">
                  <span className="text-sm text-white font-bold">{child.name} ({child.age} ans)</span>
                  <button type="button" onClick={() => handleRemoveChild(child.id)} className="text-rose-500"><X size={14} /></button>
               </div>
             ))}
             <div className="bg-slate-950 p-2 rounded border border-slate-800 border-dashed grid grid-cols-2 gap-2">
                <input type="text" placeholder="Prénom" value={childName} onChange={e => setChildName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                <input type="number" placeholder="Âge" value={childAge} onChange={e => setChildAge(Number(e.target.value))} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                <button type="button" onClick={handleAddChild} className="col-span-2 bg-rose-600 text-white rounded py-1.5 text-xs font-bold">AJOUTER ENFANT</button>
             </div>
          </FuturisticCard>
        )}

        <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">VALIDER L'INSCRIPTION</button>
      </form>
      <button onClick={() => onNavigate(AppRoute.LOGIN)} className="text-slate-500 text-xs">Retour à la connexion</button>
    </div>
  );
};

export default Register;
