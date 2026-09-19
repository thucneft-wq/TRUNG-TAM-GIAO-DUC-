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
  const className = `min-h-40 border-b border-r border-rule bg-white p-4 text-left ${
    onClick ? 'cursor-pointer transition-colors hover:bg-teal-50/60' : ''
  }`;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-slate-600">{title}</p>
          <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
        </div>
        <Icon className={`mt-0.5 size-5 shrink-0 ${styles.icon}`} aria-hidden="true" />
      </div>

      <div className="mt-5 border-t border-rule pt-3 text-xs leading-5">
        {subtitle && <p className="text-slate-500">{subtitle}</p>}
        {trend && (
          <p className={trend.isPositive ? 'mt-1 font-medium text-pine-700' : 'mt-1 font-medium text-brick-700'}>
            {trend.isPositive ? 'Tăng' : 'Giảm'} {trend.value} {trend.label}
          </p>
        )}
      </div>
    </>
  );

  if (onClick) {
    return <button id={id} type="button" onClick={onClick} className={className}>{content}</button>;
  }

  return <div id={id} className={className}>{content}</div>;
};
