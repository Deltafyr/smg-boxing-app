import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Target } from 'lucide-react';
import FuturisticCard from '../../components/ui/FuturisticCard';

const PRESETS = [
  { id: 'sp_short', name: 'Sparring Court', work: 60, rest: 30, rounds: 3, tick: 0, desc: '1m / 30s' },
  { id: 'sp_long', name: 'Sparring Long', work: 120, rest: 60, rounds: 3, tick: 0, desc: '2m / 1m' },
  { id: 'tabata', name: 'Fractionné', work: 30, rest: 30, rounds: 5, tick: 0, desc: '30s / 30s' },
  { id: 'plank', name: 'Gainage', work: 60, rest: 0, rounds: 1, tick: 1, desc: 'Tick 1s' },
  { id: 'kicks', name: '100 Kicks', work: 60, rest: 0, rounds: 1, tick: 0.6, desc: 'Objectif: 1min' }
];

const TimerPage: React.FC = () => {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(5); // 5s prep
  const [phase, setPhase] = useState<'PREP' | 'WORK' | 'REST' | 'DONE'>('PREP');
  const [round, setRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = (type: 'beep' | 'tick' | 'end') => {
    if (!soundEnabled) return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'tick') {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  };

  // Main Timer Loop
  useEffect(() => {
    let interval: any;
    if (isRunning && phase !== 'DONE') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handlePhaseChange();
            return 0;
          }
          if (prev <= 4 && prev > 1 && phase !== 'DONE') playSound('beep');
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, preset, round]);

  // Metronome (Tick) Loop
  useEffect(() => {
    let ticker: any;
    if (isRunning && phase === 'WORK' && preset.tick > 0) {
      ticker = setInterval(() => {
        playSound('tick');
      }, preset.tick * 1000);
    }
    return () => clearInterval(ticker);
  }, [isRunning, phase, preset.tick]);

  const handlePhaseChange = () => {
    if (phase === 'PREP') {
      playSound('end');
      setPhase('WORK');
      setTimeLeft(preset.work);
    } else if (phase === 'WORK') {
      if (round >= preset.rounds) {
        playSound('end');
        setPhase('DONE');
        setIsRunning(false);
      } else {
        playSound('end');
        setPhase('REST');
        setTimeLeft(preset.rest);
      }
    } else if (phase === 'REST') {
      playSound('end');
      setPhase('WORK');
      setRound(prev => prev + 1);
      setTimeLeft(preset.work);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('PREP');
    setRound(1);
    setTimeLeft(5);
  };

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setPreset(p);
    setIsRunning(false);
    setPhase('PREP');
    setRound(1);
    setTimeLeft(5);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    if (phase === 'WORK') return 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]';
    if (phase === 'REST') return 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]';
    if (phase === 'DONE') return 'text-slate-500';
    return 'text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]';
  };

  const totalTimeForPhase = phase === 'PREP' ? 5 : phase === 'WORK' ? preset.work : preset.rest;
  const progressPercent = phase === 'DONE' ? 100 : ((totalTimeForPhase - timeLeft) / totalTimeForPhase) * 100;

  return (
    <div className="p-4 h-full flex flex-col pb-24 max-w-lg mx-auto">
      
      {/* HEADER & SETTINGS */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Chrono</h2>
           <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase mt-1">Terminal Actif</p>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-xl border transition-all ${soundEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
           {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* PRESETS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
         {PRESETS.map((p) => (
            <button 
               key={p.id} 
               onClick={() => handlePresetSelect(p)}
               className={`p-2 rounded-xl text-left border transition-all ${preset.id === p.id ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-900/20' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
            >
               <span className={`text-[10px] font-black uppercase block ${preset.id === p.id ? 'text-white' : ''}`}>{p.name}</span>
               <span className={`text-[9px] font-mono mt-0.5 block ${preset.id === p.id ? 'text-cyan-400' : 'text-slate-600'}`}>{p.desc}</span>
            </button>
         ))}
      </div>

      {/* CERCLE PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
         <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Anneau */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
               <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
               <circle 
                  cx="128" cy="128" r="120" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={(2 * Math.PI * 120) * (1 - progressPercent / 100)}
                  className={`transition-all duration-1000 ease-linear ${
                     phase === 'WORK' ? 'text-cyan-500' : 
                     phase === 'REST' ? 'text-rose-500' : 
                     phase === 'DONE' ? 'text-slate-700' : 'text-amber-500'
                  }`}
               />
            </svg>

            {/* Contenu de l'anneau */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
               <span className={`text-6xl font-black font-mono tracking-tighter transition-colors ${getPhaseColor()}`}>
                  {formatTime(timeLeft)}
               </span>
               <span className="text-sm font-black text-white uppercase tracking-widest mt-2 bg-slate-950 px-3 py-0.5 rounded border border-slate-800">
                  {phase === 'PREP' ? 'PRÉPARATION' : phase === 'DONE' ? 'TERMINÉ' : phase}
               </span>
               {preset.rounds > 1 && (
                 <span className="text-[10px] text-slate-400 font-mono mt-2">ROUND {round} / {preset.rounds}</span>
               )}
            </div>
         </div>
      </div>

      {/* CONTRÔLES */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => setIsRunning(!isRunning)} 
          disabled={phase === 'DONE'}
          className={`flex items-center justify-center py-4 rounded-xl font-black text-sm uppercase transition-all shadow-xl active:scale-95 ${
            phase === 'DONE' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
            isRunning ? 'bg-rose-600/20 text-rose-500 border border-rose-500/50' : 'bg-cyan-500 text-slate-950 shadow-cyan-500/30'
          }`}
        >
           {isRunning ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
           {isRunning ? 'PAUSE' : 'START'}
        </button>
        <button 
          onClick={handleReset} 
          className="flex items-center justify-center py-4 rounded-xl font-black text-sm uppercase bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition-transform"
        >
           <RotateCcw size={18} className="mr-2" /> RESET
        </button>
      </div>

      {/* METADATA PRESET */}
      {preset.tick > 0 && phase !== 'DONE' && (
         <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] font-mono text-amber-500 bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
            <Zap size={14} className="animate-pulse" />
            <span>MÉTRONOME ACTIF ({preset.tick}s)</span>
         </div>
      )}
    </div>
  );
};

export default TimerPage;
