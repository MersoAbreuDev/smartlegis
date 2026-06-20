import { cn } from '@/lib/utils';

export function SectionPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('rounded-smart border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</section>;
}
