import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Edit3 } from 'lucide-react';
import FuturisticCard from '../../components/ui/FuturisticCard';

const PRESETS = [
  { id: 'sp_pro', name: 'Sparring Pro', work: 180, rest: 60, rounds: 3, tick: 0, desc: '3m / 1m' },
  { id: 'aerobie', name: 'PMA', work: 60, rest: 60, rounds: 6, tick: 0, desc: 'FFKMDA 1m/1m' },
  { id: 'anaerobie', name: 'Anaérobie', work: 30, rest: 30, rounds: 8, tick: 0, desc: 'Lactique 30s/30s' },
  { id: 'custom', name: 'Manuel', work: 120, rest: 30, rounds: 3, tick: 0, desc: 'Config.' }
];

export default function TimerPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [cw, setCw] = useState(120); const [cr, setCr] = useState(30); const [cRounds, setCRounds] = useState(3);
  const [timeLeft, setTimeLeft] = useState(5); const [phase, setPhase] = useState<'PREP' | 'WORK' | 'REST' | 'DONE'>('PREP');
  const [round, setRound] = useState(1); const [isRunning, setIsRunning] = useState(false);
  const [snd, setSnd] = useState(true); const audioCtx = useRef<AudioContext | null>(null);

  const speak = (txt: string) => { if (!snd || !('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = 1.3; window.speechSynthesis.speak(u); };
  const play = (t: string) => {
    if (!snd) return; if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx.current; if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
    if (t === 'b') { o.frequency.value = 880; o.type = 'square'; g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.2); }
    else { o.frequency.value = 440; o.type = 'sawtooth'; g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.8); }
  };

  const getW = () => preset.id === 'custom' ? cw : preset.work;
  const getR = () => preset.id === 'custom' ? cr : preset.rest;
  const getRd = () => preset.id === 'custom' ? cRounds : preset.rounds;

  useEffect(() => {
    let i: any;
    if (isRunning && phase !== 'DONE') {
      i = setInterval(() => {
        setTimeLeft((p) => {
          if (phase === 'WORK' && p === 31) speak('Trente secondes');
          if (phase === 'WORK' && p === 11) speak('Dix');
          if (p <= 4 && p > 1 && phase !== 'DONE') play('b');
          if (p <= 1) {
            if (phase === 'PREP') { play('e'); speak('Boxez'); setPhase('WORK'); return getW(); }
            else if (phase === 'WORK') {
              if (round >= getRd()) { play('e'); speak('Terminé'); setPhase('DONE'); setIsRunning(false); return 0; }
              else { play('e'); speak('Repos'); setPhase('REST'); return getR(); }
            } else { play('e'); setPhase('WORK'); setRound(r => r + 1); speak(`Round ${round + 1}`); return getW(); }
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(i);
  }, [isRunning, phase, preset, round, cw, cr, cRounds]);

  const reset = () => { setIsRunning(false); setPhase('PREP'); setRound(1); setTimeLeft(5); };

  const pct = phase === 'DONE' ? 100 : (((phase === 'PREP' ? 5 : phase === 'WORK' ? getW() : getR()) - timeLeft) / (phase === 'PREP' ? 5 : phase === 'WORK' ? getW() : getR())) * 100;
  const color = phase === 'WORK' ? 'text-cyan-400' : phase === 'REST' ? 'text-rose-500' : phase === 'DONE' ? 'text-slate-500' : 'text-amber-500';

  return (
    <div className="p-4 h-full flex flex-col pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black text-white italic uppercase">Chrono</h2></div><button onClick={() => setSnd(!snd)} className="p-3 rounded-xl border border-slate-700">{snd ? <Volume2 size={20} className="text-cyan-400"/> : <VolumeX size={20} className="text-slate-500"/>}</button></div>
      <div className="grid grid-cols-2 gap-2 mb-4">{PRESETS.map(p => (<button key={p.id} onClick={() => {setPreset(p); reset();}} className={`p-2 rounded-xl text-left border ${preset.id === p.id ? 'bg-slate-800 border-cyan-500' : 'bg-slate-900/50 border-slate-800'}`}><span className="text-[10px] font-black uppercase text-white block">{p.name}</span></button>))}</div>
      
      {preset.id === 'custom' && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 mb-4 flex space-x-3">
           <Edit3 className="text-slate-500 shrink-0 mt-1" size={16} />
           <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Travail(s)</label><input type="number" value={cw} onChange={e => {setCw(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-cyan-400 outline-none" /></div>
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Repos(s)</label><input type="number" value={cr} onChange={e => {setCr(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-rose-400 outline-none" /></div>
              <div className="flex flex-col"><label className="text-[8px] text-slate-500 uppercase mb-1">Rounds</label><input type="number" value={cRounds} onChange={e => {setCRounds(Number(e.target.value)); reset();}} className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-white outline-none" /></div>
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
         <div className="relative w-80 h-80 flex items-center justify-center">
            <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full transform -rotate-90">
               <circle cx="160" cy="160" r="145" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900" />
               <circle cx="160" cy="160" r="145" stroke="currentColor" strokeWidth="10" fill="transparent" strokeLinecap="round" strokeDasharray={2*Math.PI*145} strokeDashoffset={(2*Math.PI*145)*(1-pct/100)} className={`transition-all duration-1000 ${color}`} />
            </svg>
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
               <span className={`text-8xl font-black font-mono tracking-tighter ${color}`}>{`${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`}</span>
               <span className="text-lg font-black text-white uppercase tracking-widest mt-2 bg-slate-950 px-4 py-1 rounded-xl border border-slate-800">{phase}</span>
               {getRd() > 1 && <span className="text-xs text-slate-400 font-mono mt-3 uppercase">ROUND <span className="text-white font-bold">{round}</span> / {getRd()}</span>}
            </div>
         </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button onClick={() => setIsRunning(!isRunning)} disabled={phase === 'DONE'} className="flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase bg-cyan-500 text-slate-950">{isRunning ? 'PAUSE' : 'START'}</button>
        <button onClick={reset} className="flex items-center justify-center py-5 rounded-2xl font-black text-lg uppercase bg-slate-800 text-white">RESET</button>
      </div>
    </div>
  );
}
