import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (<div className="min-h-screen bg-[#020617] text-rose-500 p-8 font-mono flex flex-col items-center justify-center text-center"><div className="w-16 h-16 border-4 border-rose-500 rounded-full flex items-center justify-center font-black text-2xl mb-4 animate-pulse">!</div><h1 className="text-xl font-black uppercase mb-2">Crash Système</h1><div className="bg-slate-900 p-4 rounded border border-rose-500/30 text-xs text-left max-w-md w-full overflow-x-auto">{this.state.error?.message || 'Erreur inconnue'}</div></div>);
    return this.props.children;
  }
}
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("CRITIQUE: L'élément root est introuvable");
ReactDOM.createRoot(rootElement).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);