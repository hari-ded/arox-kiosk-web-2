import * as React from "react"
import { cn } from "../lib/utils"
import { playClickSound } from "../utils/audio"

<<<<<<< HEAD
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger'
  size?: 'default' | 'sm' | 'lg' | 'xl'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
=======
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'danger', size?: 'default' | 'sm' | 'lg' | 'xl' }>(
>>>>>>> e0c84d9 (done)
  ({ className, variant = 'default', size = 'default', onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      playClickSound();
      if (onClick) {
        onClick(e);
      }
    };

<<<<<<< HEAD
    const isBlock = typeof className === 'string' && className.includes('w-full');

    return (
      <button
        ref={ref}
        data-kiosk-button="true"
        data-variant={variant}
        data-size={size}
        data-block={isBlock ? 'true' : 'false'}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f03861]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation kiosk-button",
=======
    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f03861]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation",
>>>>>>> e0c84d9 (done)
          {
            'bg-gradient-to-r from-[#f5a623] to-[#f03861] text-white shadow-lg shadow-[#f03861]/15 hover:brightness-105': variant === 'default',
            'border-2 border-[#f5a623]/20 bg-white text-gray-900 hover:bg-[#fff7ed] hover:border-[#f5a623]/30': variant === 'outline',
            'text-gray-700 hover:bg-[#fff7ed] hover:text-gray-900': variant === 'ghost',
            'bg-[#f03861] text-white hover:bg-[#d92d56]': variant === 'danger',
            'h-12 px-6 py-2 text-lg': size === 'default',
            'h-10 px-4 text-base': size === 'sm',
            'h-16 px-8 text-xl': size === 'lg',
            'h-24 px-12 text-2xl': size === 'xl',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
