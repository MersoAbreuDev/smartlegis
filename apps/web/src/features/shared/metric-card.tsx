import { LucideIcon } from 'lucide-react';

export function MetricCard({ title, value, footer, icon: Icon }: { title: string; value: string; footer?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-smart border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-3 text-3xl font-bold text-secondary">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-[#1447E6]" />
      </div>
      {footer && <p className="mt-4 text-xs font-medium text-text">{footer}</p>}
    </div>
  );
}
