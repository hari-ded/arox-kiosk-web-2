import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Delete, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { validateCode } from '../../services/api';
import { playErrorTone, playVoiceAsset } from '../../utils/audio';

const CODE_LENGTH = 6;

export const CodeEntry = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    playVoiceAsset('enterCode');
  }, []);

  const handleKeyPress = (key: string) => {
    if (/^\d$/.test(key) && code.length < CODE_LENGTH) {
      setCode((prev) => prev + key);
      setError('');
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (code.length < CODE_LENGTH) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const job = await validateCode(code);
      if (job) {
        navigate(`/confirm/${job.id}`, { state: { job } });
        return;
      }

      setError('Invalid pickup code. Please try again.');
      playErrorTone();
    } catch (err: any) {
      const message = err?.message || '';
      if (/Invalid pickup code/i.test(message)) {
        setError('Invalid pickup code. Please try again.');
        playErrorTone();
      } else {
        setError(message || 'Job not found or connection error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kiosk-screen relative z-10 flex h-full w-full flex-1 flex-col items-center justify-center p-6">
      <Button
        variant="ghost"
        size="lg"
        className="absolute left-[24px] top-[92px] rounded-full border border-gray-300 bg-white/95 px-6 text-gray-700 shadow-md backdrop-blur-sm hover:bg-white hover:text-gray-950"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="mr-2 h-8 w-8" />
        Back
      </Button>

      <div className="mt-4 w-full max-w-[640px] space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-[44px] font-extrabold tracking-tight text-gray-950">Enter Code</h2>
          <p className="text-[22px] font-medium text-gray-700">Your 6-digit pickup code</p>
        </div>

        <div className="kiosk-panel rounded-[2.5rem] border border-gray-200 bg-white/96 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="kiosk-code-display mb-5 flex h-[88px] items-center justify-center overflow-hidden rounded-3xl border-2 border-gray-300 bg-gray-50 px-4 shadow-inner">
            <div className="flex items-center justify-center font-mono text-[44px] font-bold tracking-[0.18em] text-gray-950">
              <span className="mr-1 text-[#f03861]">ARX-</span>
              {code ? (
                code.split('').map((digit, index) => (
                  <span key={`${digit}-${index}`} className="inline-block w-6 text-center">
                    {digit}
                  </span>
                ))
              ) : (
                <span className="tracking-[0.25em] text-gray-400">------</span>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 py-3 text-center text-base font-semibold text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="kiosk-keypad-grid grid grid-cols-3 gap-3 select-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-[72px] rounded-2xl border-2 border-gray-300 bg-white text-[34px] font-semibold text-gray-950 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-[72px] rounded-2xl border-2 border-gray-300 bg-white text-[34px] font-semibold text-gray-950 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
              onClick={() => handleKeyPress('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-[72px] col-span-2 rounded-2xl border-2 border-gray-300 bg-gray-100 text-[18px] text-gray-800 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
              onClick={handleDelete}
            >
              <Delete className="h-8 w-8" />
            </Button>
          </div>

          <Button
            size="xl"
            className="mt-6 h-[76px] w-full rounded-2xl border border-[#b91c1c] text-[24px] font-bold shadow-[0_14px_28px_rgba(240,56,97,0.24)]"
            disabled={code.length < CODE_LENGTH || loading}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};
