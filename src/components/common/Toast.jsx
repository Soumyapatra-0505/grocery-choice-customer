import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Toast() {
  const { toast, closeToast } = useCart();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#34d399" />,
    error: <AlertCircle size={18} color="#f87171" />,
    info: <Info size={18} color="#60a5fa" />,
  };

  return (
    <div className="toast-container" aria-live="assertive">
      <div className={`toast toast-${toast.type || 'success'}`}>
        {icons[toast.type] || icons.success}
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={closeToast}
          aria-label="Dismiss notification"
          style={{
            marginLeft: 'auto',
            color: '#94a3b8',
            display: 'inline-flex',
            padding: '2px'
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
