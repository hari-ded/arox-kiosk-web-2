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
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
      <Card className="w-full max-w-2xl p-16 text-center shadow-2xl border-0 overflow-hidden relative bg-white/95 backdrop-blur-xl rounded-[3rem]">
        {status === 'printing' && (
          <div className="space-y-10 flex flex-col items-center">
            <div className="w-40 h-40 bg-[#fff7ed] rounded-full flex items-center justify-center relative">
              <Printer className="w-20 h-20 text-[#f5a623] animate-pulse relative z-10" />
              <svg className="absolute inset-0 w-full h-full animate-spin text-[#f03861]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="150" strokeLinecap="round" />
              </svg>
            </div>

            <div className="space-y-4 w-full">
              <h2 className="text-5xl font-extrabold tracking-tight text-gray-950">Printing...</h2>
              <p className="text-2xl text-gray-600 font-medium">Please wait while your document prints.</p>

              <div className="w-full bg-gray-100 h-6 rounded-full mt-10 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-[#f5a623] to-[#f03861] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-40 h-40 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-24 h-24" />
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-extrabold tracking-tight text-gray-950">Success!</h2>
              <p className="text-2xl text-gray-600 font-medium">Your document has been printed.<br />Please collect your pages.</p>
            </div>

            <Button size="xl" className="mt-10 rounded-full px-16 h-20 text-2xl font-bold" onClick={() => navigate('/')}>
              Finish
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-40 h-40 bg-red-50 text-[#f03861] rounded-full flex items-center justify-center shadow-inner">
              <AlertCircle className="w-24 h-24" />
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-extrabold tracking-tight text-gray-950">Print Failed</h2>
              <p className="text-2xl text-gray-600 font-medium">There was an issue printing your document.<br />Please contact support.</p>
            </div>

            <Button size="xl" variant="outline" className="mt-10 rounded-full px-16 h-20 text-2xl font-bold" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

