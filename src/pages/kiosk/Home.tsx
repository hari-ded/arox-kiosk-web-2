import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import aroxLogo from '../../../assets/arox-logo.png';
import { LowSupplyScreen } from './LowSupplyScreen';
import { ConsumablesStatus, getConsumables } from '../../services/api';

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
        <div className="w-full max-w-2xl rounded-[3rem] bg-white/80 backdrop-blur-xl border border-white shadow-2xl p-10 sm:p-14 text-center">
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 sm:space-y-12 relative z-10 w-full">
      <div className="text-center flex flex-col items-center space-y-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex items-center justify-center mb-2"
        >
          <img src={aroxLogo} alt="Arox" className="w-[22rem] max-w-[78vw] drop-shadow-[0_20px_50px_rgba(0,0,0,0.08)]" />
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
          className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed mt-2 sm:mt-6"
        >
          Scan your QR code or enter your release key to collect.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-8 w-full max-w-5xl justify-center px-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 gap-4 sm:gap-6 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all"
          onClick={() => navigate('/scan')}
        >
          <div className="p-4 sm:p-6 bg-[#fff2e3] rounded-full text-[#f5a623] mb-2">
            <ScanLine className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={2.5} />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-3xl font-bold text-gray-900">Scan QR Code</h3>
            <p className="text-lg text-gray-500">Instant camera recognition</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 gap-4 sm:gap-6 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all"
          onClick={() => navigate('/code')}
        >
          <div className="p-4 sm:p-6 bg-[#fff0f4] rounded-full text-[#f03861] mb-2">
            <KeyRound className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={2.5} />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-3xl font-bold text-gray-900">Enter Code</h3>
            <p className="text-lg text-gray-500">Manual 6-digit numeric key</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};
