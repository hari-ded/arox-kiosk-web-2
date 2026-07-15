import React from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { SupportOverlay } from '../components/SupportOverlay';
import { Button } from '../components/Button';
import { toggleKioskSoundEnabled, useKioskSoundEnabled } from '../utils/audio';
import aroxLogo from '../../assets/arox-logo.png';

const IDLE_TIMEOUT_MS = 55_000;

export const KioskLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const soundEnabled = useKioskSoundEnabled();
  const lastInteractionRef = React.useRef(Date.now());
  const showWatermark = location.pathname !== '/';

  React.useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, [location.pathname, navigate]);

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

      <div className="kiosk-watermark fixed left-[max(1.5rem,env(safe-area-inset-left))] top-[max(1.5rem,env(safe-area-inset-top))] z-40 pointer-events-auto">
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
      </div>

      {showWatermark && (
        <div className="fixed top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] z-20 pointer-events-none">
          <img src={aroxLogo} alt="Arox" className="h-12 w-auto opacity-70 drop-shadow-sm" />
        </div>
      )}

      <main className="kiosk-main flex-1 flex flex-col z-10 pb-28 pt-24">
        <Outlet />
      </main>

      <footer className="kiosk-footer absolute bottom-0 left-0 w-full px-6 pb-6 pt-4 sm:px-8 sm:pb-8 flex justify-between items-end z-20 pointer-events-none">
        <div className="w-1/3"></div>

        <div className="w-1/3 flex justify-center">
          <div className="kiosk-footer__status bg-white border border-gray-100 shadow-sm rounded-full px-6 py-2 flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            <span className="text-sm font-bold tracking-widest text-gray-500 uppercase">Printer Ready</span>
          </div>
        </div>

        <div className="w-1/3 flex justify-end">
          <span className="kiosk-footer__brand text-gray-400 text-sm font-medium text-right">
            A Product of <span className="text-[#f03861] font-bold">SPARKH INFOTECH LLP</span>
          </span>
        </div>
      </footer>

      <SupportOverlay />
    </div>
  );
};



