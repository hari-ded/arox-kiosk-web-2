import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, FileText, AlertTriangle, KeyRound, Loader2, Delete } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { PrintJob } from '../../types';
import { startPrintJob, requestOtp, verifyOtp, getConsumables, triggerKioskAlert } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { playVoiceAsset } from '../../utils/audio';

const OTP_LENGTH = 6;

const getRequiredUnits = (job: PrintJob) => Math.max(1, Number(job.pages || 1)) * Math.max(1, Number(job.copies || 1));

const getShortageAlertType = (paperRemaining: number, tonerRemaining: number) => {
  if (paperRemaining <= 0) return 'paper_low' as const;
  return 'toner_low' as const;
};

export const PrintConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job as PrintJob;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [needsOtp, setNeedsOtp] = React.useState(false);
  const [otp, setOtp] = React.useState('');

  if (!job) {
    return <Navigate to="/" replace />;
  }

  const redirectToLowSupply = async (reason: string, paperRemaining: number, tonerRemaining: number) => {
    const alertType = getShortageAlertType(paperRemaining, tonerRemaining);
    const message = `${reason} Paper remaining: ${paperRemaining}. Toner remaining: ${tonerRemaining}.`;

    try {
      await triggerKioskAlert(
        alertType,
        message,
        {
          source: 'print',
          job_id: job.id,
          required_units: getRequiredUnits(job),
          paper_remaining: paperRemaining,
          toner_remaining: tonerRemaining,
        },
      );
    } catch (err) {
      console.warn('Failed to send low consumables alert:', err);
    }

    navigate('/low-supply', {
      state: {
        source: 'print',
        message: 'This print job needs more paper or toner than is currently available. Service has been alerted and will be there in a few minutes. Sorry for the inconvenience.',
        alertType,
        consumables: {
          paper_remaining: paperRemaining,
          toner_remaining: tonerRemaining,
        },
        requiredUnits: getRequiredUnits(job),
      },
    });
  };

  const ensureConsumablesAreEnough = async () => {
    try {
      const data = await getConsumables();
      const paperRemaining = Number(data.paper_remaining ?? 0);
      const tonerRemaining = Number(data.toner_remaining ?? 0);
      const requiredUnits = getRequiredUnits(job);

      if (paperRemaining < requiredUnits || tonerRemaining < requiredUnits) {
        await redirectToLowSupply(
          'This print job exceeds the available consumables.',
          paperRemaining,
          tonerRemaining,
        );
        return false;
      }
    } catch (err) {
      console.warn('Consumables check failed, continuing print flow:', err);
    }

    return true;
  };

  const handlePrint = async () => {
    setLoading(true);
    setError('');

    const okToPrint = await ensureConsumablesAreEnough();
    if (!okToPrint) {
      setLoading(false);
      return;
    }

    if (job.email && !needsOtp) {
      try {
        const sent = await requestOtp(job.pickup_code || job.id);
        if (sent) {
          setNeedsOtp(true);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn('Backend OTP request failed, attempting direct print release...', err);
      }
    }

    try {
      const result = await startPrintJob(job.pickup_code || job.id);
      if (result.success) {
        navigate(`/status/${job.id}`, { state: { job } });
      } else {
        setError('Failed to start printing. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < OTP_LENGTH) return;

    setLoading(true);
    setError('');

    const okToPrint = await ensureConsumablesAreEnough();
    if (!okToPrint) {
      setLoading(false);
      return;
    }

    try {
      const verified = await verifyOtp(job.pickup_code || job.id, otp);
      if (verified) {
         const result = await startPrintJob(job.pickup_code || job.id);
         if (result.success) {
           navigate(`/status/${job.id}`, { state: { job } });
         } else {
           setError('OTP verified, but failed to start printing.');
         }
      } else {
         setError('Invalid OTP. Please try again.');
         playVoiceAsset('otpFailed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error verifying OTP.');
      playVoiceAsset('otpFailed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigit = (digit: string) => {
    if (loading || otp.length >= OTP_LENGTH) return;
    setOtp((current) => current + digit);
  };

  const handleOtpDelete = () => {
    if (loading) return;
    setOtp((current) => current.slice(0, -1));
  };

  const handleOtpClear = () => {
    if (loading) return;
    setOtp('');
  };

  return (
    <div className="kiosk-screen flex-1 flex flex-col items-center justify-center p-6 relative z-10">
      <Button
        variant="ghost"
        size="lg"
        className="kiosk-screen__back absolute top-24 left-6 text-gray-700 hover:text-gray-950 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-full px-6 shadow-sm border border-gray-200/60"
        onClick={() => navigate('/')}
        disabled={loading}
      >
        <ChevronLeft className="w-8 h-8 mr-2" />
        Cancel
      </Button>

      <div className="w-full max-w-[46rem] space-y-4 sm:space-y-5 mt-2">
        <div className="text-center space-y-1 text-gray-900">
          <h2 className="kiosk-panel__title text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-sm">Confirm Print Job</h2>
          <p className="kiosk-panel__subtitle text-lg sm:text-xl text-gray-600">Review your document details before printing</p>
        </div>

        {!needsOtp ? (
          <Card className="kiosk-card overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl">
            <div className="kiosk-panel__header bg-gradient-to-r from-[#fff7ed] to-[#fff1f4] p-5 sm:p-6 border-b border-gray-100 flex items-start space-x-4 sm:space-x-5">
              <div className="p-2.5 sm:p-3 bg-white rounded-2xl text-[#f03861] shadow-sm border border-[#f5a623]/15">
                <FileText className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate" title={job.filename}>
                  {job.filename}
                </h3>
                <div className="mt-1 text-sm sm:text-base text-gray-500 font-mono">
                  Code: {job.pickup_code || String(job.id).toUpperCase()}
                </div>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="kiosk-status-tile bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="kiosk-status-label text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Pages</div>
                  <div className="kiosk-status-value text-2xl sm:text-3xl font-semibold text-gray-900">{job.pages || '-'}</div>
                </div>
                <div className="kiosk-status-tile bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="kiosk-status-label text-gray-500 text-xs sm:text-sm font-medium mb-1">Copies</div>
                  <div className="kiosk-status-value text-2xl sm:text-3xl font-semibold text-gray-900">{job.copies || '-'}</div>
                </div>
                <div className="kiosk-status-tile bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="kiosk-status-label text-gray-500 text-xs sm:text-sm font-medium mb-1">Color Mode</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                    {job.color ? 'Full Color' : 'Black & White'}
                  </div>
                </div>
                <div className="kiosk-status-tile bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="kiosk-status-label text-gray-500 text-xs sm:text-sm font-medium mb-1">Estimated Time</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                    {job.estimated_time_seconds ? `${Math.ceil(job.estimated_time_seconds / 60)} min` : '-'}
                  </div>
                </div>
              </div>

              {error && (
                <div className="kiosk-message flex items-center space-x-3 bg-red-50 text-red-700 p-3 rounded-xl mb-4 border border-red-100">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-base">{error}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div key="print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button
                    size="xl"
                    className="w-full text-2xl h-16 rounded-2xl shadow-xl shadow-[#f03861]/15"
                    onClick={handlePrint}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-8 h-8 animate-spin mr-2" /> : null}
                    {loading ? 'Processing...' : (job.email ? 'Send OTP to Release' : 'Print Document')}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        ) : (
          <Card className="kiosk-card overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl">
            <div className="kiosk-panel__header p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-[#fff7ed] to-[#fff1f4]">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-white rounded-2xl text-[#f03861] shadow-sm border border-[#f5a623]/15">
                  <KeyRound className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <div>
                  <h3 className="kiosk-panel__title text-xl sm:text-2xl font-bold text-gray-900">Enter OTP</h3>
                  <p className="kiosk-panel__subtitle text-gray-600">Use the keypad below to enter the 6-digit code sent to {job.email}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6">
              <div className="space-y-6">
                <div className="kiosk-code-display rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-3 py-5 sm:px-4 sm:py-5 text-center select-none">
                  <div className="font-mono text-3xl sm:text-4xl font-semibold text-gray-900 min-h-12 flex items-center justify-center gap-2 sm:gap-3">
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                      const digit = otp[index];
                      return (
                        <span
                          key={`slot-${index}`}
                          className="inline-flex w-9 h-11 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-900"
                        >
                          {digit || ''}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="kiosk-message flex items-center space-x-3 bg-red-50 text-red-700 p-3 rounded-xl border border-red-100">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="font-medium text-base">{error}</span>
                  </div>
                )}

                <div className="kiosk-otp-grid grid-cols-3 gap-3 sm:gap-4 select-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      className="h-14 sm:h-16 text-3xl font-semibold rounded-2xl border-2 border-gray-200 bg-white hover:bg-[#fff7ed] hover:border-[#f5a623]/30 shadow-sm"
                      onClick={() => handleOtpDigit(String(digit))}
                      disabled={loading || otp.length >= OTP_LENGTH}
                    >
                      {digit}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="h-14 sm:h-16 text-3xl font-semibold rounded-2xl border-2 border-gray-200 bg-white hover:bg-[#fff7ed] hover:border-[#f5a623]/30 shadow-sm"
                    onClick={() => handleOtpDigit('0')}
                    disabled={loading || otp.length >= OTP_LENGTH}
                  >
                    0
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 sm:h-16 text-lg rounded-2xl bg-gray-100 border-transparent hover:bg-gray-200 hover:border-gray-300 text-gray-700 shadow-sm"
                    onClick={handleOtpDelete}
                    disabled={loading || otp.length === 0}
                  >
                    <Delete className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 sm:h-16 text-lg rounded-2xl bg-gray-100 border-transparent hover:bg-gray-200 hover:border-gray-300 text-gray-700 shadow-sm"
                    onClick={handleOtpClear}
                    disabled={loading || otp.length === 0}
                  >
                    Clear
                  </Button>
                </div>

                <Button
                  size="xl"
                  className="w-full mt-2 h-14 sm:h-16 rounded-2xl text-xl font-bold"
                  onClick={handleVerifyOtp}
                  disabled={otp.length < OTP_LENGTH || loading}
                >
                  {loading ? <Loader2 className="w-8 h-8 animate-spin mr-2" /> : null}
                  Verify & Print
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
