import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-[#082f57]',
  secondary: 'bg-secondary text-white hover:bg-[#0b1d2f]',
  outline: 'border border-slate-200 bg-white text-secondary hover:bg-slate-50',
  ghost: 'text-secondary hover:bg-slate-100',
  success: 'bg-approved text-white hover:bg-[#0f9f70]',
  danger: 'bg-rejected text-white hover:bg-[#dc2626]',
  warning: 'bg-pending text-white hover:bg-[#d99a00]'
};

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-smart px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
