import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

function initDashboard() {
  const rootElement = document.getElementById('hidden-deals-root') || document.getElementById('root');

  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
