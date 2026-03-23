import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean; // If true, confirm button is red
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) => {
  if (!show) return null;

  // Derive testids from title for uniqueness (e.g. "Delete Tag" → "delete-tag-confirm", "delete-tag-cancel")
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      data-testid={`${slug}-modal`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: '400px', maxWidth: '90%', zIndex: 10000, pointerEvents: 'auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '15px' }}>{title}</h3>
        <p style={{ marginBottom: '20px', color: '#555' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            data-testid={`${slug}-cancel`}
            onClick={onCancel}
            className="btn"
            style={{ background: '#95a5a6' }}
          >
            {cancelText}
          </button>
          <button
            data-testid={`${slug}-confirm`}
            onClick={onConfirm}
            className="btn"
            style={{ background: danger ? '#e74c3c' : '#27ae60' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
