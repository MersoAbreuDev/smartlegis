import { cn } from '@/lib/utils';

const toneMap = {
  blue: 'bg-blue-50 text-primary ring-blue-100',
  green: 'bg-emerald-50 text-approved ring-emerald-100',
  red: 'bg-red-50 text-rejected ring-red-100',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200'
};

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: keyof typeof toneMap }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', toneMap[tone])}>{children}</span>;
}
