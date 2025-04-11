import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router';
import './index.css';
import 'rc-tree/assets/index.css';



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
