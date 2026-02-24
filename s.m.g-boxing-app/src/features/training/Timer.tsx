import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Edit3 } from 'lucide-react';
import FuturisticCard from '../../components/ui/FuturisticCard';

const PRESETS = [
  { id: 'sp_pro', name: 'Sparring Pro', work: 180, rest: 60, rounds: 3, tick: 0, desc: '3m / 1m' },
  { id: 'aerobie', name: 'PMA (Aérobie)', work: 60, rest: 60, rounds: 6, tick: 0, desc: 'FFKMDA 1m/1m' },
  { id: 'anaerobie_lac', name: 'Anaérobie Lactique', work: 30, rest: 30, rounds: 8, tick: 0, desc: 'Lactique 30s/30s' },
  { id: 'anaerobie_alac', name: 'Explosivité Alactique', work: 10, rest: 50, rounds: 6, tick: 0, desc: 'Vitesse 10s/50s' },
  { id: 'kicks', name: '100 Kicks', work: 60, rest: 0, rounds: 1, tick: 0.6, desc: 'Objectif 1min' },
  { id: 'custom', name: 'Manuel', work: 120, rest: 30, rounds: 3, tick: 0, desc: 'Configuration' }
];

const TimerPage: React.FC = () => {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customWork, setCustomWork] = useState(120);
  const [customRest, setCustomRest] = useState(30);
  const [customRounds, setCustomRounds] = useState(3);
  
  const [timeLeft, setTimeLeft] = useState(5); // 5s prep
  const [phase, setPhase] = useState<'PREP' | 'WORK' | 'REST' | 'DONE'>('PREP');
  const [round, setRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtx = useRef<AudioContext | null>(null);

  // Fonction de synthèse vocale
  const speak = (text: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stoppe la phrase précédente
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.3;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
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
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  };

  const getWorkTime = () => preset.id === 'custom' ? customWork : preset.work;
  const getRestTime = () => preset.id === 'custom' ? customRest : preset.rest;
  const getRounds = () => preset.id === 'custom' ? customRounds : preset.rounds;

  // Main Timer Loop
  useEffect(() => {
    let interval: any;
    if (isRunning && phase !== 'DONE') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          // Annonces vocales stratégiques
          if (phase === 'WORK') {
            if (prev === 31) speak('Trente secondes');
            if (prev === 11) speak('Dix');
          }
          
          if (prev <= 4 && prev > 1 && phase !== 'DONE') playSound('beep');
          
          if (prev <= 1) {
            handlePhaseChange();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, phase, preset, round, customWork, customRest, customRounds]);

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
    const totalRounds = getRounds();
    
    if (phase === 'PREP') {
      playSound('end');
      speak(`Boxez`);
      setPhase('WORK');
      setTimeLeft(getWorkTime());
    } else if (phase === 'WORK') {
      if (round >= totalRounds) {
        playSound('end');
        speak('Entraînement terminé');
        setPhase('DONE');
        setIsRunning(false);
      } else {
        playSound('end');
        speak('Repos');
        setPhase('REST');
        setTimeLeft(getRestTime());
      }
    } else if (phase === 'REST') {
      playSound('end');
      setPhase('WORK');
      setRound(prev => prev + 1);
      speak(`Round ${round + 1}`);
      setTimeLeft(getWorkTime());
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
    if (phase === 'WORK') return 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]';
    if (phase === 'REST') return 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]';
    if (phase === 'DONE') return 'text-slate-500';
    return 'text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]';
  };

  const totalTimeForPhase = phase === 'PREP' ? 5 : phase === 'WORK' ? getWorkTime() : getRestTime();
  const progressPercent = phase === 'DONE' ? 100 : ((totalTimeForPhase - timeLeft) / totalTimeForPhase) * 100;
  
  // Géométrie du cercle agrandi
  const radius = 145;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="p-4 h-full flex flex-col pb-24 max-w-lg mx-auto">
      
      {/* HEADER & SETTINGS */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Chrono</h2>
           <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase mt-1">S.M.G Elite Timer</p>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl border transition-all ${soundEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
           {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* PRESETS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
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

      {/* REGLAGE MANUEL (Affiché uniquement si Manuel sélectionné) */}
      {preset.id === 'custom' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 mb-6 flex space-x-3 animate-fade-in shadow-inner">
           <Edit3 className="text-slate-500 shrink-0 mt-1" size={16} />
           <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                 <label className="text-[8px] text-slate-500 font-bold uppercase mb-1">Travail (s)</label>
                 <input type="number" value={customWork} onChange={e => {setCustomWork(Number(e.target.value)); handleReset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-cyan-400 font-mono outline-none" />
              </div>
              <div className="flex flex-col">
                 <label className="text-[8px] text-slate-500 font-bold uppercase mb-1">Repos (s)</label>
                 <input type="number" value={customRest} onChange={e => {setCustomRest(Number(e.target.value)); handleReset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-rose-400 font-mono outline-none" />
              </div>
              <div className="flex flex-col">
                 <label className="text-[8px] text-slate-500 font-bold uppercase mb-1">Rounds</label>
                 <input type="number" value={customRounds} onChange={e => {setCustomRounds(Number(e.target.value)); handleReset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-white font-mono outline-none" />
              </div>
           </div>
        </div>
      )}

      {/* CERCLE PRINCIPAL (AGRANDI) */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
         <div className="relative w-80 h-80 flex items-center justify-center">
            {/* SVG Anneau */}
            <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full transform -rotate-90">
               <circle cx="160" cy="160" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900" />
               <circle 
                  cx="160" cy="160" r={radius} 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progressPercent / 100)}
                  className={`transition-all duration-1000 ease-linear ${
                     phase === 'WORK' ? 'text-cyan-500' : 
                     phase === 'REST' ? 'text-rose-500' : 
                     phase === 'DONE' ? 'text-slate-800' : 'text-amber-500'
                  }`}
               />
            </svg>

            {/* Contenu de l'anneau */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
               <span className={`text-8xl font-black font-mono tracking-tighter transition-colors ${getPhaseColor()}`}>
                  {formatTime(timeLeft)}
               </span>
               <span className="text-lg font-black text-white uppercase tracking-widest mt-2 bg-slate-950 px-4 py-1 rounded-xl border border-slate-800 shadow-xl">
                  {phase === 'PREP' ? 'PRÉPARATION' : phase === 'DONE' ? 'TERMINÉ' : phase}
               </span>
               {getRounds() > 1 && (
                 <span className="text-xs text-slate-400 font-mono mt-3 uppercase tracking-widest">
                   ROUND <span className="text-white font-bold">{round}</span> / {getRounds()}
                 </span>
               )}
            </div>
         </div>
      </div>

      {/* CONTRÔLES */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button 
          onClick={() => {
            if (!isRunning && phase === 'PREP') playSound('tick'); // Initialise l'audio
            setIsRunning(!isRunning);
          }} 
          disabled={phase === 'DONE'}
          className={`flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase transition-all shadow-xl active:scale-95 ${
            phase === 'DONE' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
            isRunning ? 'bg-rose-600/20 text-rose-500 border border-rose-500/50 hover:bg-rose-600/30' : 'bg-cyan-500 text-slate-950 shadow-cyan-500/30 hover:bg-cyan-400'
          }`}
        >
           {isRunning ? <Pause size={24} className="mr-3" /> : <Play size={24} className="mr-3" />}
           {isRunning ? 'PAUSE' : 'START'}
        </button>
        <button 
          onClick={handleReset} 
          className="flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition-transform hover:bg-slate-700"
        >
           <RotateCcw size={24} className="mr-3" /> RESET
        </button>
      </div>

      {/* METADATA PRESET */}
      {preset.tick > 0 && phase !== 'DONE' && (
         <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-mono text-amber-500 bg-amber-500/10 py-3 rounded-xl border border-amber-500/20">
            <Zap size={16} className="animate-pulse" />
            <span>MÉTRONOME ACTIF ({preset.tick}s)</span>
         </div>
      )}
    </div>
  );
};

export default TimerPage;
