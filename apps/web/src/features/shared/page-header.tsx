export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-secondary">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-text">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
