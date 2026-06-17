import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Global fetch interceptor to route relative API and published calls directly to Render (Auto deploy v2)
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string') {
    if (input.startsWith('/api/')) {
      input = 'https://creator-backend-ar1g.onrender.com' + input;
    } else if (input.startsWith('/published/')) {
      input = 'https://creator-backend-ar1g.onrender.com' + input;
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
