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
    <div className="kiosk-screen flex-1 flex flex-col items-center justify-center p-6 relative z-10">
      <Button
        variant="ghost"
        size="lg"
        className="kiosk-screen__back absolute top-24 left-6 text-gray-600 hover:text-black bg-white/70 backdrop-blur-sm rounded-full px-6 shadow-sm border border-gray-200/60"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="w-8 h-8 mr-2" />
        Back
      </Button>

      <div className="kiosk-screen__content w-full max-w-md space-y-4 sm:space-y-5 mt-2">
        <div className="text-center space-y-2">
          <h2 className="kiosk-panel__title text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">Enter Code</h2>
          <p className="kiosk-panel__subtitle text-lg sm:text-xl text-gray-600 font-medium">Your 6-digit pickup code</p>
        </div>

        <div className="kiosk-panel kiosk-card kiosk-panel--code bg-white/90 backdrop-blur-xl rounded-[2.25rem] p-5 sm:p-6 border border-white shadow-2xl shadow-black/10">
          <div className="kiosk-code-display h-16 mb-5 shadow-inner overflow-hidden px-4">
            <div className="flex items-center justify-center font-mono text-gray-900 font-bold text-3xl sm:text-4xl tracking-[0.16em]">
              <span className="kiosk-code-display__prefix text-[#f03861] mr-1">ARX-</span>
              {code ? (
                code.split('').map((digit, index) => (
                  <span key={`${digit}-${index}`} className="inline-block w-5 text-center">{digit}</span>
                ))
              ) : (
                <span className="text-gray-300 tracking-[0.25em]">------</span>
              )}
            </div>
          </div>

          {error && (
            <div className="kiosk-message text-red-600 text-center text-base mb-4 font-semibold bg-red-50 py-3 rounded-2xl border border-red-100">
              {error}
            </div>
          )}

          <div className="kiosk-keypad-grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                variant="outline"
                className="h-14 sm:h-16 text-3xl font-semibold rounded-2xl border-2 border-gray-200 bg-white hover:bg-[#fff7ed] hover:border-[#f5a623]/30 active:bg-[#fff1e1] shadow-sm"
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-14 sm:h-16 text-3xl font-semibold rounded-2xl border-2 border-gray-200 bg-white hover:bg-[#fff7ed] hover:border-[#f5a623]/30 shadow-sm"
              onClick={() => handleKeyPress('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-14 sm:h-16 text-lg col-span-2 rounded-2xl bg-gray-100 border-transparent hover:bg-gray-200 hover:border-gray-300 text-gray-700 shadow-sm"
              onClick={handleDelete}
            >
              <Delete className="w-8 h-8" />
            </Button>
          </div>

          <Button
            size="xl"
            className="w-full mt-6 rounded-2xl h-20 text-2xl font-bold shadow-xl shadow-[#f03861]/15 disabled:bg-gray-300 disabled:shadow-none transition-all duration-200"
            disabled={code.length < CODE_LENGTH || loading}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};
