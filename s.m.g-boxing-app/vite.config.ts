import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Charge les variables locales (.env.local) si on est sur le PC
    const env = loadEnv(mode, '.', '');
    
    // Récupère la clé soit depuis Vercel (process.env), soit depuis le PC (env)
    const geminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Injection forcée de la clé pour que l'appli la trouve
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000 // Pour enlever le warning jaune de tout à l'heure
      }
    };
});