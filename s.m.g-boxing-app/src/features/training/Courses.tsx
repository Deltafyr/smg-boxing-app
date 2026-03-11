import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { BookOpen, Target, Crosshair, Swords, Edit3, Save, Shield, Zap, ChevronDown, ChevronUp, Calendar, Info } from 'lucide-react';

// ============================================================================
// BASE DE DONNÉES DU PLAYBOOK (EXTRAITE DU PDF)
// ============================================================================
const CURRICULUM_ADULTES = [
  { month: 8, label: "Septembre", weeks: "S1-S4", theme: "Fondations : La Base & Les Armes", details: "Garde, Posture, Déplacements. Apprentissage du Direct (Jab/Cross) et du Front Kick. Travail de la distance." },
  { month: 9, label: "Octobre", weeks: "S5-S8", theme: "Techniques Circulaires & Esquive", details: "Crochet, Middle Kick, Low Kick. Introduction à l'esquive rotative sur des directs. Enchaînements simples." },
  { month: 10, label: "Novembre", weeks: "S9-S12", theme: "Protocole Pré-Compétition", details: "S-3: Charge (Volume). S-2: Spécifique (Vitesse). S-1: Affûtage. S12: Récupération et reprise." },
  { month: 11, label: "Décembre", weeks: "S13-S15", theme: "La Contre-Attaque", details: "Thème 'Bloquer/Esquiver et riposter'. Drills de défense suivis immédiatement d'une riposte de 2-3 coups." },
  { month: 0, label: "Janvier", weeks: "S16-S19", theme: "Les Coups Spectaculaires", details: "Apprentissage décomposé des coups de pieds retournés et sautés. Assauts avec zone de sécurité." },
  { month: 1, label: "Février", weeks: "S20-S22", theme: "L'Art de la Feinte", details: "Faire réagir pour mieux toucher. Feintes de poings et de regards. Assauts conditionnés par des feintes." },
  { month: 2, label: "Mars", weeks: "S23-S25", theme: "Combinaisons Complexes & Tactique", details: "Lier feinte, attaque et déplacement. Enchaînements avancés. Sparrings dirigés avec contraintes." },
  { month: 3, label: "Avril", weeks: "S26-S28", theme: "Adaptation Tactique", details: "S'adapter à différents styles (fonceur, gaucher mobile). Le coach donne des rôles cachés lors des sparrings." },
  { month: 4, label: "Mai", weeks: "S29-S31", theme: "Préparation des Grades", details: "Répétition intensive des enchaînements de grade par groupes de niveau." },
  { month: 5, label: "Juin", weeks: "S32-S34", theme: "Bilan & Transition", details: "Passages de grades (S31). Sparrings libres, initiation à l'arbitrage, jeux de cohésion pour la fin de saison." }
];

const CURRICULUM_JEUNES = [
  { month: 8, label: "Septembre", weeks: "S1-S4", theme: "Période 1 : Construire son Armure", details: "Postures statiques et en mouvement (Freeze & Garde). Déplacements agiles. Frappes directes et blocages de base." },
  { month: 9, label: "Octobre", weeks: "S5", theme: "Période 1 : Bilan Fondations", details: "Révision générale. Mini-challenge mixant déplacements, frappes et blocages." },
  { month: 10, label: "Novembre", weeks: "S6-S8", theme: "Période 2 : Premières Combinaisons", details: "Les crochets dévastateurs. Combinaison Jab-Cross sur PAOs. Initiation à l'assaut au toucher." },
  { month: 11, label: "Décembre", weeks: "S9", theme: "Période 2 : Spécial Coupe de Noël", details: "Mises en situation d'assaut, coaching des copains, respect de l'arbitre. Coupe de Noël interne." },
  { month: 0, label: "Janvier", weeks: "S10-S12", theme: "Période 3 : Vitesse & Réflexes", details: "Challenge réflexes (Code Rouge/Bleu). Le Low Kick stratégique. L'art de l'esquive rotative (Jeu du Pendule)." },
  { month: 1, label: "Février", weeks: "S13", theme: "Période 3 : Esquive & Riposte", details: "Enchaînement esquive vers riposte en Cross. Sparring où les contres valent double." },
  { month: 2, label: "Mars", weeks: "S14-S16", theme: "Période 4 : Le Travail avec Partenaire", details: "Précision et vitesse sur PAOs. Sparring technique contrôlé (Zéro puissance). Jeu du Touche et Sors." },
  { month: 3, label: "Avril", weeks: "S17", theme: "Période 4 : Combinaisons Complexes", details: "Augmentation de la complexité des enchaînements (4 à 5 coups) en binôme." },
  { month: 4, label: "Mai", weeks: "S18-S20", theme: "Période 5 : Challenge & Tests", details: "Grand parcours Kickboxeur Complet (agilité, sac, défense). Préparation aux évaluations de fin d'année." },
  { month: 5, label: "Juin", weeks: "S21-S22", theme: "Période 5 : Clôture de Saison", details: "Tests de fin d'année. Tournoi amical ludique. Jeux de cohésion et démonstration pour le gala." }
];

