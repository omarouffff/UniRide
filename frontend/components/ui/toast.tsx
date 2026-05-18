'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, ...message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitives.Provider swipeDirection="right" duration={4000}>
        {children}
        <ToastViewport>
          {toasts.map((toastMessage) => (
            <Toast key={toastMessage.id} variant={toastMessage.variant} duration={4000}>
              <ToastTitle>{toastMessage.title}</ToastTitle>
              {toastMessage.description ? <ToastDescription>{toastMessage.description}</ToastDescription> : null}
            </Toast>
          ))}
        </ToastViewport>
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
};

const ToastViewport = React.forwardRef<any, ToastPrimitives.ToastViewportProps>((props, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-50 flex max-w-[420px] flex-col gap-3 p-4',
      'sm:right-6 sm:bottom-6'
    )}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

interface ToastProps extends ToastPrimitives.ToastProps {
  variant?: ToastVariant;
}

const Toast = React.forwardRef<any, ToastProps>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Toast
    ref={ref}
    className={cn(
      'grid gap-2 rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-slate-950/40',
      variant === 'success' && 'border-emerald-500',
      variant === 'error' && 'border-rose-500',
      variant === 'info' && 'border-sky-500',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
      className
    )}
    {...props}
  />
));
Toast.displayName = 'Toast';

const ToastTitle = React.forwardRef<HTMLHeadingElement, ToastPrimitives.ToastTitleProps>(({ className, ...props }, ref) => (
  <ToastPrimitives.ToastTitle ref={ref} className={cn('text-sm font-semibold text-white', className)} {...props} />
));
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<HTMLParagraphElement, ToastPrimitives.ToastDescriptionProps>(({ className, ...props }, ref) => (
  <ToastPrimitives.ToastDescription ref={ref} className={cn('text-sm leading-5 text-slate-400', className)} {...props} />
));
ToastDescription.displayName = 'ToastDescription';

export { ToastProvider, Toast };
