import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const toastStyles = {
  success: 'bg-green-500/20 border-green-500 text-green-300',
  error: 'bg-red-500/20 border-red-500 text-red-300',
  info: 'bg-blue-500/20 border-blue-500 text-blue-300',
  warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
};

const icons = {
  success: <CheckCircle size={20} className="text-green-400" />,
  error: <AlertCircle size={20} className="text-red-400" />,
  info: <Info size={20} className="text-blue-400" />,
  warning: <AlertCircle size={20} className="text-yellow-400" />,
};

export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`flex items-center gap-3 border rounded-xl px-5 py-3 shadow-lg backdrop-blur-sm animate-slide-in ${toastStyles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition"><X size={18} /></button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full max-w-md">
          <Toast {...t} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
