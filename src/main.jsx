
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';
import { injectSpeedInsights } from '@vercel/speed-insights';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Enable Vercel Speed Insights only in production
if (import.meta.env.PROD) {
  injectSpeedInsights();
}
