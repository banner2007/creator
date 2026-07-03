import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Global fetch interceptor to dynamically resolve API and published calls to localhost in development,
// and relative URLs in production (proxied automatically via Firebase Hosting rewrites).
// Fallback to Render is active if the site is loaded from other domains during migration.
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string') {
    if (input.startsWith('/api/') || input.startsWith('/published/')) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isFirebaseOrCustom = window.location.hostname.includes('web.app') || 
                                  window.location.hostname.includes('firebaseapp.com') || 
                                  window.location.hostname.includes('shopy.uno');
      
      if (isLocalhost) {
        input = 'http://localhost:3000' + input;
      } else if (!isFirebaseOrCustom) {
        // Temporarily fallback to Render backend if we are not on Firebase/domain yet
        input = 'https://creator-backend-ar1g.onrender.com' + input;
      }
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
