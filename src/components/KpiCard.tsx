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
          border: 'border-emerald-200 hover:border-emerald-300',
          iconBg: 'bg-emerald-50 text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'danger':
        return {
          border: 'border-rose-200 hover:border-rose-300',
          iconBg: 'bg-rose-50 text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
        };
      case 'teal':
        return {
          border: 'border-teal-200 hover:border-teal-300',
          iconBg: 'bg-teal-50 text-teal-700',
          badge: 'bg-teal-100 text-teal-800',
        };
      case 'blue':
        return {
          border: 'border-blue-200 hover:border-blue-300',
          iconBg: 'bg-blue-50 text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          border: 'border-slate-200 hover:border-slate-300',
          iconBg: 'bg-slate-100 text-slate-700',
          badge: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      id={id}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`bg-white rounded-xl p-5 border ${styles.border} shadow-sm transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${styles.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label}
          </span>
        )}
      </div>
    </div>
  );
};
