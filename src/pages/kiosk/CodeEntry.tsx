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
        className="absolute top-24 left-6 text-gray-700 hover:text-gray-950 bg-white/95 backdrop-blur-sm rounded-full px-6 shadow-md border border-gray-300"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="w-8 h-8 mr-2" />
        Back
      </Button>

      <div className="w-full max-w-lg space-y-4 sm:space-y-6 mt-4">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-950">Enter Code</h2>
          <p className="text-xl text-gray-700 font-medium">Your 6-digit pickup code</p>
        </div>

        <div className="kiosk-panel bg-white/96 backdrop-blur-xl rounded-[2.5rem] p-6 border border-gray-200 shadow-2xl shadow-black/10">
          <div className="kiosk-code-display h-20 mb-6 rounded-3xl bg-gray-50 border-2 border-gray-300 flex items-center justify-center shadow-inner overflow-hidden px-4">
            <div className="flex items-center justify-center font-mono text-gray-950 font-bold text-4xl sm:text-5xl tracking-[0.18em]">
              <span className="text-[#f03861] mr-1">ARX-</span>
              {code ? (
                code.split('').map((digit, index) => (
                  <span key={`${digit}-${index}`} className="inline-block w-6 text-center">{digit}</span>
                ))
              ) : (
                <span className="text-gray-400 tracking-[0.25em]">------</span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-700 text-center text-base mb-4 font-semibold bg-red-50 py-3 rounded-2xl border border-red-200 shadow-sm">
              {error}
            </div>
          )}

          <div className="kiosk-keypad-grid grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                variant="outline"
                className="h-16 sm:h-20 text-4xl font-semibold rounded-2xl border-2 border-gray-300 bg-white text-gray-950 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-16 sm:h-20 text-4xl font-semibold rounded-2xl border-2 border-gray-300 bg-white text-gray-950 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
              onClick={() => handleKeyPress('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-16 sm:h-20 text-xl col-span-2 rounded-2xl bg-gray-100 border-gray-300 text-gray-800 shadow-[0_4px_12px_rgba(17,24,39,0.08)]"
              onClick={handleDelete}
            >
              <Delete className="w-8 h-8" />
            </Button>
          </div>

          <Button
            size="xl"
            className="w-full mt-6 rounded-2xl h-20 text-2xl font-bold border border-[#b91c1c] shadow-[0_14px_28px_rgba(240,56,97,0.24)]"
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
