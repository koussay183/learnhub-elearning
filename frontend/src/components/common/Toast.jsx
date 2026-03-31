import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// --- Individual Toast component ---

const typeConfig = {
  success: {
    bg: 'bg-green-400/10 border-green-400/20',
    icon: CheckCircle,
    iconColor: 'text-green-400',
    textColor: 'text-green-400',
  },
  error: {
    bg: 'bg-red-400/10 border-red-400/20',
    icon: XCircle,
    iconColor: 'text-red-400',
    textColor: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-400/10 border-blue-400/20',
    icon: Info,
    iconColor: 'text-blue-400',
    textColor: 'text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-400/10 border-yellow-400/20',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    textColor: 'text-yellow-400',
  },
};

const Toast = ({ message, type = 'info', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  useEffect(() => {
    // Trigger slide-in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${config.bg} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Icon */}
      <IconComponent className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />

      {/* Message */}
      <p className={`text-sm font-semibold flex-1 ${config.textColor}`}>{message}</p>

      {/* Close button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`p-1 rounded-lg hover:bg-white/5 transition-colors ${config.textColor}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Toast Context + Container ---

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
