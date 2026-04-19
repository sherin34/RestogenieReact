import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  onConfirm, 
  onCancel, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  type = "danger" // 'danger' or 'primary'
}) => {
  if (!isOpen) return null;

  const confirmBtnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '24px', 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideUp 0.3s ease-out',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700' }}>{title}</h2>
        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            className="btn-secondary" 
            onClick={onCancel}
            style={{ padding: '10px 20px', borderRadius: '10px' }}
          >
            {cancelText}
          </button>
          <button 
            className={confirmBtnClass} 
            onClick={onConfirm}
            style={{ padding: '10px 24px', borderRadius: '10px', minWidth: '100px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
