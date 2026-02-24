import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Edit3 } from 'lucide-react';

const CATEGORIES = {
  SPARRING: [
    { id: 'sp_1', name: 'Assaut 1min', work: 60, rest: 30, rounds: 3, tick: 0, desc: '1m / 30s' },
    { id: 'sp_2', name: 'Assaut 2min', work: 120, rest: 60, rounds: 3, tick: 0, desc: '2m / 1m' }
  ],
  CARDIO: [
    { id: 'c_pma', name: 'PMA Aérobie', work: 60, rest: 60, rounds: 6, tick: 0, desc: '1m / 1m' },
    { id: 'c_ana', name: 'Anaérobie Lactique', work: 30, rest: 30, rounds: 8, tick: 0, desc: '30s / 30s' },
    { id: 'c_ala', name: 'Explosivité', work: 10, rest: 50, rounds: 6, tick: 0, desc: '10s / 50s' }
  ],
  LEGS: [
    { id: 'l_100k', name: '100 Kicks', work: 60, rest: 0, rounds: 1, tick: 0.6, desc: 'Objectif: 100 kicks en 1m' },
    { id: 'l_3030', name: '30x30 (3x2m)', work: 30, rest: 30, rounds: 6, tick: 0, desc: '30s/30s (6 Rds)' }
  ]
};

