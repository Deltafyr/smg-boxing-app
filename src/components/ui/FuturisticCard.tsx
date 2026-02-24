import React from 'react';
interface CardProps { children: React.ReactNode; className?: string; title?: string; borderColor?: 'cyan' | 'rose' | 'slate'; }
const FuturisticCard: React.FC<CardProps> = ({ children, className = '', title, borderColor = 'slate' }) => {
  const borderColors = { cyan: 'border-cyan-500/30 shadow-[0_0_15px_-5px_rgba(6,182,212,0.1)]', rose: 'border-rose-500/30 shadow-[0_0_15px_-5px_rgba(244,63,94,0.1)]', slate: 'border-slate-700/50' };
  const accent = borderColor === 'cyan' ? 'border-cyan-400' : borderColor === 'rose' ? 'border-rose-400' : 'border-slate-500';
  return (
    <div className={`relative bg-slate-900/50 backdrop-blur-md border ${borderColors[borderColor] || borderColors.slate} rounded-2xl p-4 overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 rounded-tl-lg ${accent}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 rounded-tr-lg ${accent}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 rounded-bl-lg ${accent}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 rounded-br-lg ${accent}`} />
      {title && <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-3 border-b border-slate-800 pb-1">{title}</h3>}
      {children}
    </div>
  );
};
export default FuturisticCard;
