import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '../../components/Button';
import { validateCode } from '../../services/api';
import { playVoiceAsset } from '../../utils/audio';

export const QRScan = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    playVoiceAsset('pickup');
    scannerRef.current = new Html5Qrcode('qr-reader', { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: { width: 350, height: 350 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          async (decodedText) => {
            try {
              if (scannerRef.current?.getState() === 2) {
                scannerRef.current.pause();
              }
            } catch (e) {
              console.warn('Could not pause scanner', e);
            }

            setLoading(true);
            try {
              const code = decodedText.includes('{') ? JSON.parse(decodedText).code : decodedText;
              const job = await validateCode(code);

              if (job) {
                navigate(`/confirm/${job.id}`, { state: { job } });
              } else {
                setError('Invalid QR Code. Job not found.');
                setTimeout(() => {
                  try {
                    if (scannerRef.current?.getState() === 3) {
                      scannerRef.current.resume();
                    }
                  } catch (e) {}
                }, 3000);
              }
            } catch (err) {
              setError('Failed to validate code.');
              setTimeout(() => {
                try {
                  if (scannerRef.current?.getState() === 3) {
                    scannerRef.current.resume();
                  }
                } catch (e) {}
              }, 3000);
            } finally {
              setLoading(false);
            }
          },
          () => {
            // Ignore read errors while the scanner is searching
          }
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setError('Camera not found or permission denied.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [navigate]);

  return (
    <div className="kiosk-screen relative z-10 flex h-full w-full flex-1 flex-col items-center justify-center bg-black p-6">
      <Button
        variant="ghost"
        size="lg"
        className="absolute left-[24px] top-[92px] rounded-full border border-white/20 bg-black/25 px-6 text-white backdrop-blur-md hover:bg-black/45 hover:text-white/90"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="mr-2 h-8 w-8" />
        Cancel Scan
      </Button>

      <div className="flex w-full max-w-[760px] flex-col items-center space-y-6">
        <div className="space-y-3 text-center">
          <h2 className="text-[44px] font-bold tracking-tight text-white">Scan QR Code</h2>
          <p className="text-[22px] text-gray-300">Hold your code up to the camera</p>
        </div>

        <div className="kiosk-scan-frame relative aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl border-4 border-gray-800 bg-gray-900 shadow-2xl">
          <div id="qr-reader" className="kiosk-scan-frame__reader h-full w-full object-cover"></div>

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
              <QrCode className="mb-4 h-16 w-16 animate-pulse text-[#f5a623]" />
              <p className="text-xl font-medium text-white">Validating...</p>
            </div>
          )}

          <div className="kiosk-scan-frame__overlay absolute inset-0 z-10 pointer-events-none border-[36px] border-black/50">
            <div className="relative h-full w-full border-4 border-[#f5a623]/50">
              <div className="absolute left-0 top-0 -ml-1 -mt-1 h-8 w-8 border-l-4 border-t-4 border-[#f5a623]"></div>
              <div className="absolute right-0 top-0 -mr-1 -mt-1 h-8 w-8 border-r-4 border-t-4 border-[#f5a623]"></div>
              <div className="absolute bottom-0 left-0 -mb-1 -ml-1 h-8 w-8 border-b-4 border-l-4 border-[#f5a623]"></div>
              <div className="absolute bottom-0 right-0 -mb-1 -mr-1 h-8 w-8 border-b-4 border-r-4 border-[#f5a623]"></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="w-full max-w-[420px] rounded-2xl border border-red-500/50 bg-red-500/10 px-8 py-4 text-center text-[18px] font-medium text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
