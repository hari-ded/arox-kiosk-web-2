import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { KioskLayout } from './layouts/KioskLayout';
import { KioskErrorLayer } from './components/KioskErrorLayer';
import { Home } from './pages/kiosk/Home';
import { QRScan } from './pages/kiosk/QRScan';
import { CodeEntry } from './pages/kiosk/CodeEntry';
import { PrintConfirmation } from './pages/kiosk/PrintConfirmation';
import { PrintStatus } from './pages/kiosk/PrintStatus';
import { LowSupplyScreen } from './pages/kiosk/LowSupplyScreen';
import { AgentConsole } from './pages/agent/AgentConsole';

export default function App() {
  return (
    <div className="kiosk-app min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#f03861]/20">
      <KioskErrorLayer>
        <Routes>
          <Route element={<KioskLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/scan" element={<QRScan />} />
            <Route path="/code" element={<CodeEntry />} />
            <Route path="/confirm/:jobId" element={<PrintConfirmation />} />
            <Route path="/status/:jobId" element={<PrintStatus />} />
            <Route path="/low-supply" element={<LowSupplyScreen />} />
          </Route>

          <Route path="/agent" element={<AgentConsole />} />
        </Routes>
      </KioskErrorLayer>
    </div>
  );
}

