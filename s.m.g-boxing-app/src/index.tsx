import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Assure-toi que Tailwind est bien configuré ici

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);