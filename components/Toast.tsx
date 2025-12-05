'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-cerrar después de 5 segundos

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`${getBgColor()} ${getTextColor()} border-2 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md flex items-start gap-3 animate-slide-in`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-base font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
        aria-label="Cerrar notificación"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

