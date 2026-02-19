import React, { useState, useRef } from 'react';
import { User, UserDocument } from '../types';
import FuturisticCard from '../components/ui/FuturisticCard';
import { 
  CheckCircle, CreditCard, LogOut, MapPin, 
  FileText, Camera, Upload, Trash2, Edit2, Save, X, DownloadCloud
} from 'lucide-react';

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState(user?.address || '');
  const [docType, setDocType] = useState<UserDocument['type']>('Certificat Médical');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mise à jour locale (simulation BDD)
  const updateUserData = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    
    // Update LocalStorage 'smg_current_user'
    localStorage.setItem('smg_current_user', JSON.stringify(updatedUser));
    
    // Update LocalStorage 'smg_users' list
    const storedUsers = localStorage.getItem('smg_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = updatedUser;
        localStorage.setItem('smg_users', JSON.stringify(users));
      }
    }
    
    // Force reload page to see changes
    window.location.reload();
  };

  const handleSaveAddress = () => {
    updateUserData({ address });
    setIsEditingAddress(false);
  };

  const processFile = (file: File) => {
    if (!user) return;
    
    // Simulation upload
    const newDoc: UserDocument = {
      id: Date.now().toString(),
      type: docType,
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      status: 'Pending'
    };

    const currentDocs = user.documents || [];
    updateUserData({ documents: [...currentDocs, newDoc] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const deleteDocument = (docId: string) => {
    if (!user || !user.documents) return;
    if (confirm('Supprimer ce document ?')) {
      const newDocs = user.documents.filter(d => d.id !== docId);
      updateUserData({ documents: newDocs });
    }
  };

  if (!user) return <div>Erreur utilisateur</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* --- HEADER PROFIL --- */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-cyan-500 p-1 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
           <img 
             src={`https://ui-avatars.com/api/?name=${user.name}&background=0f172a&color=22d3ee`} 
             alt="Profile" 
             className="w-full h-full rounded-full object-cover"
           />
        </div>
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
            user.category === 'Compétiteur' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 
            user.role === 'Admin' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
            'bg-cyan-500/20 border-cyan-500 text-cyan-400'
          }`}>
            {user.role === 'Member' ? user.category : user.role}
          </span>
          <span className="text-xs text-slate-500">ID: #{user.id.slice(-4)}</span>
        </div>
      </div>

      {/* --- STATUS RAPIDES --- */}
      <div className="grid grid-cols-2 gap-3">
        <FuturisticCard className="flex flex-col items-center justify-center py-4" borderColor='cyan'>
             <CheckCircle className="text-cyan-400 mb-2" size={24} />
           <span className="text-xs font-bold text-slate-300">DOCUMENTS</span>
           <span className="text-[10px] mt-1 text-cyan-500">
             {user.documents?.length || 0} Fichiers
           </span>
        </FuturisticCard>

        <FuturisticCard className="flex flex-col items-center justify-center py-4" borderColor='cyan'>
           <CreditCard className="text-cyan-400 mb-2" size={24} />
           <span className="text-xs font-bold text-slate-300">COTISATION</span>
           <span className="text-[10px] mt-1 text-cyan-500">À jour</span>
        </FuturisticCard>
      </div>

      {/* --- ADRESSE --- */}
      <FuturisticCard title="COORDONNÉES">
         <div className="space-y-4">
           <div className="text-sm text-slate-300">
             <p><span className="text-slate-500">Email:</span> {user.email}</p>
             <p><span className="text-slate-500">Tel:</span> {user.phone || 'Non renseigné'}</p>
           </div>
           
           <div className="pt-3 border-t border-slate-800">
             <div className="flex justify-between items-center mb-2">
               <div className="flex items-center text-xs text-slate-400 uppercase font-bold">
                 <MapPin size={14} className="mr-1 text-rose-500" /> Adresse Postale
               </div>
               {!isEditingAddress ? (
                 <button onClick={() => setIsEditingAddress(true)} className="text-cyan-400 hover:text-cyan-300">
                   <Edit2 size={14} />
                 </button>
               ) : (
                 <div className="flex space-x-2">
                   <button onClick={() => setIsEditingAddress(false)} className="text-slate-500">
                     <X size={16} />
                   </button>
                   <button onClick={handleSaveAddress} className="text-green-500">
                     <Save size={16} />
                   </button>
                 </div>
               )}
             </div>

             {isEditingAddress ? (
               <textarea
                 value={address}
                 onChange={(e) => setAddress(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                 rows={3}
                 placeholder="Entrez votre adresse complète..."
               />
             ) : (
               <p className="text-sm text-slate-300 italic">
                 {user.address || "Aucune adresse renseignée."}
               </p>
             )}
           </div>
         </div>
      </FuturisticCard>

      {/* --- DOCUMENTS --- */}
      <FuturisticCard title="COFFRE FORT NUMÉRIQUE" borderColor="rose">
        <div className="space-y-4">
          
          {/* Liste des documents existants */}
          <div className="space-y-2">
            {user.documents && user.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                 <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText size={20} className="text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{doc.type}</div>
                      <div className="text-[10px] text-slate-500 truncate">{doc.fileName} • {doc.date}</div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      doc.status === 'Valid' ? 'border-green-500 text-green-500' :
                      doc.status === 'Rejected' ? 'border-red-500 text-red-500' :
                      'border-yellow-500 text-yellow-500'
                    }`}>
                      {doc.status === 'Valid' ? 'Validé' : doc.status === 'Rejected' ? 'Refusé' : 'En attente'}
                    </span>
                    <button onClick={() => deleteDocument(doc.id)} className="text-slate-600 hover:text-rose-500">
                      <Trash2 size={14} />
                    </button>
                 </div>
              </div>
            ))}
            {(!user.documents || user.documents.length === 0) && (
              <div className="text-center py-4 border border-dashed border-slate-800 rounded">
                <span className="text-xs text-slate-600">Aucun document</span>
              </div>
            )}
          </div>

          {/* Zone d'ajout Drag & Drop */}
          <div className="pt-2 border-t border-slate-800">
             <div className="flex gap-2 mb-2">
               <select 
                 value={docType}
                 onChange={(e) => setDocType(e.target.value as any)}
                 className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs text-white p-2 outline-none"
               >
                 <option value="Certificat Médical">Certificat Médical</option>
                 <option value="Auto. Soins">Auto. Soins (Mineur/Compétiteur)</option>
                 <option value="Auto. Transport">Auto. Transport (Déplacement)</option>
                 <option value="Règlement">Règlement Signé</option>
                 <option value="Autre">Autre Document</option>
               </select>
             </div>
             
             <div 
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
               className={`border-2 border-dashed rounded-xl p-4 transition-all ${
                 isDragging 
                 ? 'border-cyan-400 bg-cyan-900/20' 
                 : 'border-slate-800 bg-slate-900/50'
               }`}
             >
               <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-300 font-bold mb-1">
                      {isDragging ? 'DÉPOSEZ LE FICHIER ICI' : 'AJOUTER UN DOCUMENT'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Prenez une photo ou glissez un fichier
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded border border-slate-600 transition-colors"
                    >
                      <Upload size={16} />
                      <span className="text-xs font-bold">Parcourir</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                            setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 100);
                        }
                      }}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white py-2 rounded border border-transparent shadow-lg shadow-rose-500/20 transition-colors"
                    >
                      <Camera size={16} />
                      <span className="text-xs font-bold">Caméra</span>
                    </button>
                  </div>
               </div>
             </div>
             
             {/* Hidden Input */}
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileUpload}
               className="hidden"
               accept="image/*,application/pdf"
             />
          </div>
        </div>
      </FuturisticCard>
      
      <div className="flex justify-center mt-6">
        <button 
          onClick={onLogout}
          className="flex items-center text-xs text-rose-500 hover:text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg bg-rose-500/10"
        >
          <LogOut size={14} className="mr-2" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Profile;