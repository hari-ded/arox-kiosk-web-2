import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
<<<<<<< HEAD
import './kiosk-legacy.css';
import { applyKioskModeAttribute } from './lib/kioskMode';

applyKioskModeAttribute();
=======
>>>>>>> e0c84d9 (done)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
