import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { BookOpen, Target, Crosshair, Swords, Edit3, Save, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const PLAYBOOK_ADULTES = [
  { bloc: "Bloc 1 : Fondations & Intégration (Sept - Oct)", content: "Apprentissage et consolidation des techniques de base. Accent sur l'endurance fondamentale. Garde, déplacements, poings/pieds de base, blocages, puis introduction aux techniques circulaires et esquives rotatives." },
  { bloc: "Bloc 2 : Développement & Pré-Compétition (Nov - Déc)", content: "Augmentation de l'intensité. Combinaison des techniques et introduction au technico-tactique. Protocole Pré-compétition, puis focus sur la contre-attaque simple ('Bloquer/Esquiver et riposter')." },
  { bloc: "Bloc 3 : Techniques Avancées & Spécifique (Jan - Fév)", content: "Enrichissement du bagage technique : coups de pieds retournés et sautés. Introduction à l'art de la feinte ('Faire réagir pour mieux toucher')." },
  { bloc: "Bloc 4 : Perfectionnement Tactique (Mars - Avril)", content: "Combinaisons complexes (feinte, attaque, déplacement). Application en situation de combat via des sparrings dirigés pour développer la lecture du jeu et s'adapter aux différents styles d'adversaires." },
  { bloc: "Bloc 5 : Bilan & Transition (Mai - Juin)", content: "Préparation intensive aux passages de grade. Répétition des enchaînements de grade, sparrings libres d'évaluation, et initiation à l'arbitrage." }
];

const PLAYBOOK_JEUNES = [
  { bloc: "Période 1 : Les Fondations (Sept - Oct)", content: "Construire son armure (garde), déplacements félins (agilité), frappes directes (jab/cross) et le mur défensif. Focus sur la maîtrise corporelle et l'équilibre." },
  { bloc: "Période 2 : Premières Combinaisons (Nov - Déc)", content: "Les crochets dévastateurs et le front kick. Enchaînements fluides (ex: Jab-Cross). Préparation à l'assaut ludique au toucher pour la Coupe de Noël." },
  { bloc: "Période 3 : Vitesse & Réflexes (Jan - Fév)", content: "Améliorer le temps de réaction. Le low kick stratégique et l'art de l'esquive rotative. Combinaisons d'esquive & riposte sur signaux visuels." },
  { bloc: "Période 4 : Travail avec Partenaire (Mars - Avril)", content: "Précision sur PAOs. Sparring technique contrôlé (sans puissance). Sparrings à thèmes et combinaisons complexes (4-5 coups) avec respect absolu du partenaire." },
  { bloc: "Période 5 : Bilan & Dépassement (Mai - Juin)", content: "Challenge du Kickboxeur complet (parcours mixant agilité, frappes, défense). Préparation aux tests de fin d'année et tournoi amical au toucher." }
];

export default function Courses({ currentUser }: { currentUser: User }) {
  const [groupTab, setGroupTab] = useState<'ADULTES' | 'JEUNES'>('ADULTES');
  const [expandedBloc, setExpandedBloc] = useState<number | null>(null);
  
  // States pour la Séance Actuelle (WOD)
  const [currentSession, setCurrentSession] = useState({ theme: '', technique: '', sparring: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';

  // Charger la séance de la semaine depuis Firebase
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'planning', groupTab.toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCurrentSession(docSnap.data() as any);
        } else {
          // Valeurs par défaut basées sur Mars (Bloc 4 pour adultes, Période 4 pour jeunes)
          const defaultSession = groupTab === 'ADULTES' 
            ? { theme: "Semaine 23 : Combinaisons complexes", technique: "Lier feinte de regard, attaque en ligne et désaxement.", sparring: "Thème : Frapper et sortir de l'axe." }
            : { theme: "Semaine 14 : Précision sur PAOs", technique: "Combinaisons de 4 coups avec vitesse.", sparring: "Assaut technique au toucher uniquement." };
          setCurrentSession(defaultSession);
        }
      } catch (e) { console.error(e); }
      setIsLoading(false);
    };
    fetchSession();
    setExpandedBloc(null); // Reset accordion on tab change
  }, [groupTab]);

  const handleSaveSession = async () => {
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'planning', groupTab.toLowerCase()), currentSession);
      setIsEditing(false);
    } catch (e) {
      alert("Erreur lors de la sauvegarde du programme.");
    }
    setIsLoading(false);
  };

  const playbookToDisplay = groupTab === 'ADULTES' ? PLAYBOOK_ADULTES : PLAYBOOK_JEUNES;

  // SCROLL FIX ABSOLU (Utilisé dans toutes nos pages)
  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* EN-TETE */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Planification</h2>
            <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Playbook S.M.G</span>
          </div>
          <BookOpen className="text-slate-500" size={24} />
        </div>

        {/* TABS (ADULTES / JEUNES) */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 shadow-lg">
          <button onClick={() => setGroupTab('ADULTES')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${groupTab === 'ADULTES' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            <Shield size={14} className="mr-2"/> Adultes & Compétiteurs
          </button>
          <button onClick={() => setGroupTab('JEUNES')} className={`flex-1 py-2.5 text-xs font-black uppercase rounded transition-all flex items-center justify-center ${groupTab === 'JEUNES' ? 'bg-amber-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            <Zap size={14} className="mr-2"/> Jeunes (10-14 ans)
          </button>
        </div>

        {/* CARTE : SÉANCE DE LA SEMAINE (WOD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-amber-500 w-full"></div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                <Target size={16} className="mr-2 text-rose-500" /> Focus de la Semaine
              </h3>
              {isStaff && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-cyan-400 p-1 transition-colors">
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-center text-cyan-500 text-xs font-mono animate-pulse py-6">Chargement du programme...</p>
            ) : isEditing ? (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Titre / Thème global</label>
                  <input type="text" value={currentSession.theme} onChange={e => setCurrentSession({...currentSession, theme: e.target.value})} className="w-full bg-slate-950 border border-cyan-500/50 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-400" placeholder="Ex: Semaine 23 - Adaptation" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Ateliers Techniques</label>
                  <textarea value={currentSession.technique} onChange={e => setCurrentSession({...currentSession, technique: e.target.value})} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 resize-none" placeholder="Détail des exercices..." />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Consignes Sparring</label>
                  <textarea value={currentSession.sparring} onChange={e => setCurrentSession({...currentSession, sparring: e.target.value})} rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 resize-none" placeholder="Thèmes d'opposition..." />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase hover:bg-slate-700 transition-colors">Annuler</button>
                  <button onClick={handleSaveSession} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center shadow-lg hover:bg-cyan-500 transition-colors"><Save size={14} className="mr-2"/> Enregistrer</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-sm font-black text-cyan-400 uppercase tracking-wide">{currentSession.theme || 'Thème non défini'}</p>
                </div>
                
                <div className="flex space-x-3 items-start">
                  <div className="p-2 bg-slate-800 rounded-lg mt-1"><Crosshair size={14} className="text-amber-500"/></div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Technique</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{currentSession.technique || 'Aucun détail technique fourni pour le moment.'}</p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start">
                  <div className="p-2 bg-slate-800 rounded-lg mt-1"><Swords size={14} className="text-rose-500"/></div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Sparring / Opposition</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{currentSession.sparring || 'Aucune consigne d\'opposition fournie.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION : LE PLAYBOOK ANNUEL (RÉFÉRENCE) */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center">
            <BookOpen size={14} className="mr-2 text-slate-500"/> Fil Conducteur Annuel
          </h3>
          
          <div className="space-y-3">
            {playbookToDisplay.map((block, idx) => {
              const isExpanded = expandedBloc === idx;
              return (
                <div key={idx} className={`bg-slate-900 border ${isExpanded ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300`}>
                  <button 
                    onClick={() => setExpandedBloc(isExpanded ? null : idx)}
                    className="w-full bg-slate-800/30 p-4 flex justify-between items-center text-left focus:outline-none hover:bg-slate-800/50 transition-colors"
                  >
                    <span className={`text-xs font-black uppercase tracking-wider ${isExpanded ? 'text-white' : 'text-slate-400'}`}>{block.bloc}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-cyan-500" /> : <ChevronDown size={16} className="text-slate-600" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800 bg-slate-900/80 animate-fade-in">
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">{block.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}