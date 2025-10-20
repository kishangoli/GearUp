import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          transition={{ 
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1]
          }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[2147483647]
                     w-[calc(100%-32px)] max-w-md
                     ${variant === 'info' ? 'bg-blue-500/90' : 'bg-green-500/90'} 
                     backdrop-blur-[16px] 
                     border ${variant === 'info' ? 'border-blue-500/30' : 'border-green-500/30'} 
                     rounded-xl px-4 py-3
                     shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]`}
        >
          <div className="text-white text-sm font-medium text-center">
            {title}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};