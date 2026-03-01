import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, X, Swords, Activity, Zap, Target, Clock, Settings2 } from 'lucide-react';

type TimerPhase = 'PREP' | 'WORK' | 'REST' | 'TRANSITION' | 'FINISHED';
interface TimerPreset { id: string; name: string; workTime: number; restTime: number; transitionTime: number; rounds: number; category: string; hasTick?: boolean; tickIntervalMs?: number; }

const PRESETS: TimerPreset[] = [
  { id: 'a1', name: 'Assaut Léger (1m/30s)', workTime: 60, restTime: 30, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  { id: 'a3', name: 'Combat Classe B (2m/45s)', workTime: 120, restTime: 45, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  { id: 't1', name: 'Drill Technique (2m+10s)', workTime: 120, restTime: 0, transitionTime: 10, rounds: 6, category: 'TECHNIQUE' },
  { id: 'c1', name: 'Lactique (30s/30s)', workTime: 30, restTime: 30, transitionTime: 0, rounds: 10, category: 'CARDIO' },
  { id: 's1', name: '100 Kicks Challenge (1m)', workTime: 60, restTime: 0, transitionTime: 0, rounds: 1, category: 'SPECIAL', hasTick: true, tickIntervalMs: 600 },
];

const TimerModule = ({ id, onRemove, isSole }: { id: string, onRemove?: () => void, isSole: boolean }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ASSAUT');
  const [customPresets, setCustomPresets] = useState<TimerPreset[]>([]);
  const [config, setConfig] = useState<TimerPreset>(PRESETS[0]);
  
  const [phase, setPhase] = useState<TimerPhase>('PREP');
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [cName, setCName] = useState('Mon Chrono');
  const [cWork, setCWork] = useState(120);
  const [cRest, setCRest] = useState(60);
  const [cRounds, setCRounds] = useState(3);

  useEffect(() => {
    const saved = localStorage.getItem('smg_custom_timers');
    if (saved) setCustomPresets(JSON.parse(saved));
  }, []);

  const allPresets = [...PRESETS, ...customPresets];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback((cfg = config) => {
    setIsRunning(false); setPhase('PREP'); setTimeLeft(10); setCurrentRound(1);
  }, [config]);

  const handleSaveCustom = () => {
    const newPreset = { id: `cust_${Date.now()}`, name: cName, workTime: cWork, restTime: cRest, transitionTime: 0, rounds: cRounds, category: 'CUSTOM' };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('smg_custom_timers', JSON.stringify(updated));
    setShowCustomForm(false);
    setActiveCategory('CUSTOM');
    setConfig(newPreset);
    resetTimer(newPreset);
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'PREP': return 'border-amber-500 text-amber-500';
      case 'WORK': return 'border-rose-500 text-rose-500';
      case 'REST': return 'border-cyan-500 text-cyan-500';
      case 'FINISHED': return 'border-emerald-500 text-emerald-500';
      default: return 'border-slate-700 text-slate-400';
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) return prev - 1;
          if (phase === 'PREP') { setPhase('WORK'); return config.workTime; } 
          else if (phase === 'WORK') {
            if (config.restTime > 0 && currentRound < config.rounds) { setPhase('REST'); return config.restTime; }
            else if (currentRound < config.rounds) { setPhase('WORK'); setCurrentRound(r => r + 1); return config.workTime; } 
            else { setPhase('FINISHED'); setIsRunning(false); return 0; }
          }
          else if (phase === 'REST') {
            if (currentRound < config.rounds) { setPhase('WORK'); setCurrentRound(r => r + 1); return config.workTime; } 
            else { setPhase('FINISHED'); setIsRunning(false); return 0; }
          }
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, config]);

  return (
    <div className={`relative bg-slate-900/80 rounded-3xl p-4 border-2 transition-all duration-300 ${getPhaseColor()} flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex space-x-1 sm:space-x-2">
          {['ASSAUT', 'TECHNIQUE', 'CARDIO', 'SPECIAL', 'CUSTOM'].map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(cat); const first = allPresets.find(p => p.category === cat); if (first) { setConfig(first); resetTimer(first); } }} disabled={isRunning} className={`p-2 rounded-xl transition-all ${activeCategory === cat ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-950 text-slate-500 opacity-50'}`}>
              {cat === 'CUSTOM' ? <Settings2 size={14}/> : <Activity size={14} />}
            </button>
          ))}
        </div>
      </div>

      {!isRunning && phase === 'PREP' && activeCategory === 'CUSTOM' && !showCustomForm && (
         <button onClick={() => setShowCustomForm(true)} className="w-full bg-slate-950 border border-slate-800 border-dashed rounded-xl p-2 text-xs font-bold text-cyan-500 hover:bg-slate-800 mb-4">+ Nouveau Chrono</button>
      )}

      {showCustomForm ? (
        <div className="flex-1 flex flex-col justify-center space-y-2 px-4">
          <input type="text" value={cName} onChange={e=>setCName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" placeholder="Nom..." />
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[10px] text-slate-500">Travail (s)</label><input type="number" value={cWork} onChange={e=>setCWork(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" /></div>
            <div><label className="text-[10px] text-slate-500">Repos (s)</label><input type="number" value={cRest} onChange={e=>setCRest(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" /></div>
            <div><label className="text-[10px] text-slate-500">Rounds</label><input type="number" value={cRounds} onChange={e=>setCRounds(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" /></div>
          </div>
          <button onClick={handleSaveCustom} className="w-full bg-cyan-600 text-white rounded p-2 text-xs font-bold uppercase mt-2">Sauvegarder</button>
        </div>
      ) : (
        <>
          {!isRunning && phase === 'PREP' && (
            <select value={config.id} onChange={(e) => { const c = allPresets.find(p => p.id === e.target.value); if(c){ setConfig(c); resetTimer(c);} }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none mb-4 text-center">
              {allPresets.filter(p => p.category === activeCategory).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          )}

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-2">{phase}</h3>
            <div className="text-7xl sm:text-8xl font-black tabular-nums leading-none">{formatTime(timeLeft)}</div>
            <div className="mt-4 flex space-x-2 text-[10px] font-mono text-slate-400">
               <span>TRAVAIL: {formatTime(config.workTime)}</span><span>|</span><span>REPOS: {formatTime(config.restTime)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={() => setIsRunning(!isRunning)} className={`col-span-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center ${isRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-rose-600 text-white shadow-lg'}`}>
              {isRunning ? 'Pause' : 'Lancer'}
            </button>
            <button onClick={() => resetTimer(config)} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center"><RotateCcw size={18} /></button>
          </div>
        </>
      )}
    </div>
  );
};

export default function TimerPage() {
  // SCROLL FIX ABSOLU INCLUS ICI AUSSI
  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-2xl font-black text-white italic uppercase">Chrono</h2><span className="text-[10px] text-rose-500 font-mono uppercase tracking-widest">Maître du Temps</span></div>
        </div>
        <div><TimerModule id="t1" isSole={true} /></div>
      </div>
    </div>
  );
}