import React from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Loader2, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConsumablesStatus, getConsumables, triggerKioskAlert } from '../../services/api';

type LowSupplyState = {
  source?: 'home' | 'print';
  message?: string;
  alertType?: 'paper_low' | 'toner_low';
  consumables?: ConsumablesStatus;
  requiredUnits?: number;
};

type LowSupplyScreenProps = {
  initialConsumables?: ConsumablesStatus;
};

const normalizeNumber = (value: number | null | undefined) => Number(value ?? 0);

const chooseAlertType = (paperRemaining: number, tonerRemaining: number, alertType?: 'paper_low' | 'toner_low') => {
  if (alertType) return alertType;
  if (paperRemaining <= 0) return 'paper_low';
  return 'toner_low';
};

export const LowSupplyScreen: React.FC<LowSupplyScreenProps> = ({ initialConsumables }) => {
  const location = useLocation();
  const routeState = (location.state || {}) as LowSupplyState;
  const [consumables, setConsumables] = React.useState<ConsumablesStatus | null>(initialConsumables || routeState.consumables || null);
  const [loading, setLoading] = React.useState(!consumables);
  const [alerting, setAlerting] = React.useState(false);
  const [alertSent, setAlertSent] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (consumables) {
        setLoading(false);
        return;
      }

      try {
        const data = await getConsumables();
        if (!cancelled) {
          setConsumables(data);
        }
      } catch (err) {
        console.error('Failed to load consumables:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [consumables]);

  const paperRemaining = normalizeNumber(consumables?.paper_remaining);
  const tonerRemaining = normalizeNumber(consumables?.toner_remaining);
  const paperCapacity = normalizeNumber(consumables?.paper_capacity);
  const tonerCapacity = normalizeNumber(consumables?.toner_capacity);

  const paperLow = paperRemaining <= 0;
  const tonerLow = tonerRemaining <= 0;
  const lowOnSupplies = paperLow || tonerLow;
  const lowLabel = paperLow && tonerLow
    ? 'paper and toner'
    : paperLow
      ? 'paper'
      : 'toner';

  const headline = routeState.source === 'print'
    ? 'Printing Paused'
    : lowOnSupplies
      ? 'Machine Needs Supplies'
      : 'Checking Supplies';

  const message = routeState.message
    || (routeState.source === 'print'
      ? `This print job needs more ${lowLabel} than is currently available.`
      : `The machine is low on ${lowLabel}. Service has been requested and will arrive shortly. Sorry for the inconvenience.`);

  const handleCallService = async () => {
    if (alerting) return;

    setAlerting(true);
    setError('');

    const alertType = chooseAlertType(paperRemaining, tonerRemaining, routeState.alertType);
    const remainingText = `Paper: ${paperRemaining}, Toner: ${tonerRemaining}`;

    try {
      await triggerKioskAlert(
        alertType,
        routeState.source === 'print'
          ? `Low consumables blocked a print job. ${remainingText}. Please check the kiosk.`
          : `Kiosk is low on consumables. ${remainingText}. Please service the machine.`,
        {
          source: routeState.source || 'home',
          remaining: {
            paper_remaining: paperRemaining,
            toner_remaining: tonerRemaining,
          },
          required_units: routeState.requiredUnits,
        },
      );
      setAlertSent(true);
    } catch (err: any) {
      console.error('Failed to alert service:', err);
      setError(err?.message || 'Unable to send service alert right now.');
    } finally {
      setAlerting(false);
    }
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="kiosk-screen flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="kiosk-card w-full max-w-xl p-8 sm:p-10 rounded-[2.5rem] border-0 shadow-2xl bg-white/95 backdrop-blur-xl text-center">
          <Loader2 className="w-14 h-14 animate-spin mx-auto text-[#f03861]" />
          <h2 className="kiosk-panel__title mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">Checking consumables...</h2>
          <p className="kiosk-panel__subtitle mt-3 text-lg sm:text-xl text-gray-600">Please wait while we confirm the printer is ready.</p>
=======
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-2xl p-10 sm:p-14 rounded-[3rem] border-0 shadow-2xl bg-white/95 backdrop-blur-xl text-center">
          <Loader2 className="w-14 h-14 animate-spin mx-auto text-[#f03861]" />
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-950">Checking consumables...</h2>
          <p className="mt-3 text-xl text-gray-600">Please wait while we confirm the printer is ready.</p>
>>>>>>> e0c84d9 (done)
        </Card>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="kiosk-screen flex-1 flex items-center justify-center p-6 relative z-10">
=======
    <div className="flex-1 flex items-center justify-center p-6 relative z-10">
>>>>>>> e0c84d9 (done)
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
<<<<<<< HEAD
        className="w-full max-w-[46rem]"
      >
        <Card className="kiosk-card overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <div className="kiosk-panel__header bg-gradient-to-r from-[#fff7ed] via-[#fff4f0] to-[#fff1f4] px-5 py-6 sm:px-8 sm:py-8 border-b border-gray-100">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="kiosk-hero-icon kiosk-hero-icon--danger shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 text-[#f03861] flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="kiosk-panel__title text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">{headline}</h2>
                <p className="kiosk-panel__subtitle text-lg sm:text-xl text-gray-700 leading-relaxed max-w-xl">{message}</p>
=======
        className="w-full max-w-3xl"
      >
        <Card className="overflow-hidden rounded-[3rem] border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-[#fff7ed] via-[#fff4f0] to-[#fff1f4] px-6 py-8 sm:px-10 sm:py-12 border-b border-gray-100">
            <div className="flex items-start gap-5 sm:gap-6">
              <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-50 text-[#f03861] flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-950">{headline}</h2>
                <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed max-w-2xl">{message}</p>
>>>>>>> e0c84d9 (done)
              </div>
            </div>
          </div>

<<<<<<< HEAD
          <div className="px-5 py-6 sm:px-8 sm:py-8 space-y-5">
            <div className="kiosk-status-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="kiosk-status-tile rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="kiosk-status-label text-sm font-semibold uppercase tracking-wider text-gray-500">Paper Remaining</div>
                <div className="kiosk-status-value mt-2 text-3xl sm:text-4xl font-bold text-gray-950">{paperRemaining}</div>
                <div className="mt-1 text-sm text-gray-500">of {paperCapacity || '-'}</div>
              </div>
              <div className="kiosk-status-tile rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="kiosk-status-label text-sm font-semibold uppercase tracking-wider text-gray-500">Toner Remaining</div>
                <div className="kiosk-status-value mt-2 text-3xl sm:text-4xl font-bold text-gray-950">{tonerRemaining}</div>
=======
          <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Paper Remaining</div>
                <div className="mt-2 text-4xl font-bold text-gray-950">{paperRemaining}</div>
                <div className="mt-1 text-sm text-gray-500">of {paperCapacity || '-'}</div>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">Toner Remaining</div>
                <div className="mt-2 text-4xl font-bold text-gray-950">{tonerRemaining}</div>
>>>>>>> e0c84d9 (done)
                <div className="mt-1 text-sm text-gray-500">of {tonerCapacity || '-'}</div>
              </div>
            </div>

<<<<<<< HEAD
            <div className="kiosk-status-pill rounded-3xl border border-dashed border-[#f5a623]/30 bg-[#fffaf3] px-4 py-3 text-gray-700 text-base">
=======
            <div className="rounded-3xl border border-dashed border-[#f5a623]/30 bg-[#fffaf3] px-5 py-4 text-gray-700 text-lg">
>>>>>>> e0c84d9 (done)
              Service has been alerted and will be there in a few minutes. Sorry for the inconvenience.
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 text-base">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="xl"
<<<<<<< HEAD
                className="w-full flex-1 rounded-2xl h-14 sm:h-16 text-lg font-bold"
=======
                className="flex-1 rounded-2xl h-16 text-xl font-bold"
>>>>>>> e0c84d9 (done)
                onClick={handleCallService}
                disabled={alerting}
              >
                {alerting ? <Loader2 className="w-7 h-7 animate-spin mr-2" /> : <PhoneCall className="w-7 h-7 mr-2" />}
                {alertSent ? 'Service Alert Sent' : 'Call Nearby Service Man'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