export default function Courses({ currentUser }: { currentUser: User }) {
  const [groupTab, setGroupTab] = useState<'ADULTES' | 'JEUNES'>('ADULTES');
  const [expandedBloc, setExpandedBloc] = useState<number | null>(null);
  
  // WOD State
  const [currentSession, setCurrentSession] = useState({ theme: '', technique: '', sparring: '', isAuto: true });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Coach';

  // ==========================================================================
  // MOTEUR D'AUTO-SÉLECTION BASÉ SUR LA DATE
  // ==========================================================================
  const getAutoCurriculum = (group: 'ADULTES' | 'JEUNES') => {
    const currentMonth = new Date().getMonth(); // 0 = Janvier, 2 = Mars, 8 = Septembre
    const curriculum = group === 'ADULTES' ? CURRICULUM_ADULTES : CURRICULUM_JEUNES;
    
    // On cherche la ligne correspondant au mois actuel
    const currentProg = curriculum.find(c => c.month === currentMonth) || curriculum[0];
    
    return {
      theme: `${currentProg.weeks} : ${currentProg.theme}`,
      technique: currentProg.details,
      sparring: "Assauts à thèmes en lien avec la technique du mois. (Le coach peut modifier cette section pour plus de détails).",
      isAuto: true
    };
  };

  // Chargement des données
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'planning', groupTab.toLowerCase());
        const docSnap = await getDoc(docRef);
        
        const autoProg = getAutoCurriculum(groupTab);

        if (docSnap.exists()) {
          const dbData = docSnap.data();
          // Si le coach a enregistré des données spécifiques pour CE mois-ci (on vérifie si le thème correspond à peu près pour ne pas bloquer un mois sur un vieux thème)
          // Pour faire simple : on charge les données de la BDD.
          setCurrentSession({
            theme: dbData.theme || autoProg.theme,
            technique: dbData.technique || autoProg.technique,
            sparring: dbData.sparring || autoProg.sparring,
            isAuto: false
          });
        } else {
          // Si rien en base, on charge 100% l'auto-curriculum basé sur le PDF
          setCurrentSession(autoProg);
        }
      } catch (e) { 
        console.error(e); 
        // Fallback en cas d'erreur de connexion Firebase
        setCurrentSession(getAutoCurriculum(groupTab));
      }
      setIsLoading(false);
    };
    
    fetchSession();
    setExpandedBloc(null); 
  }, [groupTab]);

  const handleSaveSession = async () => {
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'planning', groupTab.toLowerCase()), {
        theme: currentSession.theme,
        technique: currentSession.technique,
        sparring: currentSession.sparring,
        updatedAt: new Date().toISOString()
      });
      setCurrentSession({ ...currentSession, isAuto: false });
      setIsEditing(false);
    } catch (e) {
      alert("Erreur lors de la sauvegarde du programme. Vérifiez vos permissions.");
    }
    setIsLoading(false);
  };

  const handleResetToAuto = () => {
    if(confirm("Écraser votre texte et recharger le programme officiel du PDF pour ce mois-ci ?")) {
      setCurrentSession(getAutoCurriculum(groupTab));
      setIsEditing(true);
    }
  };

  const playbookToDisplay = groupTab === 'ADULTES' ? CURRICULUM_ADULTES : CURRICULUM_JEUNES;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto space-y-6">
        
        {/* EN-TETE */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Planification</h2>
            <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest leading-none">Playbook S.M.G 25/26</span>
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

        {/* CARTE : SÉANCE DE LA SEMAINE (WOD DYNAMIQUE) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className={`h-1 w-full ${groupTab === 'ADULTES' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`}></div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                  <Target size={16} className={`mr-2 ${groupTab === 'ADULTES' ? 'text-cyan-500' : 'text-amber-500'}`} /> Focus du Mois
                </h3>
                {currentSession.isAuto && !isEditing && (
                  <span className="text-[9px] text-slate-500 font-mono mt-1 flex items-center"><Info size={10} className="mr-1"/> Généré d'après le PDF officiel</span>
                )}
              </div>
              
              {isStaff && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-emerald-400 bg-slate-950 p-2 rounded-lg border border-slate-800 transition-colors shadow-inner flex items-center">
                  <Edit3 size={14} className="mr-2"/> Éditer
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-center text-cyan-500 text-xs font-mono animate-pulse py-6">Recherche temporelle en cours...</p>
            ) : isEditing ? (
              <div className="space-y-4 animate-fade-in">
                <button onClick={handleResetToAuto} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-700 mb-2 transition-colors">
                  Réinitialiser avec le programme du PDF
                </button>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Semaines & Thème global</label>
                  <input type="text" value={currentSession.theme} onChange={e => setCurrentSession({...currentSession, theme: e.target.value})} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-3 text-sm font-bold text-white outline-none transition-colors" placeholder="Ex: S23-S25 - Combinaisons" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Ateliers Techniques</label>
                  <textarea value={currentSession.technique} onChange={e => setCurrentSession({...currentSession, technique: e.target.value})} rows={3} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-3 text-xs text-white outline-none resize-none transition-colors leading-relaxed" placeholder="Détail des exercices..." />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Consignes Sparring</label>
                  <textarea value={currentSession.sparring} onChange={e => setCurrentSession({...currentSession, sparring: e.target.value})} rows={2} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-3 text-xs text-white outline-none resize-none transition-colors leading-relaxed" placeholder="Thèmes d'opposition..." />
                </div>
                <div className="flex space-x-3 pt-4 border-t border-slate-800">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-950 text-slate-400 rounded-xl text-xs font-bold uppercase border border-slate-800 hover:text-white transition-colors">Annuler</button>
                  <button onClick={handleSaveSession} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center shadow-lg transition-colors"><Save size={16} className="mr-2"/> Enregistrer</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className={`p-4 rounded-xl border ${groupTab === 'ADULTES' ? 'bg-cyan-950/20 border-cyan-900/50 text-cyan-400' : 'bg-amber-950/20 border-amber-900/50 text-amber-400'}`}>
                  <p className="text-sm font-black uppercase tracking-wide leading-tight">{currentSession.theme || 'Thème non défini'}</p>
                </div>
                
                <div className="flex space-x-4 items-start">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl mt-1 shrink-0"><Crosshair size={18} className={groupTab === 'ADULTES' ? 'text-cyan-500' : 'text-amber-500'}/></div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Technique & Ateliers</h4>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{currentSession.technique || 'Aucun détail fourni.'}</p>
                  </div>
                </div>

                <div className="flex space-x-4 items-start">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl mt-1 shrink-0"><Swords size={18} className="text-rose-500"/></div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Sparring / Opposition</h4>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{currentSession.sparring || 'Aucune consigne fournie.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION : LE PLAYBOOK ANNUEL COMPLET (RÉFÉRENCE) */}
        <div className="pt-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
            <span className="flex items-center"><Calendar size={14} className="mr-2 text-slate-500"/> Fil Conducteur Annuel</span>
            <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Doc Officiel</span>
          </h3>
          
          <div className="space-y-3">
            {playbookToDisplay.map((block, idx) => {
              const isExpanded = expandedBloc === idx;
              const isCurrentMonth = block.month === new Date().getMonth();
              
              return (
                <div key={idx} className={`bg-slate-900 border ${isExpanded ? 'border-slate-600 shadow-lg' : isCurrentMonth ? 'border-emerald-500/50' : 'border-slate-800'} rounded-xl overflow-hidden transition-all duration-300 relative`}>
                  
                  {isCurrentMonth && !isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}

                  <button 
                    onClick={() => setExpandedBloc(isExpanded ? null : idx)}
                    className="w-full bg-slate-800/30 p-4 flex justify-between items-center text-left focus:outline-none hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <span className={`text-xs font-black uppercase tracking-wider block ${isExpanded || isCurrentMonth ? 'text-white' : 'text-slate-400'}`}>{block.label} ({block.weeks})</span>
                      <span className={`text-[10px] font-mono mt-0.5 ${isCurrentMonth ? 'text-emerald-400' : 'text-slate-500'}`}>{block.theme}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0 ml-2" /> : <ChevronDown size={16} className="text-slate-600 shrink-0 ml-2" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800 bg-slate-950 animate-fade-in">
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">{block.details}</p>
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