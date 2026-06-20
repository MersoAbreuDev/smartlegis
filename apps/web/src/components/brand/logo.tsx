import { cn } from '@/lib/utils';

export function Logo({
  compact = false,
  className,
  imageUrl,
  alt = 'Logo institucional'
}: {
  compact?: boolean;
  className?: string;
  imageUrl?: string | null;
  alt?: string;
}) {
  if (imageUrl) {
    return (
      <div className={cn('flex items-center', className)}>
        <img
          src={imageUrl}
          alt={alt}
          className={cn('object-contain', compact ? 'h-12 max-w-[180px]' : 'h-14 max-w-[240px]')}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="logo-ribbon h-12 w-12 shrink-0 rounded-sm" />
      {!compact && (
        <div>
          <div className="text-2xl font-bold tracking-normal text-secondary">
            Smart<span className="text-[#1447E6]">Legis</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-secondary/70">Gestao Legislativa Inteligente</div>
        </div>
      )}
    </div>
  );
}
