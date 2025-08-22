import React, { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

// Individual Toast Item Component
const ToastItem = ({ toast, onClose }) => {
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000); // Auto-hide after 4 seconds
            return () => clearTimeout(timer);
        }
    }, [toast.show, onClose]);

    return (
        <Toast show={toast.show} onClose={onClose} className="mb-2">
            <Toast.Header closeButton={true} className="border-0">
                <strong className="me-auto">{toast.title}</strong>
            </Toast.Header>
            <Toast.Body className="text-muted">
                {toast.message}
            </Toast.Body>
        </Toast>
    );
};

// Combined Toast Notifications Container
const ToastNotifications = ({ toasts, onCloseToast }) => {
    return (
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => onCloseToast(toast.id)}
                />
            ))}
        </ToastContainer>
    );
};

export default ToastNotifications;
