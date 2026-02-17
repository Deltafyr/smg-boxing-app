import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, Trophy, AlertCircle, Shield, Edit3, X, Save, Swords } from 'lucide-react';

interface ShogunFighter {
  id: string;
  name: string;
  cat: string;
  aire: string;
  num: string | number;
  color: string;
  round: string;
  result: string;
}

const Tournament: React.FC = () => {
  const [fighters, setFighters] = useState<ShogunFighter[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Gestion du Mode Manuel (Modal) ---
  const [selectedFighter, setSelectedFighter] = useState<ShogunFighter | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shogun?action=GET_DATA');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Tri intelligent : Par Aire, puis par Numéro de combat
        const sorted = data.sort((a, b) => {
          if (a.aire !== b.aire) return a.aire.localeCompare(b.aire);
          return (Number(a.num) || 999) - (Number(b.num) || 999);
        });
        setFighters(sorted);
        setError(null);
      } else { if(data.error) setError(data.error); }
    } catch (err) { setError("Erreur de connexion serveur."); } finally { setLoading(false); }
  };

  const runAutoScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/shogun?action=AUTO_SCAN_PLANNING');
      const json = await res.json();
      if (json.success) {
        setTimeout(() => { loadData(); setScanning(false); }, 1000);
      } else { alert("⚠️ " + (json.message || json.error)); setScanning(false); }
    } catch (err) { alert("❌ Erreur scan"); setScanning(false); }
  };

  // --- Sauvegarde Manuelle ---
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFighter) return;
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/shogun', {
        method: 'POST', // On utilise POST pour envoyer des données
        body: JSON.stringify({
          action: 'UPDATE_FULL_DETAILS',
          ...selectedFighter // On envoie tout l'objet modifié
        })
      });
      const json = await res.json();
      
      if (json.success) {
        // Mise à jour locale immédiate pour réactivité
        setFighters(prev => prev.map(f => f.id === selectedFighter.id ? selectedFighter : f));
        setSelectedFighter(null); // Fermer le modal
      } else {
        alert("Erreur sauvegarde : " + json.message);
      }
    } catch (err) { alert("Erreur réseau"); } finally { setIsSaving(false); }
  };

  return (
    <div className="p-4 pb-24 space-y-6 relative">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-cyan-400" />
          SHOGUN LIVE
        </h1>
        <p className="text-slate-400 text-sm">Automatique & Manuel</p>
      </div>

      <div className="flex gap-3">
        <button onClick={loadData} disabled={loading} className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={runAutoScan} 
          disabled={scanning}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white shadow-lg transition active:scale-95
            ${scanning ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-rose-600 to-rose-800 hover:to-rose-700 border border-rose-500/30'}`}
        >
          {scanning ? 'Radar en cours...' : 'SCANNER PLANNING'}
        </button>
      </div>

      {error && <div className="p-4 bg-rose-950/30 border border-rose-500/50 rounded-xl text-rose-200 text-sm flex gap-2"><AlertCircle className="w-5 h-5"/>{error}</div>}

      {/* LISTE DES COMBATTANTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fighters.map((f) => (
          <div 
            key={f.id} 
            onClick={() => setSelectedFighter(f)} // CLICK = MODE MANUEL
            className={`relative bg-slate-900 border border-slate-800 rounded-xl p-4 border-l-4 shadow-lg cursor-pointer hover:bg-slate-800/80 transition-all active:scale-95
              ${f.color === 'ROUGE' ? 'border-l-rose-500' : f.color === 'BLEU' ? 'border-l-cyan-500' : 'border-l-slate-600'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{f.name}</h3>
                <p className="text-slate-400 text-xs font-medium uppercase">{f.cat}</p>
                <div className="flex items-center gap-2 mt-3">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">{f.round || 'QUALIF'}</span>
                   {f.result && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1
                      ${f.result === 'VICTOIRE' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {f.result === 'VICTOIRE' ? <Trophy className="w-3 h-3" /> : <Swords className="w-3 h-3" />} {f.result}
                    </span>
                   )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-600 font-bold uppercase">N°</span>
                  <span className="text-xl font-mono font-bold text-white">{f.num && f.num != 9999 ? f.num : '--'}</span>
                </div>
                {f.aire && f.aire !== 'NP' && <div className="mt-1 text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">AIRE {f.aire}</div>}
              </div>
            </div>
            {/* Indication visuelle qu'on peut éditer */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL D'ÉDITION MANUELLE --- */}
      {selectedFighter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Modifier le combat
              </h3>
              <button onClick={() => setSelectedFighter(null)} className="p-1 rounded-full hover:bg-slate-700 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSaveManual} className="p-5 space-y-4">
              
              <div className="text-center mb-4">
                 <h2 className="text-xl font-bold text-white">{selectedFighter.name}</h2>
                 <p className="text-xs text-slate-400 uppercase">{selectedFighter.cat}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Numéro N°</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:border-cyan-500 outline-none"
                    value={selectedFighter.num}
                    onChange={e => setSelectedFighter({...selectedFighter, num: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Aire / Ring</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    value={selectedFighter.aire}
                    onChange={e => setSelectedFighter({...selectedFighter, aire: e.target.value})}
                  >
                    <option value="NP">Non Planifié</option>
                    {[1,2,3,4,5,6].map(i => <option key={i} value={i}>Aire {i}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Coin</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-700">
                    <button type="button" onClick={() => setSelectedFighter({...selectedFighter, color: 'ROUGE'})} className={`flex-1 p-2 text-xs font-bold ${selectedFighter.color === 'ROUGE' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500'}`}>ROUGE</button>
                    <button type="button" onClick={() => setSelectedFighter({...selectedFighter, color: 'BLEU'})} className={`flex-1 p-2 text-xs font-bold ${selectedFighter.color === 'BLEU' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-500'}`}>BLEU</button>
                  </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase font-bold">Tour</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-cyan-500 outline-none"
                      value={selectedFighter.round}
                      onChange={e => setSelectedFighter({...selectedFighter, round: e.target.value})}
                    >
                      <option value="QUALIF">Qualif</option>
                      <option value="1/4 FINALE">1/4 Finale</option>
                      <option value="1/2 FINALE">1/2 Finale</option>
                      <option value="FINALE">Finale</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-xs text-slate-400 uppercase font-bold">Résultat</label>
                  <div className="flex gap-2">
                     <button 
                        type="button" 
                        onClick={() => setSelectedFighter({...selectedFighter, result: 'VICTOIRE'})}
                        className={`flex-1 py-3 rounded-lg border font-bold text-sm transition ${selectedFighter.result === 'VICTOIRE' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-green-800'}`}
                     >
                       VICTOIRE
                     </button>
                     <button 
                        type="button" 
                        onClick={() => setSelectedFighter({...selectedFighter, result: 'DEFAITE'})}
                        className={`flex-1 py-3 rounded-lg border font-bold text-sm transition ${selectedFighter.result === 'DEFAITE' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-red-800'}`}
                     >
                       DÉFAITE
                     </button>
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Sauvegarde...' : <><Save className="w-5 h-5" /> SAUVEGARDER</>}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tournament;