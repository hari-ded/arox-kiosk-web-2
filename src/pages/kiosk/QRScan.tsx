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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black">
      <Button 
        variant="ghost" 
        size="lg"
        className="absolute top-24 left-6 text-white hover:text-white/80 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full px-6"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="w-8 h-8 mr-2" />
        Cancel Scan
      </Button>

      <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Scan QR Code</h2>
          <p className="text-xl text-gray-300">Hold your code up to the camera</p>
        </div>

        <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden bg-gray-900 border-4 border-gray-800 shadow-2xl">
          <div id="qr-reader" className="w-full h-full object-cover"></div>

          {loading && (
             <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col z-20">
               <QrCode className="w-16 h-16 text-[#f5a623] animate-pulse mb-4" />
               <p className="text-white text-xl font-medium">Validating...</p>
             </div>
          )}

          <div className="absolute inset-0 border-[40px] border-black/50 z-10 pointer-events-none">
            <div className="w-full h-full border-4 border-[#f5a623]/50 relative">
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#f5a623] -ml-1 -mt-1"></div>
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#f5a623] -mr-1 -mt-1"></div>
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#f5a623] -ml-1 -mb-1"></div>
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#f5a623] -mr-1 -mb-1"></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-lg py-4 px-8 rounded-2xl font-medium max-w-md w-full text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};


