import { Toast, ToastType } from '@/components/Toast';

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

export function subscribeToToasts(callback: (toasts: Toast[]) => void) {
  toastListeners.push(callback);
  callback(toasts);
  
  return () => {
    toastListeners = toastListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  toastListeners.forEach(callback => callback([...toasts]));
}

export function showToast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substring(7);
  const newToast: Toast = { id, message, type };
  
  toasts = [...toasts, newToast];
  notifyListeners();
  
  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id);
  notifyListeners();
}

export function showSuccess(message: string) {
  return showToast(message, 'success');
}

export function showError(message: string) {
  return showToast(message, 'error');
}

export function showInfo(message: string) {
  return showToast(message, 'info');
}

export function showWarning(message: string) {
  return showToast(message, 'warning');
}

