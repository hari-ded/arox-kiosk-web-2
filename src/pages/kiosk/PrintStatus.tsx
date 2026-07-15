import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PrintJob } from '../../types';
import { checkJobStatus } from '../../services/api';
import { playSuccessChime, playVoiceAsset } from '../../utils/audio';

export const PrintStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job as PrintJob;

  const [status, setStatus] = useState<'printing' | 'completed' | 'failed'>('printing');
  const [progress, setProgress] = useState(10);
  const pollTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const backoffRef = useRef(0);

  useEffect(() => {
    if (job) {
      playVoiceAsset('printingWait');
    }
  }, [job]);

  useEffect(() => {
    if (!job) return;

    let cancelled = false;

    const clearTimers = () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    const scheduleNextPoll = (delay: number) => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
      pollTimerRef.current = window.setTimeout(() => {
        void pollStatus();
      }, delay);
    };

    const startProgress = () => {
      if (progressTimerRef.current) return;
      progressTimerRef.current = window.setInterval(() => {
        setProgress((current) => (current < 90 ? current + (90 - current) * 0.1 : 90));
      }, 1000);
    };

    const stopProgress = () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    const pollStatus = async () => {
      if (cancelled) return;

      try {
        const currentStatus = await checkJobStatus(job.id);
        if (cancelled) return;

        const normalized = currentStatus.trim().toLowerCase();
        const isSuccess = ['printed', 'completed', 'complete', 'success', 'done', 'finished'].includes(normalized);
        const isFailure = ['failed', 'failure', 'error', 'errored', 'aborted', 'cancelled', 'canceled'].includes(normalized);

        backoffRef.current = 0;

        if (isSuccess) {
          clearTimers();
          setProgress(100);
          setStatus('completed');
          playVoiceAsset('printComplete');
          playSuccessChime();
          window.setTimeout(() => playVoiceAsset('thankYou'), 12000);
          window.setTimeout(() => navigate('/'), 8000);
          return;
        }

        if (isFailure) {
          clearTimers();
          setStatus('failed');
          playVoiceAsset('printFailed');
          return;
        }

        startProgress();
        const nextDelay = document.visibilityState === 'hidden' ? 15000 : 3000;
        scheduleNextPoll(nextDelay);
      } catch (error) {
        if (cancelled) return;
        backoffRef.current = Math.min(backoffRef.current + 1, 4);
        const retryDelay = Math.min(30000, 3000 * (backoffRef.current + 1));
        scheduleNextPoll(retryDelay);
      }
    };

    startProgress();
    void pollStatus();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'printing') {
        void pollStatus();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimers();
      stopProgress();
    };
  }, [job, navigate]);

  if (!job) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="kiosk-screen relative z-10 flex h-full w-full flex-1 items-center justify-center p-6">
      <Card className="kiosk-panel relative w-full max-w-[760px] overflow-hidden rounded-[3rem] border-0 bg-white/95 p-14 text-center shadow-2xl backdrop-blur-xl">
        {status === 'printing' && (
          <div className="flex flex-col items-center space-y-10">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[#fff7ed]">
              <Printer className="relative z-10 h-20 w-20 animate-pulse text-[#f5a623]" />
              <svg className="absolute inset-0 h-full w-full animate-spin text-[#f03861]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="150" strokeLinecap="round" />
              </svg>
            </div>

            <div className="w-full space-y-4">
              <h2 className="text-[44px] font-extrabold tracking-tight text-gray-950">Printing...</h2>
              <p className="text-[22px] font-medium text-gray-600">Please wait while your document prints.</p>

              <div className="mt-8 h-6 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#f03861] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="flex flex-col items-center space-y-10 animate-in fade-in zoom-in duration-200">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-inner">
              <CheckCircle2 className="h-24 w-24" />
            </div>

            <div className="space-y-4">
              <h2 className="text-[44px] font-extrabold tracking-tight text-gray-950">Success!</h2>
              <p className="text-[22px] font-medium text-gray-600">Your document has been printed.<br />Please collect your pages.</p>
            </div>

            <Button size="xl" className="mt-8 h-[76px] rounded-full px-16 text-[24px] font-bold" onClick={() => navigate('/')}>
              Finish
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center space-y-10 animate-in fade-in zoom-in duration-200">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-red-50 text-[#f03861] shadow-inner">
              <AlertCircle className="h-24 w-24" />
            </div>

            <div className="space-y-4">
              <h2 className="text-[44px] font-extrabold tracking-tight text-gray-950">Print Failed</h2>
              <p className="text-[22px] font-medium text-gray-600">There was an issue printing your document.<br />Please contact support.</p>
            </div>

            <Button size="xl" variant="outline" className="mt-8 h-[76px] rounded-full px-16 text-[24px] font-bold" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
