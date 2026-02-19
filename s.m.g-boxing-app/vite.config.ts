import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 1. Charge toutes les variables locales
    const env = loadEnv(mode, process.cwd(), '');
    
    // 2. Cherche la clé PARTOUT (Vercel standard, Vercel VITE_, ou fichier local)
    const apiKey = process.env.GEMINI_API_KEY 
                || process.env.VITE_GEMINI_API_KEY 
                || env.GEMINI_API_KEY 
                || env.VITE_GEMINI_API_KEY 
                || "CLE_MANQUANTE";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 3. Injecte la clé de force dans le code de l'application
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 2000
      }
    };
});