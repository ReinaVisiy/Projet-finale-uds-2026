import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';  // <-- IMPORTANT
import App from './App';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>   {/* <-- ENVELOPPEZ VOTRE APP ICI */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);