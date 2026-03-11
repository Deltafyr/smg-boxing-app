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

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (frequency: number, type: OscillatorType, duration: number, vol: number = 1) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

const speakCombative = (text: string, isMuted: boolean) => {
  if (isMuted) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.pitch = 0.8;
  utterance.rate = 1.2;
  window.speechSynthesis.speak(utterance);
};

const TimerModule = ({ id, onRemove, isSole }: { id: string, onRemove?: () => void, isSole: boolean }) => {
  const [activeCategory, setActiveCategory] = useState<string>('ASSAUT');
  const [customPresets, setCustomPresets] = useState<TimerPreset[]>([]);
  const [config, setConfig] = useState<TimerPreset>(PRESETS[0]);
  
  const [phase, setPhase] = useState<TimerPhase>('PREP');
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // CORRECTION: LE SON EST ACTIF PAR DÉFAUT
  
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [cName, setCName] = useState('Mon Chrono');
  const [cWork, setCWork] = useState(120);
  const [cRest, setCRest] = useState(60);
  const [cRounds, setCRounds] = useState(3);

  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const computeTotalTime = useCallback((cfg: TimerPreset) => {
    const prepTime = 10;
    const workTotal = cfg.rounds * cfg.workTime;
    const breaksTotal = (cfg.rounds > 1 ? cfg.rounds - 1 : 0) * (cfg.transitionTime + cfg.restTime);
    return prepTime + workTotal + breaksTotal;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('smg_custom_timers');
    if (saved) setCustomPresets(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const allPresets = [...PRESETS, ...customPresets];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback((cfg = config) => {
    setIsRunning(false); setPhase('PREP'); setTimeLeft(10); setCurrentRound(1);
    setTotalTimeLeft(computeTotalTime(cfg));
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
  }, [config, computeTotalTime]);

  useEffect(() => {
    setTotalTimeLeft(computeTotalTime(config));
  }, []);

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

  const handlePresetChange = (presetId: string) => {
    const newConfig = allPresets.find(p => p.id === presetId) || PRESETS[0];
    setConfig(newConfig);
    resetTimer(newConfig);
  };

  const updateRounds = (delta: number) => {
    const newRounds = Math.max(1, config.rounds + delta);
    const newConfig = { ...config, rounds: newRounds };
    setConfig(newConfig);
    resetTimer(newConfig);
  };

  const toggleTimer = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    setIsRunning(!isRunning);
    if (!isRunning && phase === 'PREP' && timeLeft === 10) {
      speakCombative("En place.", isMuted);
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'PREP': return 'border-amber-500 text-amber-500';
      case 'WORK': return 'border-rose-500 text-rose-500 shadow-[0_0_40px_-5px_rgba(244,63,94,0.2)]';
      case 'REST': return 'border-cyan-500 text-cyan-500';
      case 'TRANSITION': return 'border-purple-500 text-purple-500';
      case 'FINISHED': return 'border-emerald-500 text-emerald-500';
      default: return 'border-slate-700 text-slate-400';
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTotalTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        
        setTimeLeft((prev) => {
          if (prev > 1) {
            if (prev === 11 && phase === 'WORK') speakCombative("Dix secondes", isMuted);
            if (prev === 4 && !isMuted) playTone(440, 'sine', 0.2);
            return prev - 1;
          }

          if (phase === 'PREP') {
            setPhase('WORK');
            if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
            return config.workTime;
          } 
          else if (phase === 'WORK') {
            if (config.transitionTime > 0) {
              setPhase('TRANSITION');
              if (!isMuted) { playTone(600, 'sawtooth', 0.5); speakCombative("Changement !", false); }
              return config.transitionTime;
            } else if (config.restTime > 0 && currentRound < config.rounds) {
              setPhase('REST');
              if (!isMuted) { playTone(400, 'sine', 0.8); speakCombative("Repos.", false); }
              return config.restTime;
            } else if (currentRound < config.rounds) {
              setPhase('WORK'); setCurrentRound(r => r + 1);
              if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
              return config.workTime;
            } else {
              setPhase('FINISHED'); setIsRunning(false);
              if (!isMuted) { playTone(300, 'triangle', 1.5); speakCombative("Terminé.", false); }
              return 0;
            }
          }
          else if (phase === 'TRANSITION') {
             if (config.restTime > 0 && currentRound < config.rounds) {
               setPhase('REST');
               if (!isMuted) { playTone(400, 'sine', 0.8); speakCombative("Repos.", false); }
               return config.restTime;
             } else if (currentRound < config.rounds) {
               setPhase('WORK'); setCurrentRound(r => r + 1);
               if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
               return config.workTime;
             } else {
               setPhase('FINISHED'); setIsRunning(false);
               if (!isMuted) { playTone(300, 'triangle', 1.5); speakCombative("Terminé.", false); }
               return 0;
             }
          }
          else if (phase === 'REST') {
            if (currentRound < config.rounds) {
              setPhase('WORK'); setCurrentRound(r => r + 1);
              if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
              return config.workTime;
            } else {
              setPhase('FINISHED'); setIsRunning(false);
              return 0;
            }
          }
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, config, isMuted]);

  useEffect(() => {
    if (isRunning && phase === 'WORK' && config.hasTick && config.tickIntervalMs) {
      tickIntervalRef.current = setInterval(() => {
        if (!isMuted) playTone(1200, 'triangle', 0.05, 0.3);
      }, config.tickIntervalMs);
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }
    return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current); };
  }, [isRunning, phase, config, isMuted]);

  const estimatedEndTime = new Date(currentTime.getTime() + totalTimeLeft * 1000);

  return (
    <div className={`relative bg-slate-900/80 rounded-3xl p-4 border-2 transition-all duration-300 ${getPhaseColor()} flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex space-x-1 sm:space-x-2">
          {['ASSAUT', 'TECHNIQUE', 'CARDIO', 'SPECIAL', 'CUSTOM'].map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(cat); const first = allPresets.find(p => p.category === cat); if (first) { setConfig(first); resetTimer(first); } }} disabled={isRunning} className={`p-2 rounded-xl transition-all ${activeCategory === cat ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-950 text-slate-500 opacity-50'}`}>
              {cat === 'CUSTOM' ? <Settings2 size={14}/> : cat === 'ASSAUT' ? <Swords size={14}/> : cat === 'TECHNIQUE' ? <Target size={14}/> : cat === 'CARDIO' ? <Activity size={14}/> : <Zap size={14} />}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-950 rounded-xl text-slate-400 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-cyan-500" />}
          </button>
          {!isSole && onRemove && (
            <button onClick={onRemove} className="p-2 bg-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/40">
              <X size={16} />
            </button>
          )}
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
            <div className="flex space-x-2 mb-4">
              <select value={config.id} onChange={(e) => handlePresetChange(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none mb-4 text-center">
                {allPresets.filter(p => p.category === activeCategory).map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-1 shadow-inner h-[46px]">
                <button onClick={() => updateRounds(-1)} className="p-2 text-slate-500 hover:text-white font-black">-</button>
                <span className="text-white font-black px-1 text-xs w-12 text-center">{config.rounds} Rnd</span>
                <button onClick={() => updateRounds(1)} className="p-2 text-slate-500 hover:text-white font-black">+</button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-2">{phase === 'PREP' ? 'PRÉPARATION' : phase === 'WORK' ? 'COMBAT' : phase === 'REST' ? 'RÉCUPÉRATION' : phase === 'TRANSITION' ? 'CHANGEMENT' : 'TERMINÉ'}</h3>
            
            <div className="flex gap-1.5 mb-6 flex-wrap justify-center px-4 max-w-full">
              {Array.from({ length: config.rounds }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border-2 ${i + 1 < currentRound ? 'bg-emerald-500 border-emerald-500' : i + 1 === currentRound && phase !== 'FINISHED' ? 'bg-current border-current animate-pulse' : 'border-slate-700 bg-transparent'}`} />
              ))}
            </div>

            <div className="text-7xl sm:text-8xl font-black tabular-nums leading-none">{formatTime(timeLeft)}</div>
            <div className="mt-4 flex space-x-2 text-[10px] font-mono text-slate-400">
               <span>TRAVAIL: {formatTime(config.workTime)}</span><span>|</span><span>REPOS: {formatTime(config.restTime)}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={toggleTimer} className={`col-span-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center ${isRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-rose-600 text-white shadow-lg'}`} disabled={phase === 'FINISHED'}>
                {isRunning ? <><Pause size={18} className="mr-2"/> Pause</> : <><Play size={18} className="mr-2"/> Lancer</>}
              </button>
              <button onClick={() => resetTimer(config)} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center"><RotateCcw size={18} /></button>
            </div>
            
            <div className="mt-3 bg-slate-950/60 border border-slate-800/50 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <div className="flex items-center text-slate-400"><Clock size={12} className="mr-1.5" /> {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2 hidden sm:inline">DURÉE: {formatTime(totalTimeLeft)}</span>
                <span className="text-amber-500 font-bold flex items-center">FIN: {estimatedEndTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function TimerPage() {
  const [timers, setTimers] = useState<string[]>(['t1']);

  const addTimer = () => {
    if (timers.length < 2) setTimers([...timers, `t${Date.now()}`]);
  };
  const removeTimer = (idToRemove: string) => {
    setTimers(timers.filter(id => id !== idToRemove));
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto', paddingBottom: '150px' }} className="w-full px-4 pt-4">
      <div className="max-w-lg mx-auto flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-2xl font-black text-white italic uppercase">Chrono</h2><span className="text-[10px] text-rose-500 font-mono uppercase tracking-widest">Maître du Temps</span></div>
          {timers.length < 2 && (
            <button onClick={addTimer} className="bg-cyan-500/20 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/30 transition-all flex items-center">
              <Plus size={20} /> <span className="ml-2 text-xs font-black uppercase tracking-wider hidden sm:inline">Dual Core</span>
            </button>
          )}
        </div>
        <div className={`flex-1 grid gap-4 ${timers.length === 2 ? 'grid-rows-2 sm:grid-rows-1 sm:grid-cols-2' : 'grid-rows-1'}`}>
          {timers.map((timerId) => (
            <TimerModule key={timerId} id={timerId} onRemove={() => removeTimer(timerId)} isSole={timers.length === 1} />
          ))}
        </div>
      </div>
    </div>
  );
}