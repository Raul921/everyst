import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a script to check for preference of dark mode before render to prevent flashing
const script = document.createElement('script');
script.innerHTML = `
  (function() {
    // Check if user has a theme preference
    const theme = localStorage.getItem('theme');
    // If they do, apply it immediately to prevent flashing
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })();
`;
document.head.appendChild(script);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
