import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import Develop from './Develop';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{window.location.pathname.replace(/\/$/,'')==='/admin'?<Admin/>:window.location.pathname.replace(/\/$/,'')==='/develop'?<Develop/>:<App/>}</React.StrictMode>);
