import React from 'react';
import { FaBell, FaExclamationTriangle } from 'react-icons/fa';

// SecurityAlert (Presentational Component)
export const SecurityAlert = ({ message, type = 'info', icon: IconComponent = FaExclamationTriangle }) => {
    return (
        <div className="security-alert mb-4">
            <div className="d-flex align-items-center">
                <IconComponent className="me-2 security-alert-icon" />
                <span className="security-alert-text">{message}</span>
            </div>
        </div>
    );
};

// SecurityPageHeader (Presentational Component)
export const SecurityPageHeader = ({ title, subtitle }) => {
    return (
        <div className="text-center mb-4">
            <div className="d-flex justify-content-center align-items-center mb-2">
                <FaBell className="me-2 text-primary" size={32} />
                <h2 className="mb-0">{title}</h2>
            </div>
            <p className="text-muted">{subtitle}</p>
        </div>
    );
};

// UserProfileHeader (Presentational Component)
export const UserProfileHeader = ({ name, email }) => {
    return (
        <div className="user-profile-header mb-4">
            <div className="user-info mb-3">
                <h2 className="user-email mb-0 fw-semibold">{email}</h2>
            </div>
            <p className="user-description mb-0 text-muted">
                Manage sign-in and verification options for your account
            </p>
        </div>
    );
};
