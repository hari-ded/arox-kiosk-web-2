import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';

type KioskErrorOverlayProps = {
  title?: string;
  message: string;
  details?: string;
  onRetry: () => void;
  onHome?: () => void;
};

export const KioskErrorOverlay: React.FC<KioskErrorOverlayProps> = ({
  title = 'Kiosk Error',
  message,
  details,
  onRetry,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111a]/90 backdrop-blur-md p-6 text-white">
      <Card className="w-full max-w-2xl border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden">
        <CardHeader className="gap-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f03861]/15 text-[#ff7a95]">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl text-white">{title}</CardTitle>
              <CardDescription className="text-lg text-slate-300">The kiosk hit a problem and needs attention.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-lg leading-relaxed text-slate-100">
            {message}
          </div>

          {details && (
            <pre className="max-h-48 overflow-auto rounded-3xl border border-white/10 bg-black/40 p-5 text-sm leading-relaxed text-rose-200 whitespace-pre-wrap break-words select-text">
              {details}
            </pre>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="xl" className="flex-1 gap-3" onClick={onRetry}>
              <RotateCcw className="h-7 w-7" />
              Try Again
            </Button>

            {onHome && (
              <Button variant="outline" size="xl" className="flex-1 gap-3 bg-white text-gray-900" onClick={onHome}>
                <Home className="h-7 w-7" />
                Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
