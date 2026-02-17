import React, { useState, useEffect, useRef } from 'react';
import { TIMER_PRESETS } from '../constants';
import { Play, Pause, RotateCcw, Settings, Volume2 } from 'lucide-react';
import FuturisticCard from '../components/ui/FuturisticCard';

const TimerPage: React.FC = () => {
  // Config State
  const [workTime, setWorkTime] = useState(60);
  const [restTime, setRestTime] = useState(20);
  const [prepTime, setPrepTime] = useState(10); // Start delay
  const [totalRounds, setTotalRounds] = useState(12);

  // Runtime State
  const [timeLeft, setTimeLeft] = useState(prepTime);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<'PREP' | 'WORK' | 'REST'>('PREP');
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Init Audio Context on user interaction
  const playBeep = (type: 'high' | 'low') => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'high') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (Start/End round)
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Low pitch (Warning/Tick)
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  };

  useEffect(() => {
    let interval: number;

    if (isRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          // Play sound last 3 seconds
          if (prev <= 4 && prev > 1) playBeep('low');
          
          if (prev <= 1) {
            handlePhaseTransition();
            return 0; // Will be overwritten by transition
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, phase]);

  const handlePhaseTransition = () => {
    playBeep('high');
    
    if (phase === 'PREP') {
      setPhase('WORK');
      setTimeLeft(workTime);
    } else if (phase === 'WORK') {
      if (currentRound >= totalRounds) {
        setIsRunning(false);
        setPhase('PREP'); // Reset
        setCurrentRound(1);
        setTimeLeft(prepTime);
        return;
      }
      setPhase('REST');
      setTimeLeft(restTime);
    } else if (phase === 'REST') {
      setPhase('WORK');
      setCurrentRound((prev) => prev + 1);
      setTimeLeft(workTime);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('PREP');
    setCurrentRound(1);
    setTimeLeft(prepTime);
  };

  const applyPreset = (preset: typeof TIMER_PRESETS[0]) => {
    setWorkTime(preset.work);
    setRestTime(preset.rest);
    resetTimer(); // Apply and reset
    // Specifically set timeleft after reset logic to ensure it picks up new config if needed, 
    // though reset uses prepTime.
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'WORK': return 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]';
      case 'REST': return 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]';
      default: return 'text-yellow-400';
    }
  };

  const getProgress = () => {
    const total = phase === 'PREP' ? prepTime : phase === 'WORK' ? workTime : restTime;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="p-4 h-full flex flex-col pb-20 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-mono text-slate-100">TIMER S.M.G</h2>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
          <Settings size={20} className="text-slate-300" />
        </button>
      </div>

      {showSettings && (
        <FuturisticCard className="mb-6 animate-fade-in" title="Configuration">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Préréglages</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TIMER_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-xs hover:border-cyan-400 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Activité (s)</label>
                <input type="number" value={workTime} onChange={(e) => setWorkTime(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-cyan-400 font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pause (s)</label>
                <input type="number" value={restTime} onChange={(e) => setRestTime(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-rose-400 font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rounds</label>
                <input type="number" value={totalRounds} onChange={(e) => setTotalRounds(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-white font-mono" />
              </div>
            </div>
          </div>
        </FuturisticCard>
      )}

      {/* Main Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Progress Circle SVG */}
        <div className="relative w-72 h-72 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
               <circle 
                 cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" 
                 strokeDasharray={2 * Math.PI * 130}
                 strokeDashoffset={2 * Math.PI * 130 * (1 - getProgress() / 100)}
                 className={`transition-all duration-1000 ${phase === 'WORK' ? 'text-cyan-500' : phase === 'REST' ? 'text-rose-500' : 'text-yellow-500'}`}
               />
             </svg>
             
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className={`text-6xl font-black font-mono tracking-tighter ${getPhaseColor()}`}>
                 {formatTime(timeLeft)}
               </span>
               <span className="text-xl font-bold text-slate-400 mt-2 uppercase tracking-widest">
                 {phase === 'PREP' ? 'PRÉPARATION' : phase === 'WORK' ? 'TRAVAIL' : 'REPOS'}
               </span>
               <span className="text-sm text-slate-600 mt-4 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                 ROUND {currentRound} / {totalRounds}
               </span>
             </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => {
            if (!isRunning) playBeep('low'); // wake up audio
            setIsRunning(!isRunning);
          }}
          className={`flex items-center justify-center py-4 rounded-xl font-bold text-lg transition-all ${
            isRunning 
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' 
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
          }`}
        >
          {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
          {isRunning ? 'PAUSE' : 'START'}
        </button>

        <button 
          onClick={resetTimer}
          className="flex items-center justify-center py-4 rounded-xl font-bold text-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
        >
          <RotateCcw className="mr-2" />
          RESET
        </button>
      </div>
    </div>
  );
};

export default TimerPage;