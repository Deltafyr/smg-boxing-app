import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, UserRole } from '../../types';
import FuturisticCard from '../../components/ui/FuturisticCard';

interface MembersProps {
  currentUser: User;
}

const Members: React.FC<MembersProps> = ({ currentUser }) => {
  const [memberList, setMemberList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'members'));
        const users: User[] = [];
        querySnapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() } as User));
        setMemberList(users);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (isLoading) return <div className="p-10 text-center text-cyan-400 font-mono animate-pulse">SYNCHRONISATION...</div>;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h2 className="text-2xl font-black text-white tracking-tight italic mb-6">MEMBRES CLUB</h2>
      <div className="space-y-4">
        {memberList.map((user) => (
          <FuturisticCard key={user.id} borderColor={user.role === 'Admin' ? 'rose' : 'cyan'}>
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
               <div><h3 className="font-bold text-slate-100">{user.name}</h3><span className="text-[10px] text-cyan-500">{user.role}</span></div>
            </div>
          </FuturisticCard>
        ))}
        {memberList.length === 0 && <div className="text-center py-10 text-slate-500">Aucun membre.</div>}
      </div>
    </div>
  );
};
export default Members;
