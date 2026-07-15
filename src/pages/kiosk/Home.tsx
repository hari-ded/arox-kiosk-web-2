import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import aroxLogo from '../../../assets/arox-logo.png';
import { LowSupplyScreen } from './LowSupplyScreen';
import { ConsumablesStatus, getConsumables } from '../../services/api';
import { Button } from '../../components/Button';

export const Home = () => {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<'checking' | 'ready' | 'low'>('checking');
  const [consumables, setConsumables] = React.useState<ConsumablesStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const checkConsumables = async () => {
      try {
        const data = await getConsumables();
        if (cancelled) return;

        setConsumables(data);
        const paper = Number(data.paper_remaining ?? 0);
        const toner = Number(data.toner_remaining ?? 0);
        setStatus(paper <= 0 || toner <= 0 ? 'low' : 'ready');
      } catch (err) {
        if (!cancelled) {
          console.error('Consumable check failed:', err);
          setStatus('ready');
        }
      }
    };

    void checkConsumables();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full">
        <div className="w-full max-w-2xl rounded-[3rem] bg-white/90 backdrop-blur-xl border border-white shadow-2xl p-10 sm:p-14 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#fff2e3] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#f03861]/30 border-t-[#f03861] rounded-full animate-spin" />
          </div>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-950">Checking printer supplies...</h2>
          <p className="mt-3 text-xl text-gray-600">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'low') {
    return <LowSupplyScreen initialConsumables={consumables || undefined} />;
  }

  return (
    <div className="kiosk-home flex-1 flex flex-col items-center justify-center p-6 space-y-6 sm:space-y-12 relative z-10 w-full">
      <div className="kiosk-home__hero text-center flex flex-col items-center space-y-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex items-center justify-center mb-2"
        >
          <img src={aroxLogo} alt="Arox" className="kiosk-home__logo w-[22rem] max-w-[78vw] drop-shadow-[0_20px_50px_rgba(0,0,0,0.08)]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl font-bold text-[#1a1f36] tracking-tight"
        >
          Print Anything
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-7xl font-bold tracking-tight"
        >
          <span className="text-[#f5a623]">in </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f03861] to-[#f97316]">Seconds</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed mt-2 sm:mt-6 max-w-3xl"
        >
          Scan your QR code or enter your release key to collect your documents.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="kiosk-home__actions grid w-full max-w-6xl grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-6 sm:gap-8 px-4"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Button
            size="xl"
            className="kiosk-home__action w-full h-full min-h-[340px] flex flex-col items-center justify-center gap-6 rounded-[2.75rem] border-0 bg-gradient-to-br from-[#fffaf3] via-white to-[#fff2e3] shadow-[0_18px_60px_rgba(240,56,97,0.12)] text-gray-900"
            onClick={() => navigate('/scan')}
          >
            <div className="kiosk-home__action-icon kiosk-home__action-icon--scan p-5 sm:p-6 bg-[#fff2e3] rounded-full text-[#f5a623]">
              <ScanLine className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center max-w-md">
              <div className="kiosk-home__action-title text-4xl sm:text-5xl font-bold tracking-tight">Scan QR Code</div>
              <div className="text-xl sm:text-2xl text-gray-600">Fastest release path for most guests</div>
            </div>
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <Button
            variant="outline"
            size="xl"
            className="kiosk-home__action w-full h-full min-h-[320px] flex flex-col items-center justify-center gap-6 rounded-[2.75rem] border-2 border-gray-200 bg-white shadow-[0_12px_40px_rgba(17,24,39,0.06)] text-gray-900"
            onClick={() => navigate('/code')}
          >
            <div className="kiosk-home__action-icon kiosk-home__action-icon--code p-5 sm:p-6 bg-[#fff0f4] rounded-full text-[#f03861]">
              <KeyRound className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={2.5} />
            </div>
            <div className="space-y-2 text-center max-w-md">
              <div className="kiosk-home__action-title text-3xl sm:text-4xl font-bold tracking-tight">Enter Release Key</div>
              <div className="text-xl sm:text-2xl text-gray-600">Use the 6-digit code from your receipt</div>
            </div>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

