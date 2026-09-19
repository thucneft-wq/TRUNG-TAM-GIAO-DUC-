import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'teal' | 'blue';
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  footer?: React.ReactNode;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  footer,
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: 'text-pine-700',
          value: 'text-pine-700',
        };
      case 'danger':
        return {
          icon: 'text-brick-700',
          value: 'text-brick-700',
        };
      case 'teal':
        return { icon: 'text-pine-700', value: 'text-ink-950' };
      case 'blue':
        return { icon: 'text-academic-700', value: 'text-ink-950' };
      default:
        return { icon: 'text-slate-500', value: 'text-ink-950' };
    }
  };

  const styles = getVariantStyles();
  const className = `flex h-full min-h-40 flex-col border-b border-r border-rule bg-white p-4 text-left ${
    onClick ? 'cursor-pointer transition-colors hover:bg-teal-50/60' : ''
  }`;
  const content = (
    <>
      <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="line-clamp-2 text-pretty text-sm font-medium leading-5 text-slate-600">{title}</p>
        <Icon className={`mt-0.5 size-5 shrink-0 ${styles.icon}`} aria-hidden="true" />
      </div>

      <div className="mt-2 min-h-9">
        <p className={`font-display text-3xl font-bold leading-9 tabular-nums ${styles.value}`}>{value}</p>
      </div>

      <div className="mt-4 border-t border-rule" aria-hidden="true" />

      <div className="flex flex-1 flex-col pt-3 text-xs leading-5 tabular-nums">
        {subtitle && <p className="min-h-10 text-pretty text-slate-500">{subtitle}</p>}
        {(trend || footer) && (
          <div className="mt-auto pt-2">
            {trend && (
              <p className={trend.isPositive ? 'font-medium text-pine-700' : 'font-medium text-brick-700'}>
                {trend.isPositive ? 'Tăng' : 'Giảm'} {trend.value} {trend.label}
              </p>
            )}
            {footer}
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return <button id={id} type="button" onClick={onClick} className={className}>{content}</button>;
  }

  return <div id={id} className={className}>{content}</div>;
};
