import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { SupportOverlay } from '../components/SupportOverlay';
import aroxLogo from '../../assets/arox-logo.png';

export const KioskLayout = () => {
  const location = useLocation();
  const showWatermark = location.pathname !== '/';

  return (
    <div className="kiosk-shell relative h-[100dvh] w-full flex flex-col overflow-hidden selection:bg-[#f03861]/20 bg-[#fafafc] text-gray-900 font-sans">
      <div className="kiosk-shell__overlay absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-3 h-3 rounded-full bg-pink-200 opacity-50"></div>
        <div className="absolute top-[5%] right-[25%] w-4 h-4 rounded-full bg-orange-200 opacity-50"></div>
        <div className="absolute top-[2%] right-[15%] w-2 h-2 rounded-full bg-rose-300 opacity-50"></div>
        <div className="absolute top-[30%] left-[20%] w-3 h-3 rounded-full bg-pink-300 opacity-50"></div>
        <div className="absolute top-[25%] right-[20%] w-3 h-3 rounded-full bg-orange-200 opacity-50"></div>
        <div className="absolute bottom-[40%] right-[15%] w-4 h-4 rounded-full bg-rose-300 opacity-50"></div>
        <div className="absolute bottom-[20%] right-[30%] w-3 h-3 rounded-full bg-orange-200 opacity-50"></div>
        <div className="absolute bottom-[10%] left-[40%] w-2 h-2 rounded-full bg-pink-200 opacity-50"></div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-60"></div>

      {showWatermark && (
        <div className="kiosk-watermark absolute top-6 right-6 z-20 pointer-events-none">
          <img
            src={aroxLogo}
            alt="Arox"
            className="h-8 w-auto max-w-[7rem] object-contain opacity-70 drop-shadow-sm sm:h-10 sm:max-w-[8.5rem]"
          />
        </div>
      )}

      <main className="kiosk-main flex-1 flex flex-col z-10 pb-24">
        <Outlet />
      </main>

      <footer className="kiosk-footer absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
        <div className="w-1/3"></div>

        <div className="w-1/3 flex justify-center">
          <div className="kiosk-footer__status bg-white border border-gray-100 shadow-sm rounded-full px-6 py-2 flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">Printer Ready</span>
          </div>
        </div>

        <div className="w-1/3 flex justify-end">
          <span className="kiosk-footer__brand text-gray-400 text-sm font-medium">
            A Product of <strong>SPARKH INFOTECH LLP</strong>
          </span>
        </div>
      </footer>

      <SupportOverlay />
    </div>
  );
};
