import { create } from 'zustand';
interface SystemState {
  tokenStatus: string; isProcessing: boolean; consoleOutput: string;
  callCortex: (action: string, payload: any) => Promise<void>;
  setConsoleOutput: (msg: string) => void;
}
export const useSystemStore = create<SystemState>((set) => ({
  tokenStatus: 'DISCONNECTED', isProcessing: false, consoleOutput: '',
  callCortex: async () => {
     set({ isProcessing: true });
     setTimeout(() => set({ isProcessing: false, consoleOutput: 'Cortex Link Stabilisé.' }), 1000);
  },
  setConsoleOutput: (msg) => set({ consoleOutput: msg })
}));
