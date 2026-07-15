import * as React from 'react';
import { cn } from '../lib/utils';
import { playClickSound } from '../utils/audio';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'default' | 'sm' | 'lg' | 'xl';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      block = false,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [tapLocked, setTapLocked] = React.useState(false);

    React.useEffect(() => {
      if (!tapLocked) return undefined;

      const timer = window.setTimeout(() => setTapLocked(false), 400);
      return () => window.clearTimeout(timer);
    }, [tapLocked]);

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled) {
        setIsPressed(true);
      }

      onPointerDown?.(event);
    };

    const clearPressed = () => {
      setIsPressed(false);
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
      clearPressed();
      onPointerUp?.(event);
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
      clearPressed();
      onPointerLeave?.(event);
    };

    const handlePointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
      clearPressed();
      onPointerCancel?.(event);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (disabled || tapLocked) {
        event.preventDefault();
        return;
      }

      setTapLocked(true);
      playClickSound();
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        disabled={disabled || tapLocked}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        data-pressed={isPressed ? 'true' : undefined}
        data-variant={variant}
        data-size={size}
        data-block={block ? 'true' : undefined}
        className={cn(
          'kiosk-button inline-flex min-h-[60px] min-w-[60px] items-center justify-center whitespace-nowrap rounded-2xl font-medium ring-offset-background transition-[transform,background-color,border-color,box-shadow,opacity,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f03861]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] data-[pressed=true]:scale-[0.97] touch-manipulation select-none [-webkit-user-select:none] [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]',
          {
            'bg-gradient-to-r from-[#f5a623] to-[#f03861] text-white shadow-lg shadow-[#f03861]/15': variant === 'default',
            'border-2 border-[#f5a623]/20 bg-white text-gray-900': variant === 'outline',
            'text-gray-700': variant === 'ghost',
            'bg-[#f03861] text-white': variant === 'danger',
            'h-[68px] px-6 text-xl': size === 'default',
            'h-[60px] px-4 text-lg': size === 'sm',
            'h-[76px] px-8 text-2xl': size === 'lg',
            'h-[88px] px-10 text-3xl': size === 'xl',
            'w-full': block,
          },
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };
