import aroxLogo from '../../assets/arox-logo.png';

type KioskBrandMarkProps = {
  className?: string;
};

export const KioskBrandMark = ({ className = '' }: KioskBrandMarkProps) => {
  return (
    <div
      className={`kiosk-brand-mark flex-none flex h-[36px] w-[124px] items-center justify-center overflow-hidden rounded-2xl bg-white/90 px-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm ${className}`.trim()}
      aria-label="Arox"
    >
      <img
        src={aroxLogo}
        alt="Arox"
        className="block h-[24px] w-[104px] max-h-[24px] max-w-[104px] object-contain"
      />
    </div>
  );
};
