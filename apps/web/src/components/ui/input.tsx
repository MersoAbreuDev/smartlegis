import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-smart border border-slate-200 bg-white px-3 text-sm text-secondary outline-none ring-primary/20 transition placeholder:text-slate-400 focus:ring-4',
        className
      )}
      {...props}
    />
  );
}