export default function TimerPage() {
  const [activeCat, setActiveCat] = useState<'SPARRING'|'CARDIO'|'LEGS'|'MANUEL'>('SPARRING');
  const [preset, setPreset] = useState(CATEGORIES.SPARRING[0]);
  
  const [cw, setCw] = useState(120); const [cr, setCr] = useState(30); const [cRounds, setCRounds] = useState(3);
  const [timeLeft, setTimeLeft] = useState(5); const [phase, setPhase] = useState<'PREP' | 'WORK' | 'REST' | 'DONE'>('PREP');
  const [round, setRound] = useState(1); const [isRunning, setIsRunning] = useState(false);
  
  const [snd, setSnd] = useState(true); const audioCtx = useRef<AudioContext | null>(null);

  const getW = () => activeCat === 'MANUEL' ? cw : preset.work;
  const getR = () => activeCat === 'MANUEL' ? cr : preset.rest;
  const getRd = () => activeCat === 'MANUEL' ? cRounds : preset.rounds;

  const speak = (txt: string) => { 
    if (!snd || !('speechSynthesis' in window)) return; 
    window.speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(txt); 
    u.lang = 'fr-FR'; u.rate = 1.2; window.speechSynthesis.speak(u); 
  };

  const play = (t: string) => {
    if (!snd) return; if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current; if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
    if (t === 'b') { o.frequency.value = 880; o.type = 'square'; g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.2); }
    else if (t === 'tick') { o.frequency.value = 1200; o.type = 'sine'; g.gain.value = 0.05; g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); o.start(); o.stop(ctx.currentTime + 0.1); }
    else { o.frequency.value = 440; o.type = 'sawtooth'; g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.8); }
  };

  const switchCat = (cat: any) => {
    setActiveCat(cat);
    if (cat !== 'MANUEL') setPreset(CATEGORIES[cat as keyof typeof CATEGORIES][0]);
    setIsRunning(false); setPhase('PREP'); setRound(1); setTimeLeft(5);
  };

  const reset = () => { setIsRunning(false); setPhase('PREP'); setRound(1); setTimeLeft(5); };

  // Main Chrono Loop
  useEffect(() => {
    let i: any;
    if (isRunning && phase !== 'DONE') {
      i = setInterval(() => {
        setTimeLeft((p) => {
          if (phase === 'WORK' && p === 31) speak('Trente secondes');
          if (phase === 'WORK' && p === 11) speak('Dix');
          if (p <= 4 && p > 1 && phase !== 'DONE') play('b');
          if (p <= 1) {
            if (phase === 'PREP') { play('e'); speak('Travail'); setPhase('WORK'); return getW(); }
            else if (phase === 'WORK') {
              if (round >= getRd()) { play('e'); speak('Entraînement terminé'); setPhase('DONE'); setIsRunning(false); return 0; }
              else { play('e'); speak('Repos'); setPhase('REST'); return getR(); }
            } else { play('e'); setPhase('WORK'); setRound(r => r + 1); speak(`Round ${round + 1}`); return getW(); }
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(i);
  }, [isRunning, phase, preset, round, activeCat, cw, cr, cRounds]);

  // Metronome Loop for Kicks
  useEffect(() => {
    let ticker: any;
    if (isRunning && phase === 'WORK' && activeCat !== 'MANUEL' && preset.tick > 0) {
      ticker = setInterval(() => { play('tick'); }, preset.tick * 1000);
    }
    return () => clearInterval(ticker);
  }, [isRunning, phase, preset, activeCat]);

  const getNextStepInfo = () => {
    if (phase === 'PREP') return `Travail (${getW()}s)`;
    if (phase === 'DONE') return '-';
    if (phase === 'WORK') return round >= getRd() ? 'Terminé' : `Repos (${getR()}s)`;
    if (phase === 'REST') return `Round ${round + 1} (${getW()}s)`;
    return '';
  };

  const pct = phase === 'DONE' ? 100 : (((phase === 'PREP' ? 5 : phase === 'WORK' ? getW() : getR()) - timeLeft) / (phase === 'PREP' ? 5 : phase === 'WORK' ? getW() : getR())) * 100;
  const color = phase === 'WORK' ? 'text-cyan-400' : phase === 'REST' ? 'text-rose-500' : phase === 'DONE' ? 'text-slate-500' : 'text-amber-500';

  return (
    <div className="p-4 h-full flex flex-col pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-2xl font-black text-white italic uppercase">Chrono</h2></div>
        <button onClick={() => setSnd(!snd)} className="p-2 rounded-xl border border-slate-700">{snd ? <Volume2 size={20} className="text-cyan-400"/> : <VolumeX size={20} className="text-slate-500"/>}</button>
      </div>

      <div className="flex space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl mb-3 overflow-x-auto">
        {['SPARRING', 'CARDIO', 'LEGS', 'MANUEL'].map(cat => (
          <button key={cat} onClick={() => switchCat(cat)} className={`flex-1 min-w-[70px] py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeCat === cat ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>{cat}</button>
        ))}
      </div>

      {activeCat !== 'MANUEL' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {CATEGORIES[activeCat as keyof typeof CATEGORIES].map(p => (
            <button key={p.id} onClick={() => {setPreset(p); reset();}} className={`p-2 rounded-xl text-left border ${preset.id === p.id ? 'bg-slate-800 border-cyan-500' : 'bg-slate-900/50 border-slate-800'}`}>
               <span className="text-[10px] font-black uppercase text-white block">{p.name}</span>
               <span className="text-[8px] font-mono text-cyan-500 block mt-0.5">{p.desc}</span>
            </button>
          ))}
        </div>
      )}

      {activeCat === 'MANUEL' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 mb-3 flex space-x-3">
           <Edit3 className="text-slate-500 shrink-0 mt-1" size={16} />
           <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Travail(s)</label><input type="number" value={cw} onChange={e => {setCw(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-cyan-400 outline-none" /></div>
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Repos(s)</label><input type="number" value={cr} onChange={e => {setCr(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-rose-400 outline-none" /></div>
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Rounds</label><input type="number" value={cRounds} onChange={e => {setCRounds(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-white outline-none" /></div>
           </div>
        </div>
      )}

      {/* HUD TIMELINE POUR CARDIO/LEGS */}
      {(activeCat === 'CARDIO' || activeCat === 'LEGS') && (
        <div className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono shadow-inner mb-2">
          <div className="text-left w-1/3">
            <span className="text-slate-500 uppercase text-[8px] block">Actuel</span>
            <span className={`font-bold ${color}`}>{phase === 'PREP' ? 'Prépa' : phase === 'WORK' ? 'Effort' : phase === 'REST' ? 'Repos' : 'Terminé'}</span>
          </div>
          <div className="text-slate-600 flex-1 text-center font-bold">&gt;&gt;</div>
          <div className="text-right w-1/3">
            <span className="text-slate-500 uppercase text-[8px] block">À suivre</span>
            <span className="font-bold text-white">{getNextStepInfo()}</span>
          </div>
        </div>
      )}

      {/* CERCLE GEANT */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
         <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full transform -rotate-90">
               <circle cx="200" cy="200" r="185" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900" />
               <circle cx="200" cy="200" r="185" stroke="currentColor" strokeWidth="12" fill="transparent" strokeLinecap="round" strokeDasharray={2*Math.PI*185} strokeDashoffset={(2*Math.PI*185)*(1-pct/100)} className={`transition-all duration-1000 ${color}`} />
            </svg>
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
               <span className={`font-black font-mono tracking-tighter ${color}`} style={{fontSize: '5.5rem', lineHeight: '1'}}>{`${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`}</span>
               <span className="text-xl font-black text-white uppercase tracking-widest mt-4 bg-slate-950 px-6 py-1.5 rounded-xl border border-slate-800">{phase}</span>
               {getRd() > 1 && <span className="text-sm text-slate-400 font-mono mt-3 uppercase tracking-widest">ROUND <span className="text-white font-bold">{round}</span> / {getRd()}</span>}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <button onClick={() => { if (!isRunning && phase === 'PREP') speak('Préparation ' + (activeCat === 'MANUEL' ? 'Manuel' : preset.name)); setIsRunning(!isRunning); }} disabled={phase === 'DONE'} className={`flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase transition-all shadow-xl active:scale-95 ${phase === 'DONE' ? 'bg-slate-800 text-slate-600' : isRunning ? 'bg-rose-600/20 text-rose-500 border border-rose-500/50' : 'bg-cyan-500 text-slate-950'}`}>
           {isRunning ? <Pause size={24} className="mr-2" /> : <Play size={24} className="mr-2" />} {isRunning ? 'PAUSE' : 'START'}
        </button>
        <button onClick={reset} className="flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase bg-slate-800 text-white border border-slate-700 active:scale-95 transition-transform"><RotateCcw size={20} className="mr-2"/> RESET</button>
      </div>

    </div>
  );
}
