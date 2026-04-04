import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative w-full ${sizes[size]} bg-surface rounded-2xl shadow-xl animate-scale-in border border-border/50
          ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-0">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-text-secondary mt-1">
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-background-alt transition-all duration-150 cursor-pointer -mr-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    />
  );
}
