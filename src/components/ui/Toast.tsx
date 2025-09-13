import * as React from 'react';
import { animate } from 'motion';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  return children;
};

interface ToastProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  variant?: 'success' | 'info';
}

export const SuccessToast = ({ open, setOpen, title, variant = 'success' }: ToastProps) => {
  const toastRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!toastRef.current) return;

    if (open) {
      // Show animation
      animate(
        toastRef.current,
        { 
          opacity: [0, 1],
          transform: [
            'translate(-50%, -16px) scale(0.9)', 
            'translate(-50%, 0) scale(1)'
          ]
        },
        {
          duration: 0.3,
          easing: [.23, 1, .32, 1]
        }
      );

      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        if (toastRef.current) {
          animate(
            toastRef.current,
            { 
              opacity: [1, 0],
              transform: [
                'translate(-50%, 0) scale(1)', 
                'translate(-50%, -16px) scale(0.9)'
              ]
            },
            {
              duration: 0.2,
              easing: 'ease-in'
            }
          ).finished.then(() => setOpen(false));
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={toastRef}
      className={`fixed top-4 left-1/2 z-[2147483647]
                 w-[calc(100%-32px)] max-w-md
                 ${variant === 'info' ? 'bg-blue-500/90' : 'bg-green-500/90'} 
                 backdrop-blur-[16px] 
                 border ${variant === 'info' ? 'border-blue-500/30' : 'border-green-500/30'} 
                 rounded-xl px-4 py-3
                 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]`}
      style={{
        transform: 'translate(-50%, -16px) scale(0.9)',
        opacity: 0
      }}
    >
      <div className="text-white text-sm font-medium text-center">
        {title}
      </div>
    </div>
  );
};