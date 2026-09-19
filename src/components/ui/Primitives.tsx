import React, { forwardRef, useEffect, useId, useRef } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'border-academic-700 bg-academic-700 text-white hover:border-academic-800 hover:bg-academic-800',
  secondary: 'border-rule bg-white text-ink-950 hover:border-academic-700 hover:bg-teal-50',
  quiet: 'border-transparent bg-transparent text-ink-800 hover:bg-teal-50 hover:text-academic-800',
  danger: 'border-brick-700 bg-brick-700 text-white hover:bg-red-800',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm sm:min-h-10',
};

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}>(({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-md border border-transparent text-slate-600 transition-colors hover:bg-teal-50 hover:text-academic-800 disabled:cursor-not-allowed disabled:opacity-50 sm:size-10',
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = 'IconButton';

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-md border border-rule bg-white px-3.5 text-sm text-ink-950 placeholder:text-slate-400 hover:border-slate-400 focus:border-academic-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:min-h-10',
        className,
      )}
      {...props}
    />
  ),
);
TextInput.displayName = 'TextInput';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-md border border-rule bg-white px-3.5 text-sm text-ink-950 hover:border-slate-400 focus:border-academic-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:min-h-10',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';

export const TabButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
}>(({ className, selected = false, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-selected={selected}
    className={cn(
      'min-h-11 border-b-2 px-3 text-sm font-semibold transition-colors sm:min-h-10',
      selected
        ? 'border-academic-700 text-academic-700'
        : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-ink-950',
      className,
    )}
    {...props}
  />
));
TabButton.displayName = 'TabButton';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const alertStyles: Record<AlertTone, { root: string; icon: React.ReactNode }> = {
  info: { root: 'border-blue-200 bg-blue-50 text-blue-950', icon: <Info className="size-4" /> },
  success: { root: 'border-emerald-200 bg-emerald-50 text-emerald-950', icon: <CheckCircle2 className="size-4" /> },
  warning: { root: 'border-amber-200 bg-amber-50 text-amber-950', icon: <AlertTriangle className="size-4" /> },
  error: { root: 'border-red-200 bg-red-50 text-red-950', icon: <AlertCircle className="size-4" /> },
};

export const Alert: React.FC<{
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ tone = 'info', title, children, action, className }) => {
  const style = alertStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-3 rounded border px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between', style.root, className)}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 shrink-0" aria-hidden="true">{style.icon}</span>
        <div className="min-w-0 leading-5">
          {title && <strong className="mr-1 font-semibold">{title}</strong>}
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const ModalSurface: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}> = ({ title, onClose, children, footer, className }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const getFocusableElements = (): HTMLElement[] => (
      Array.from(dialog.querySelectorAll(MODAL_FOCUSABLE_SELECTOR)) as HTMLElement[]
    ).filter((element) => element.getAttribute('aria-hidden') !== 'true');

    (getFocusableElements()[0] ?? dialog).focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/45 p-4" role="presentation">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-rule bg-white shadow-xl', className)}
      >
        <header className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink-950">{title}</h2>
          <IconButton aria-label="Đóng hộp thoại" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-rule px-5 py-4">{footer}</footer>}
      </section>
    </div>
  );
};
