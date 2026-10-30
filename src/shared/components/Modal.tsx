import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  variant?: 'dark' | 'light';
}

const maxStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '4xl': 'max-w-5xl',
};

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'lg', variant = 'light' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div onClick={onClose} className={`fixed inset-0 backdrop-blur-xs transition-opacity ${variant === 'light' ? 'bg-black/65' : 'bg-[#100D1D]/85'}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 my-auto w-full ${maxStyles[maxWidth]} overflow-hidden rounded-2xl border shadow-2xl ${variant === 'light' ? 'border-line bg-surface text-ink' : 'border-[#453D59] bg-[#201B30] text-[#F0EDF8]'}`}
      >
        <div className={`flex items-center justify-between border-b px-6 py-4 ${variant === 'light' ? 'border-line bg-surface-soft' : 'border-[#453D59] bg-[#252037]/80'}`}>
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${variant === 'light' ? 'text-ink' : 'text-white'}`}>{title}</h3>
            {subtitle && <p className={`mt-0.5 text-xs ${variant === 'light' ? 'text-muted' : 'text-[#B6B0C7]'}`}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
             className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors ${variant === 'light' ? 'text-muted hover:bg-surface-raised hover:text-ink' : 'text-[#B6B0C7] hover:bg-[#453D59] hover:text-white'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
