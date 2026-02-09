import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastNotification = ({ toasts, removeToast }) => {
    return (
        <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    onClose={() => removeToast(toast.id)}
                    show={true}
                    delay={3000}
                    autohide
                    bg={toast.variant === 'error' ? 'danger' : toast.variant === 'success' ? 'success' : 'light'}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toast.title || 'Notification'}</strong>
                    </Toast.Header>
                    <Toast.Body className={toast.variant === 'error' || toast.variant === 'success' ? 'text-white' : ''}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            ))}
        </ToastContainer>
    );
};

export default ToastNotification;
