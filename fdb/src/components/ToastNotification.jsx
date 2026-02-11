import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastNotification = ({ show, message, variant, onClose }) => {
    return (
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
            <Toast show={show} autohide delay={3000} onClose={onClose} bg={variant}>
                <Toast.Header closeButton={true}>
                    <strong className="me-auto">Notification</strong>
                </Toast.Header>
                <Toast.Body className={variant === 'dark' || variant === 'danger' || variant === 'success' ? 'text-white' : ''}>
                    {message}
                </Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default ToastNotification;
