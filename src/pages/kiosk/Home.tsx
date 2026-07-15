import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
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
      <div className="kiosk-home flex h-full w-full flex-1 items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[720px] rounded-[3rem] border border-gray-200 bg-white/96 p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff2e3]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f03861]/30 border-t-[#f03861]" />
          </div>
          <h2 className="mt-6 text-[44px] font-bold tracking-tight text-gray-950">Checking printer supplies...</h2>
          <p className="mt-3 text-[22px] text-gray-700">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'low') {
    return <LowSupplyScreen initialConsumables={consumables || undefined} />;
  }

  return (
    <div className="kiosk-home flex h-full w-full flex-1 flex-col items-center justify-center space-y-8 p-6 relative z-10">
      <div className="kiosk-home__hero flex max-w-[720px] flex-col items-center space-y-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[54px] font-extrabold tracking-tight text-[#1a1f36]"
        >
          Print Anything
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-[54px] font-extrabold tracking-tight"
        >
          <span className="text-[#f5a623]">in </span>
          <span className="bg-gradient-to-r from-[#f03861] to-[#f97316] bg-clip-text text-transparent">Seconds</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="max-w-[640px] text-[22px] font-medium leading-relaxed text-gray-700"
        >
          Scan your QR code or enter your release key to collect your documents.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="kiosk-home__actions grid w-full max-w-[1024px] grid-cols-2 gap-6 px-4"
      >
        <Button
          size="xl"
          className="kiosk-home__action flex min-h-[264px] flex-col items-center justify-center gap-5 rounded-[2.75rem] border border-[#f5a623]/20 bg-gradient-to-br from-[#fffaf3] via-white to-[#fff2e3] text-gray-950 shadow-[0_18px_60px_rgba(240,56,97,0.12)]"
          onClick={() => navigate('/scan')}
        >
          <div className="kiosk-home__action-icon kiosk-home__action-icon--scan rounded-full bg-[#fff2e3] p-5 text-[#f5a623] shadow-inner">
            <ScanLine className="h-12 w-12" strokeWidth={2.5} />
          </div>
          <div className="max-w-[360px] space-y-2 text-center">
            <div className="kiosk-home__action-title text-[34px] font-bold tracking-tight">Scan QR Code</div>
            <div className="text-[20px] text-gray-700">Fastest release path for most guests</div>
          </div>
        </Button>

        <Button
          variant="outline"
          size="xl"
          className="kiosk-home__action flex min-h-[264px] flex-col items-center justify-center gap-5 rounded-[2.75rem] border-2 border-gray-300 bg-white text-gray-950 shadow-[0_12px_40px_rgba(17,24,39,0.06)]"
          onClick={() => navigate('/code')}
        >
          <div className="kiosk-home__action-icon kiosk-home__action-icon--code rounded-full bg-[#fff0f4] p-5 text-[#f03861] shadow-inner">
            <KeyRound className="h-12 w-12" strokeWidth={2.5} />
          </div>
          <div className="max-w-[360px] space-y-2 text-center">
            <div className="kiosk-home__action-title text-[34px] font-bold tracking-tight">Enter Release Key</div>
            <div className="text-[20px] text-gray-700">Use the 6-digit code from your receipt</div>
          </div>
        </Button>
      </motion.div>
    </div>
  );
};
