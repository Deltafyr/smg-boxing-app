import React, { useState } from 'react';

const TimerPage: React.FC = () => {
  const [workTime] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="p-4 h-full flex flex-col pb-20 max-w-lg mx-auto">
      <h2 className="text-xl font-bold font-mono text-slate-100 mb-6">TIMER S.M.G</h2>
      <div className="flex-1 flex flex-col items-center justify-center relative"><span className="text-6xl font-black font-mono tracking-tighter text-cyan-400">{workTime}</span></div>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <button onClick={() => setIsRunning(!isRunning)} className="py-4 rounded-xl font-bold text-lg bg-cyan-500 text-slate-950">{isRunning ? 'PAUSE' : 'START'}</button>
        <button className="py-4 rounded-xl font-bold text-lg bg-slate-800 text-slate-300">RESET</button>
      </div>
    </div>
  );
};
export default TimerPage;
