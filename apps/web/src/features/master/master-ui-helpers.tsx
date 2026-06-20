'use client';

import { Search } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionPanel } from '@/features/shared/section-panel';

export function filterBySearch(value: string, search: string) {
  if (!search.trim()) return true;
  return value.toLowerCase().includes(search.trim().toLowerCase());
}

export function ListSearch({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function DetailPanel({
  title,
  description,
  visible,
  children,
  actions
}: {
  title: string;
  description?: string;
  visible: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  if (!visible) {
    return (
      <SectionPanel className="flex min-h-[280px] items-center justify-center border-dashed">
        <p className="text-sm text-text">Selecione um item na lista ou clique em criar para comecar.</p>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-secondary">{title}</h3>
          {description && <p className="mt-1 text-sm text-text">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </SectionPanel>
  );
}

export function SaveActionButton({
  hasRecord,
  isDirty,
  disabled,
  onClick
}: {
  hasRecord: boolean;
  isDirty: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const label = !hasRecord ? 'Salvar' : isDirty ? 'Salvar alteracoes' : 'Sem alteracoes';

  return (
    <Button disabled={disabled || (hasRecord && !isDirty)} onClick={onClick}>
      {label}
    </Button>
  );
}

export function RowEditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="h-9 px-3 text-xs" onClick={onClick}>
      Editar
    </Button>
  );
}

export function ColorSwatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
      <span className="text-xs font-semibold text-secondary">{color}</span>
    </span>
  );
}
