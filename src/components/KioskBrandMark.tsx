import aroxLogo from '../../assets/arox-logo.png';

type KioskBrandMarkProps = {
  className?: string;
};

export const KioskBrandMark = ({ className = '' }: KioskBrandMarkProps) => {
  return (
    <div
      className={`kiosk-brand-mark flex h-[42px] w-[132px] items-center justify-center overflow-hidden rounded-2xl bg-white/85 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm sm:h-[46px] sm:w-[148px] ${className}`.trim()}
      aria-label="Arox"
    >
      <img
        src={aroxLogo}
        alt="Arox"
        className="block h-full w-full max-h-full max-w-full object-contain"
      />
    </div>
  );
};
