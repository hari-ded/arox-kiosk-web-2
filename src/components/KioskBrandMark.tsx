import aroxLogo from '../../assets/arox-logo.png';

type KioskBrandMarkProps = {
  className?: string;
};

export const KioskBrandMark = ({ className = '' }: KioskBrandMarkProps) => {
  return (
    <div className={`kiosk-brand-mark inline-flex items-center gap-3 ${className}`.trim()}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff2e3] via-white to-[#fff0f4] shadow-[0_10px_24px_rgba(240,56,97,0.14)] ring-1 ring-white/80">
        <img
          src={aroxLogo}
          alt="Arox logo"
          className="h-8 w-8 object-contain"
          draggable={false}
        />
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f5a623]">
          PrintEZ
        </div>
        <div className="text-sm font-semibold text-gray-900">
          Kiosk
        </div>
      </div>
    </div>
  );
};
