import React, { useState } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Settings, Save } from 'lucide-react';

export default function SystemDashboard() {
  const = useState('');
  const { tokenStatus, isProcessing, consoleOutput, callCortex, setConsoleOutput } = useSystemStore();

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    try {
      await callCortex('SAVE_TOKEN', { token: tokenInput });
      setConsoleOutput('Token mémorisé avec succès.');
      setTokenInput('');
    } catch (error) {
      setConsoleOutput('Erreur de liaison.');
    }
  };

  return (
    <div className="p-6 bg-[#121212] min-h-screen text-[#eee] pb-24">
      <h1 className="text-xl font-black border-l-4 border-[#d32f2f] pl-3 mb-8 flex items-center italic tracking-tighter uppercase">
        <Settings className="mr-2 text-[#d32f2f]" /> SYSTÈME CORTEX
      </h1>
      <div className="bg-[#1e1e1e] rounded-xl p-6 border border-neutral-800 shadow-2xl relative overflow-hidden">
        <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value)} className="w-full bg-[#111] border border-neutral-700 p-3 rounded-lg text-white text-xs font-mono mb-4 outline-none focus:border-[#d32f2f]" placeholder="Token Bearer ici..." />
        <button onClick={handleSaveToken} disabled={isProcessing ||!tokenInput} className="w-full bg-gradient-to-br from-[#d32f2f] to-[#8b0000] text-white py-3 rounded-lg font-black uppercase italic text-xs shadow-lg active:scale-95 flex justify-center items-center">
          <Save size={16} className="mr-2" /> ENREGISTRER
        </button>
        {consoleOutput && <div className="mt-6 p-4 bg-black rounded-lg border border-neutral-800 text-[10px] font-mono text-[#00E676] overflow-auto max-h-40 whitespace-pre-wrap">{consoleOutput}</div>}
      </div>
    </div>
  );
}