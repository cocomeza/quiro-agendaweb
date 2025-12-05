'use client';

import { useEffect, useState } from 'react';
import { Toast, ToastContainer } from './Toast';
import { subscribeToToasts, removeToast } from '@/lib/toast';

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((newToasts) => {
      setToasts(newToasts);
    });

    return unsubscribe;
  }, []);

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

