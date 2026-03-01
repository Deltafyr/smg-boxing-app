import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, X, Swords, Activity, Zap, Target } from 'lucide-react';

// ============================================================================
// TYPES ET CONFIGURATIONS PREDEFINIES
// ============================================================================
type TimerPhase = 'PREP' | 'WORK' | 'REST' | 'TRANSITION' | 'FINISHED';

interface TimerPreset {
  id: string;
  name: string;
  workTime: number;
  restTime: number;
  transitionTime: number;
  rounds: number;
  category: 'ASSAUT' | 'TECHNIQUE' | 'CARDIO' | 'SPECIAL';
  hasTick?: boolean; // Pour le challenge 100 kicks
  tickIntervalMs?: number;
}

const PRESETS: TimerPreset[] = [
  // ASSAUTS (FFKMDA Standards)
  { id: 'a1', name: 'Assaut Léger (1m / 30s)', workTime: 60, restTime: 30, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  { id: 'a2', name: 'Assaut Moyen (1m / 45s)', workTime: 60, restTime: 45, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  { id: 'a3', name: 'Combat Classe B (2m / 45s)', workTime: 120, restTime: 45, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  { id: 'a4', name: 'Combat Classe A (2m / 1m)', workTime: 120, restTime: 60, transitionTime: 0, rounds: 3, category: 'ASSAUT' },
  
  // TECHNIQUE BINÔME
  { id: 't1', name: 'Drill Technique (2m + 10s switch)', workTime: 120, restTime: 0, transitionTime: 10, rounds: 6, category: 'TECHNIQUE' },
  { id: 't2', name: 'Leçon au plastron (3m + 15s switch)', workTime: 180, restTime: 0, transitionTime: 15, rounds: 4, category: 'TECHNIQUE' },
  
  // CARDIO / FILIERES
  { id: 'c1', name: 'Lactique (30s / 30s)', workTime: 30, restTime: 30, transitionTime: 0, rounds: 10, category: 'CARDIO' },
  { id: 'c2', name: 'Alactique (Tabata 20s / 10s)', workTime: 20, restTime: 10, transitionTime: 0, rounds: 8, category: 'CARDIO' },
  { id: 'c3', name: 'Pyramide Cardio (Rounds 3x2m)', workTime: 120, restTime: 60, transitionTime: 0, rounds: 3, category: 'CARDIO' },
  
  // SPECIAL
  { id: 's1', name: '100 Kicks Challenge (1m)', workTime: 60, restTime: 0, transitionTime: 0, rounds: 1, category: 'SPECIAL', hasTick: true, tickIntervalMs: 600 },
];

// ============================================================================
// MOTEUR AUDIO COMBAT (CORTEX VOICE)
// ============================================================================
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
  utterance.pitch = 0.8; // Voix plus grave/autoritaire
  utterance.rate = 1.2; // Rythme martial
  window.speechSynthesis.speak(utterance);
};

// ============================================================================
// COMPOSANT: MODULE CHRONO INDIVIDUEL
// ============================================================================
const TimerModule = ({ id, onRemove, isSole }: { id: string, onRemove?: () => void, isSole: boolean }) => {
  const [activeCategory, setActiveCategory] = useState<'ASSAUT' | 'TECHNIQUE' | 'CARDIO' | 'SPECIAL'>('ASSAUT');
  const [config, setConfig] = useState<TimerPreset>(PRESETS[0]);
  
  const [phase, setPhase] = useState<TimerPhase>('PREP');
  const [timeLeft, setTimeLeft] = useState(10); // 10s prep
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Formatter le temps (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ASSAUT': return <Swords size={16} className="text-rose-500" />;
      case 'TECHNIQUE': return <Target size={16} className="text-cyan-500" />;
      case 'CARDIO': return <Activity size={16} className="text-emerald-500" />;
      case 'SPECIAL': return <Zap size={16} className="text-amber-500" />;
      default: return null;
    }
  };

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('PREP');
    setTimeLeft(10);
    setCurrentRound(1);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
  }, []);

  const handlePresetChange = (presetId: string) => {
    const newConfig = PRESETS.find(p => p.id === presetId) || PRESETS[0];
    setConfig(newConfig);
    resetTimer();
  };

  const toggleTimer = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    setIsRunning(!isRunning);
    if (!isRunning && phase === 'PREP' && timeLeft === 10) {
      speakCombative("En place.", isMuted);
    }
  };

  // Moteur Principal du Temps
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev > 1) {
            // Annonces vocales de fin de phase
            if (prev === 11 && phase === 'WORK') speakCombative("Dix secondes", isMuted);
            if (prev === 4 && !isMuted) playTone(440, 'sine', 0.2); // Bip d'avertissement 3..2..1
            return prev - 1;
          }

          // TRANSITIONS DE PHASES
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
              setPhase('WORK');
              setCurrentRound(r => r + 1);
              if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
              return config.workTime;
            } else {
              setPhase('FINISHED');
              setIsRunning(false);
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
               setPhase('WORK');
               setCurrentRound(r => r + 1);
               if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
               return config.workTime;
             } else {
               setPhase('FINISHED');
               setIsRunning(false);
               if (!isMuted) { playTone(300, 'triangle', 1.5); speakCombative("Terminé.", false); }
               return 0;
             }
          }

          else if (phase === 'REST') {
            if (currentRound < config.rounds) {
              setPhase('WORK');
              setCurrentRound(r => r + 1);
              if (!isMuted) { playTone(880, 'square', 0.8); speakCombative("Combat !", false); }
              return config.workTime;
            } else {
              setPhase('FINISHED');
              setIsRunning(false);
              return 0;
            }
          }

          return 0;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, phase, currentRound, config, isMuted]);

  // Gestion du Métronome (Tick) pour le Challenge 100 Kicks
  useEffect(() => {
    if (isRunning && phase === 'WORK' && config.hasTick && config.tickIntervalMs) {
      tickIntervalRef.current = setInterval(() => {
        if (!isMuted) playTone(1200, 'triangle', 0.05, 0.3); // Tick court et sec
      }, config.tickIntervalMs);
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isRunning, phase, config, isMuted]);

  // Déterminer la couleur de la carte selon la phase
  const getPhaseColor = () => {
    switch (phase) {
      case 'PREP': return 'border-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] text-amber-500';
      case 'WORK': return 'border-rose-500 shadow-[0_0_40px_-5px_rgba(244,63,94,0.4)] text-rose-500';
      case 'REST': return 'border-cyan-500 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] text-cyan-500';
      case 'TRANSITION': return 'border-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] text-purple-500';
      case 'FINISHED': return 'border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] text-emerald-500';
      default: return 'border-slate-700 text-slate-400';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'PREP': return 'PRÉPARATION';
      case 'WORK': return 'COMBAT';
      case 'REST': return 'RÉCUPÉRATION';
      case 'TRANSITION': return 'CHANGEMENT';
      case 'FINISHED': return 'ENTRAÎNEMENT TERMINÉ';
    }
  };

  return (
    <div className={`relative bg-slate-900/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 border-2 transition-all duration-300 ${getPhaseColor()} flex flex-col h-full`}>
      
      {/* HEADER CARTE */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex space-x-2">
          {['ASSAUT', 'TECHNIQUE', 'CARDIO', 'SPECIAL'].map((cat) => (
            <button key={cat} onClick={() => { setActiveCategory(cat as any); const firstPreset = PRESETS.find(p => p.category === cat); if (firstPreset) handlePresetChange(firstPreset.id); }} disabled={isRunning}
              className={`p-2 rounded-xl transition-all ${activeCategory === cat ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-950 text-slate-500 opacity-50 hover:opacity-100'}`}>
              {getCategoryIcon(cat)}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-950 rounded-xl text-slate-400 hover:text-white">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {!isSole && onRemove && (
            <button onClick={onRemove} className="p-2 bg-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/40">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* SELECTION PRESET */}
      {!isRunning && phase === 'PREP' && (
        <select value={config.id} onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-cyan-500 mb-4 appearance-none text-center">
          {PRESETS.filter(p => p.category === activeCategory).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {/* AFFICHAGE CHRONO CENTRAL */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-2">{getPhaseText()}</h3>
        
        {/* Cercles de Rounds */}
        <div className="flex space-x-1.5 mb-6 flex-wrap justify-center px-4">
          {Array.from({ length: config.rounds }).map((_, i) => (
            <div key={i} className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${i + 1 < currentRound ? 'bg-emerald-500 border-emerald-500' : i + 1 === currentRound && phase !== 'FINISHED' ? 'bg-current border-current animate-pulse' : 'border-slate-700 bg-transparent'}`} />
          ))}
        </div>

        {/* COMPTEUR GÉANT */}
        <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter tabular-nums leading-none">
          {formatTime(timeLeft)}
        </div>

        {/* INDICATION REPOS / DETAILS */}
        <div className="mt-6 flex space-x-4 sm:space-x-8 text-[10px] sm:text-xs font-mono text-slate-400 uppercase">
           <div className="flex flex-col items-center"><span className="text-slate-600 font-bold">Travail</span><span className="text-white">{formatTime(config.workTime)}</span></div>
           {config.transitionTime > 0 && <div className="flex flex-col items-center"><span className="text-purple-600 font-bold">Switch</span><span className="text-white">{formatTime(config.transitionTime)}</span></div>}
           {config.restTime > 0 && <div className="flex flex-col items-center"><span className="text-cyan-600 font-bold">Repos</span><span className="text-white">{formatTime(config.restTime)}</span></div>}
        </div>
      </div>

      {/* CONTROLES */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <button onClick={toggleTimer} className={`col-span-2 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all ${isRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30' : phase === 'FINISHED' ? 'bg-slate-800 text-slate-500' : 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30'}`} disabled={phase === 'FINISHED'}>
          {isRunning ? <><Pause size={18} className="mr-2"/> Pause</> : <><Play size={18} className="mr-2"/> Lancer</>}
        </button>
        <button onClick={resetTimer} className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE PRINCIPALE : GESTION DUAL-CORE
// ============================================================================
export default function TimerPage() {
  const [timers, setTimers] = useState<string[]>(['t1']); // Array d'IDs pour forcer le render

  const addTimer = () => {
    if (timers.length < 2) setTimers([...timers, `t${Date.now()}`]);
  };

  const removeTimer = (idToRemove: string) => {
    setTimers(timers.filter(id => id !== idToRemove));
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 pb-24 flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">Arène</h2>
          <span className="text-[10px] text-rose-500 font-mono uppercase tracking-widest leading-none">Protocoles FFKMDA</span>
        </div>
        {timers.length < 2 && (
          <button onClick={addTimer} className="bg-cyan-500/20 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/30 transition-all flex items-center shadow-[0_0_15px_-5px_rgba(6,182,212,0.4)]">
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
  );
}