import React from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { SupportOverlay } from '../components/SupportOverlay';
import { Button } from '../components/Button';
import { toggleKioskSoundEnabled, useKioskSoundEnabled } from '../utils/audio';

const IDLE_TIMEOUT_MS = 55_000;

export const KioskLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const soundEnabled = useKioskSoundEnabled();
  const lastInteractionRef = React.useRef(Date.now());

  React.useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, [location.pathname]);

  React.useEffect(() => {
    const markActive = () => {
      lastInteractionRef.current = Date.now();
    };

    const activityEvents: Array<keyof DocumentEventMap> = ['pointerdown', 'touchstart', 'keydown', 'mousedown'];
    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, markActive, { passive: true });
    });

    const idleCheck = window.setInterval(() => {
      if (location.pathname === '/agent') {
        return;
      }

      if (location.pathname !== '/' && Date.now() - lastInteractionRef.current >= IDLE_TIMEOUT_MS) {
        lastInteractionRef.current = Date.now();
        navigate('/', { replace: true });
      }
    }, 5000);

    return () => {
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, markActive);
      });
      window.clearInterval(idleCheck);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="kiosk-shell relative h-full w-full flex flex-col overflow-hidden selection:bg-[#f03861]/20 bg-[#fafafc] text-gray-900 font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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

      <header className="kiosk-header relative z-20 flex h-[84px] items-center justify-between gap-4 px-6 pt-4">
        <div className="flex h-[36px] items-center">
          <span className="text-[13px] font-semibold uppercase tracking-[0.24em] text-gray-400">PrintEZ Kiosk</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full w-[60px] px-0 bg-white/90 backdrop-blur-md shadow-sm border-white/70"
          onClick={toggleKioskSoundEnabled}
          aria-label={soundEnabled ? 'Mute kiosk sounds' : 'Unmute kiosk sounds'}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </Button>
      </header>

      <main className="kiosk-main relative z-10 flex flex-1 flex-col px-6 pt-2 pb-[92px]">
        <Outlet />
      </main>

      <footer className="kiosk-footer absolute bottom-0 left-0 z-20 flex w-full items-end justify-between px-6 pb-4 pointer-events-none">
        <div className="w-1/3"></div>

        <div className="flex w-1/3 justify-center">
          <div className="kiosk-footer__status flex items-center space-x-2 rounded-full border border-gray-100 bg-white px-6 py-2 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
            <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">Printer Ready</span>
          </div>
        </div>

        <div className="flex w-1/3 justify-end">
          <span className="kiosk-footer__brand text-right text-sm font-medium text-gray-400">
            A Product of <span className="font-bold text-[#f03861]">SPARKH INFOTECH LLP</span>
          </span>
        </div>
      </footer>

      <SupportOverlay />
    </div>
  );
};
