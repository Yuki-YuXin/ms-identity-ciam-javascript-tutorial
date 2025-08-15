import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, Card, ListGroup, Modal, Form, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import { FaBell, FaKey, FaPlus, FaExclamationTriangle, FaTimes, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useMsal } from '@azure/msal-react';
import { tokenRequest } from '../authConfig';

import '../styles/App.css';

// Microsoft Graph API service
const GraphApiService = {
    // Function to call Microsoft Graph API
    async callGraphApi(accessToken, endpoint) {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('Content-Type', 'application/json');

        const options = {
            method: 'GET',
            headers: headers,
        };

        try {
            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Graph API call failed:', error);
            throw error;
        }
    },

    // Get FIDO2 authentication methods for a user
    async getFido2Methods(accessToken, userId) {
        const endpoint = `https://graph.microsoft.com/v1.0/users/${userId}/authentication/fido2Methods`;
        return await this.callGraphApi(accessToken, endpoint);
    },

    // Transform Graph API response to match our component's expected format
    transformFido2Methods(graphResponse) {
        if (!graphResponse || !graphResponse.value) {
            return [];
        }

        return graphResponse.value.map(method => ({
            id: method.id,
            name: method.displayName || 'Unnamed Passkey',
            lastUsed: method.lastUsedDateTime ? 
                this.formatLastUsed(method.lastUsedDateTime) : 'Never',
            created: method.createdDateTime ? 
                new Date(method.createdDateTime).toLocaleDateString() : 'Unknown',
            device: method.model || 'Unknown Device',
            // Store additional Graph API data
            _graphData: method
        }));
    },

    // Format last used date to friendly string
    formatLastUsed(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return '1 day ago';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else {
            const months = Math.floor(diffInDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }
    }
};

// Combined Toast Component - handles both individual toasts and the container
const ToastNotifications = ({ toasts, onCloseToast }) => {
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

// Add Passkey Modal Component
const AddPasskeyModal = ({ show, onHide, onSave }) => {
    const [step, setStep] = useState(1);
    const [passkeyName, setPasskeyName] = useState('');

    const handleNext = () => {
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleCreatePasskey = () => {
        if (passkeyName.trim()) {
            onSave({
                name: passkeyName.trim(),
                device: 'Current Device' // You can modify this logic as needed
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setStep(1);
        setPasskeyName('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header className="border-0 pb-0">
                <Modal.Title className="w-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <span>
                            {step === 1 ? 'Sign in faster with your face, fingerprint or PIN' : "Let's name your passkey"}
                        </span>
                        <Button variant="link" className="p-0 text-muted" onClick={handleClose}>
                            <FaTimes />
                        </Button>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                {step === 1 && (
                    <>
                        {/* Phone illustration */}
                        <div className="text-center mb-4">
                            <div style={{ 
                                width: '120px', 
                                height: '200px', 
                                margin: '0 auto',
                                background: '#6c757d',
                                borderRadius: '20px',
                                position: 'relative',
                                border: '3px solid #495057'
                            }}>
                                {/* Phone speaker */}
                                <div style={{
                                    width: '40px',
                                    height: '4px',
                                    background: '#212529',
                                    borderRadius: '2px',
                                    margin: '12px auto'
                                }}></div>
                                
                                {/* Phone screen */}
                                <div style={{
                                    width: '90px',
                                    height: '140px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    margin: '10px auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    {/* Passkey icon */}
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        border: '3px solid #007bff',
                                        borderRadius: '8px',
                                        borderStyle: 'dashed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#007bff'
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4V6L13.5 7.5C13.1 7.2 12.6 7 12 7S10.9 7.2 10.5 7.5L9 6V4L3 7V9L9 12L12 10.5L15 12L21 9ZM12 13.5C11.2 13.5 10.5 13.1 10.1 12.5L9 13V19C9 19.6 9.4 20 10 20H14C14.6 20 15 19.6 15 19V13L13.9 12.5C13.5 13.1 12.8 13.5 12 13.5Z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-muted mb-4 text-center">
                            Create a passkey to sign in to your account. No passwords, apps, or codes needed.
                        </p>

                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-secondary" 
                                onClick={handleClose}
                                className="flex-shrink-0"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                className="flex-shrink-0 ms-auto"
                                onClick={handleNext}
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p className="text-muted mb-4">
                            Give your passkey a name to help manage it later.
                        </p>

                        <div className="mb-4">
                            <label className="form-label fw-semibold">Passkey Name</label>
                            <input
                                type="text"
                                className="form-control"
                                style={{ borderRadius: '8px', padding: '12px' }}
                                value={passkeyName}
                                onChange={(e) => setPasskeyName(e.target.value)}
                                placeholder="Enter passkey name"
                                autoFocus
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-secondary" 
                                onClick={handleBack}
                                className="flex-shrink-0"
                            >
                                Back
                            </Button>
                            <Button 
                                variant="primary"
                                className="flex-shrink-0 ms-auto"
                                onClick={handleCreatePasskey}
                                disabled={!passkeyName.trim()}
                            >
                                Create Passkey
                            </Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

// Edit Passkey Modal Component
const EditPasskeyModal = ({ show, onHide, passkey, onSave }) => {
    const [passkeyName, setPasskeyName] = useState('');

    // Update the input when passkey changes
    useEffect(() => {
        if (passkey) {
            setPasskeyName(passkey.name);
        }
    }, [passkey]);

    const handleSave = () => {
        if (passkeyName.trim()) {
            onSave({ ...passkey, name: passkeyName.trim() });
            handleClose();
        }
    };

    const handleClose = () => {
        setPasskeyName('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header className="border-0 pb-0">
                <Modal.Title className="w-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <span>Rename Passkey</span>
                        <Button variant="link" className="p-0 text-muted" onClick={handleClose}>
                            <FaTimes />
                        </Button>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <p className="text-muted mb-4">
                    Give your passkey a new name to help you identify it.
                </p>

                <div className="mb-4">
                    <label className="form-label fw-semibold">Passkey Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={passkeyName}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        placeholder="Enter passkey name"
                        autoFocus
                    />
                </div>

                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleClose}
                        className="flex-shrink-0"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        className="flex-shrink-0 ms-auto"
                        onClick={handleSave}
                        disabled={!passkeyName.trim()}
                    >
                        Save Changes
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

// Identity Verification Modal Component
const IdentityVerificationModal = ({ 
    show, 
    onHide, 
    onVerificationComplete, 
    onShowToast,
    phoneNumber = "+1 (555) 123-4567" 
}) => {
    const [verificationStep, setVerificationStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [isCodeSent, setIsCodeSent] = useState(false);

    const handleSendCode = () => {
        setIsCodeSent(true);
        setVerificationStep(2);
        // Show toast notification
        if (onShowToast) {
            onShowToast({
                title: 'Verification code sent',
                message: `A 6-digit code has been sent to ${phoneNumber}.`,
                variant: 'info'
            });
        }
    };

    const handleBackToStep1 = () => {
        setVerificationStep(1);
        setVerificationCode(['', '', '', '', '', '']);
    };

    const handleCodeChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digits
        
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleVerify = () => {
        const code = verificationCode.join('');
        if (code.length === 6) {
            // Show verification success toast
            if (onShowToast) {
                onShowToast({
                    title: 'Verification successful',
                    message: 'You can now proceed with your security changes.',
                    variant: 'success'
                });
            }
            // Simulate verification success
            onVerificationComplete();
            handleClose();
        }
    };

    const handleClose = () => {
        setVerificationStep(1);
        setVerificationCode(['', '', '', '', '', '']);
        setIsCodeSent(false);
        onHide();
    };

    const isCodeComplete = verificationCode.every(digit => digit !== '');

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header className="border-0 pb-0">
                <Modal.Title className="w-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <span>Verify your identity</span>
                        <Button variant="link" className="p-0 text-muted" onClick={handleClose}>
                            <FaTimes />
                        </Button>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <p className="text-muted mb-4">
                    To update your password, please verify your identity.
                </p>

                {verificationStep === 1 && (
                    <>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Phone Number</label>
                            <div className="text-muted">{phoneNumber}</div>
                        </div>
                        <div className="d-grid">
                            <Button 
                                variant="primary" 
                                size="sm"
                                onClick={handleSendCode}
                                className="rounded-3"
                                style={{ padding: '12px 24px' }}
                            >
                                Send Verification Code
                            </Button>
                        </div>
                    </>
                )}

                {verificationStep === 2 && (
                    <>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Phone Number</label>
                            <div className="text-muted">{phoneNumber}</div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Enter 6-digit verification code</label>
                            <div className="d-flex gap-2 mt-2">
                                {verificationCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        name={`code-${index}`}
                                        className="form-control text-center"
                                        style={{ width: '50px', height: '50px', fontSize: '20px' }}
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !digit && index > 0) {
                                                const prevInput = document.querySelector(`input[name="code-${index - 1}"]`);
                                                if (prevInput) prevInput.focus();
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-secondary" 
                                onClick={handleBackToStep1}
                                className="flex-shrink-0"
                            >
                                Back
                            </Button>
                            <Button 
                                variant="primary" 
                                className="flex-shrink-0 ms-auto"
                                onClick={handleVerify}
                                disabled={!isCodeComplete}
                            >
                                Verify
                            </Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

// PasskeyItem (Presentational Component)
const PasskeyItem = ({ passkey, onEdit, onDelete, isLoading = false }) => {
    return (
        <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <div>
                <div className="d-flex align-items-center mb-1">
                    <strong>{passkey.name}</strong>
                </div>
                <small className="text-muted">
                    Device: {passkey.device} • Created: {passkey.created}
                    {passkey.lastUsed !== 'Never' && ` • Last used: ${passkey.lastUsed}`}
                </small>
            </div>
            <div>
                <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => onEdit(passkey)}
                    disabled={isLoading}
                >
                    <HiOutlinePencil />
                </Button>
                <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => onDelete(passkey.id)}
                    disabled={isLoading}
                >
                    <HiOutlineTrash />
                </Button>
            </div>
        </ListGroup.Item>
    );
};

// PasskeysList (Presentational Component)
const PasskeysList = ({ passkeys, onEdit, onDelete, isLoading = false, error = null }) => {
    if (error) {
        return (
            <Alert variant="danger" className="mb-0">
                <Alert.Heading>Error loading passkeys</Alert.Heading>
                <p className="mb-0">{error}</p>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" role="status" className="mb-3">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="text-muted">Loading your passkeys...</p>
            </div>
        );
    }

    if (passkeys.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-muted">No passkeys configured yet</p>
            </div>
        );
    }

    return (
        <ListGroup variant="flush">
            {passkeys.map(passkey => (
                <PasskeyItem 
                    key={passkey.id} 
                    passkey={passkey} 
                    onEdit={onEdit} 
                    onDelete={onDelete}
                    isLoading={isLoading}
                />
            ))}
        </ListGroup>
    );
};

// PasskeysHeader (Presentational Component)
const PasskeysHeader = ({ count, maxCount, onAddClick, isLoading = false, onRefresh }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">Passkeys ({count}/{maxCount})</h5>
                {onRefresh && (
                    <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Refresh passkeys"
                    >
                        {isLoading ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            '↻'
                        )}
                    </Button>
                )}
            </div>
            <Button 
                variant="primary" 
                size="sm"
                onClick={onAddClick}
                disabled={count >= maxCount || isLoading}
            >
                <FaPlus className="me-1" />
                Add Passkey
            </Button>
        </div>
    );
};

// PasskeysSection (Container Component) - Updated with Graph API integration
const PasskeysSection = ({ onShowToast, accessToken, userId }) => {
    const [passkeys, setPasskeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPasskey, setEditingPasskey] = useState(null);
    const [pendingAction, setPendingAction] = useState(null); // 'add' or 'edit'
    const maxPasskeys = 10;

    // Function to fetch passkeys from Graph API
    const fetchPasskeys = async () => {
        if (!accessToken || !userId) {
            setError('Access token or user ID not available');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            const response = await GraphApiService.getFido2Methods(accessToken, userId);
            const transformedPasskeys = GraphApiService.transformFido2Methods(response);
            
            setPasskeys(transformedPasskeys);
            
            // Show success toast if this is a refresh (not initial load)
            if (passkeys.length > 0 && onShowToast) {
                onShowToast({
                    title: 'Passkeys refreshed',
                    message: `Found ${transformedPasskeys.length} passkey(s).`,
                    variant: 'success'
                });
            }
        } catch (err) {
            console.error('Error fetching FIDO2 methods:', err);
            setError(`Failed to load passkeys: ${err.message}`);
            
            if (onShowToast) {
                onShowToast({
                    title: 'Error loading passkeys',
                    message: 'Failed to load your passkeys. Please try again.',
                    variant: 'danger'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch passkeys on component mount and when dependencies change
    useEffect(() => {
        fetchPasskeys();
    }, [accessToken, userId]);

    const handleAddPasskey = () => {
        setPendingAction('add');
        setShowVerificationModal(true);
    };

    const handleEditPasskey = (passkey) => {
        setEditingPasskey(passkey);
        setPendingAction('edit');
        setShowVerificationModal(true);
    };

    const handleDeletePasskey = (passkeyId) => {
        // Note: In a real implementation, you would call Graph API to delete the passkey
        // For now, we'll simulate deletion and show a toast
        const passkeyToDelete = passkeys.find(p => p.id === passkeyId);
        setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
        
        // Show success toast
        if (onShowToast && passkeyToDelete) {
            onShowToast({
                title: 'Passkey deleted',
                message: `"${passkeyToDelete.name}" has been successfully removed.`,
                variant: 'success'
            });
        }
    };

    const handleVerificationComplete = () => {
        setShowVerificationModal(false);
        if (pendingAction === 'add') {
            setShowAddModal(true);
        } else if (pendingAction === 'edit') {
            setShowEditModal(true);
        }
    };

    const handleSaveNewPasskey = (passkeyData) => {
        // Note: In a real implementation, you would call Graph API to create the passkey
        // For now, we'll simulate creation
        const newPasskey = {
            id: Date.now().toString(),
            ...passkeyData,
            created: new Date().toLocaleDateString(),
            lastUsed: 'Never'
        };
        setPasskeys(prev => [...prev, newPasskey]);
        setShowAddModal(false);
        setPendingAction(null);
        
        // Show success toast
        if (onShowToast) {
            onShowToast({
                title: 'Passkey created',
                message: `"${newPasskey.name}" has been successfully created.`,
                variant: 'success'
            });
        }
    };

    const handleSaveEditedPasskey = (updatedPasskey) => {
        // Note: In a real implementation, you would call Graph API to update the passkey
        // For now, we'll simulate update
        setPasskeys(prev => prev.map(p => 
            p.id === updatedPasskey.id ? updatedPasskey : p
        ));
        setShowEditModal(false);
        setEditingPasskey(null);
        setPendingAction(null);
        
        // Show success toast
        if (onShowToast) {
            onShowToast({
                title: 'Passkey updated',
                message: `"${updatedPasskey.name}" has been successfully updated.`,
                variant: 'success'
            });
        }
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setPendingAction(null);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingPasskey(null);
        setPendingAction(null);
    };

    const handleRefresh = () => {
        fetchPasskeys();
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <PasskeysHeader 
                    count={passkeys.length} 
                    maxCount={maxPasskeys}
                    onAddClick={handleAddPasskey}
                    isLoading={isLoading}
                    onRefresh={handleRefresh}
                />
                <PasskeysList 
                    passkeys={passkeys} 
                    onEdit={handleEditPasskey}
                    onDelete={handleDeletePasskey}
                    isLoading={isLoading}
                    error={error}
                />
            </Card.Body>

            {/* Identity Verification Modal */}
            <IdentityVerificationModal
                show={showVerificationModal}
                onHide={() => {
                    setShowVerificationModal(false);
                    setEditingPasskey(null);
                    setPendingAction(null);
                }}
                onVerificationComplete={handleVerificationComplete}
                onShowToast={onShowToast}
            />

            {/* Add Passkey Modal */}
            <AddPasskeyModal
                show={showAddModal}
                onHide={handleCloseAddModal}
                onSave={handleSaveNewPasskey}
            />

            {/* Edit Passkey Modal */}
            <EditPasskeyModal
                show={showEditModal}
                onHide={handleCloseEditModal}
                passkey={editingPasskey}
                onSave={handleSaveEditedPasskey}
            />
        </Card>
    );
};

// PasswordSection (Container Component)
const PasswordSection = ({ onShowToast }) => {
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = () => {
        setShowVerificationModal(true);
    };

    const handleVerificationComplete = () => {
        setShowVerificationModal(false);
        setShowPasswordForm(true);
    };

    const handleCancel = () => {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUpdatePassword = (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return;
        }

        if (newPassword !== confirmPassword) {
            if (onShowToast) {
                onShowToast({
                    title: 'Password mismatch',
                    message: 'New password and confirm password do not match.',
                    variant: 'info'
                });
            }
            return;
        }

        // Simulate password update
        if (onShowToast) {
            onShowToast({
                title: 'Password updated',
                message: 'Your password has been successfully updated.',
                variant: 'success'
            });
        }

        // Reset form
        handleCancel();
    };

    const isFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

    return (
        <Card className="mb-4">
            <Card.Body>
                {!showPasswordForm ? (
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-1 text-start">Password</h5>
                        <Button variant="primary" size="sm" onClick={handleChangePassword}>
                            Change Password
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h5 className="mb-4 text-start">Password</h5>
                        <Form onSubmit={handleUpdatePassword}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-start d-block">Current Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required 
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-start d-block">New Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required 
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold text-start d-block">Confirm New Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required 
                                />
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    type="submit"
                                    disabled={!isFormValid}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}
            </Card.Body>

            {/* Identity Verification Modal */}
            <IdentityVerificationModal
                show={showVerificationModal}
                onHide={() => setShowVerificationModal(false)}
                onVerificationComplete={handleVerificationComplete}
                onShowToast={onShowToast}
            />
        </Card>
    );
};

// SecurityAlert (Presentational Component)
const SecurityAlert = ({ message, type = 'info', icon: IconComponent = FaExclamationTriangle }) => {
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
const SecurityPageHeader = ({ title, subtitle }) => {
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
const UserProfileHeader = ({ name, email }) => {
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

// Updated SecurityPage component with MSAL integration and Graph API
const SecurityPage = ({ idTokenClaims }) => {
    const { instance, accounts } = useMsal();
    const [accessToken, setAccessToken] = useState(null);
    const [tokenClaims, setTokenClaims] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);

    // Function to decode JWT token
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    };

    // Fetch access token on component mount
    useEffect(() => {
        const getAccessToken = async () => {
            if (accounts.length > 0) {
                try {
                    const request = {
                        ...tokenRequest,
                        account: accounts[0],
                    };

                    // Try to get token silently first
                    const response = await instance.acquireTokenSilent(request);
                    setAccessToken(response.accessToken);
                    
                    // Decode the access token to show claims
                    const decodedToken = parseJwt(response.accessToken);
                    setTokenClaims(decodedToken);
                    setLoading(false);
                } catch (error) {
                    console.error('Error acquiring access token:', error);
                    setError('Failed to acquire access token. This might be because the token is not available or has expired.');
                    setLoading(false);
                }
            } else {
                setError('No account found');
                setLoading(false);
            }
        };

        getAccessToken();
    }, [instance, accounts]);

    // Extract user ID from token claims
    const getUserId = () => {
        // Debug: Log available claims
        console.log('TokenClaims:', tokenClaims);
        console.log('IdTokenClaims:', idTokenClaims);

        // If we have token claims, extract user ID (oid)
        if (tokenClaims && tokenClaims.oid) {
            console.log('Using tokenClaims for user ID:', tokenClaims.oid);
            return tokenClaims.oid;
        }

        // If we have idTokenClaims as fallback
        if (idTokenClaims && idTokenClaims.oid) {
            console.log('Using idTokenClaims for user ID:', idTokenClaims.oid);
            return idTokenClaims.oid;
        }

        // Fallback: try other possible user identifier claims
        if (tokenClaims) {
            const fallbackId = tokenClaims.sub || tokenClaims.unique_name;
            if (fallbackId) {
                console.log('Using fallback user ID from tokenClaims:', fallbackId);
                return fallbackId;
            }
        }

        if (idTokenClaims) {
            const fallbackId = idTokenClaims.sub || idTokenClaims.unique_name;
            if (fallbackId) {
                console.log('Using fallback user ID from idTokenClaims:', fallbackId);
                return fallbackId;
            }
        }

        console.warn('No user ID found in token claims');
        return null;
    };

    // Extract user data from token claims
    const getUserData = () => {
        // Default fallback data
        const defaultUserData = {
            name: "User",
            email: "user@example.com",
        };

        // Debug: Log available claims
        console.log('TokenClaims:', tokenClaims);
        console.log('IdTokenClaims:', idTokenClaims);

        // If we have token claims, extract user information
        if (tokenClaims) {
            console.log('Using tokenClaims for user data');
            return {
                name: tokenClaims.name || tokenClaims.given_name || tokenClaims.family_name || defaultUserData.name,
                email: tokenClaims.unique_name || tokenClaims.email || tokenClaims.preferred_username || tokenClaims.upn || tokenClaims.unique_name || defaultUserData.email,
            };
        }

        // If we have idTokenClaims as fallback
        if (idTokenClaims) {
            console.log('Using idTokenClaims for user data');
            return {
                name: idTokenClaims.name || idTokenClaims.given_name || idTokenClaims.family_name || defaultUserData.name,
                email: idTokenClaims.unique_name || idTokenClaims.email || idTokenClaims.preferred_username || idTokenClaims.upn || idTokenClaims.unique_name || defaultUserData.email,
            };
        }

        console.log('Using default user data');
        return defaultUserData;
    };

    // Only get user data and ID after token is loaded
    const userData = !loading && !error ? getUserData() : { name: "Loading...", email: "Loading..." };
    const userId = !loading && !error ? getUserId() : null;

    const alerts = [
        {
            id: 1,
            message: "For your security, multi-factor authentication is required when managing your credentials",
            type: "info",
            icon: FaBell
        }
    ];

    // Function to show toast notifications
    const showToast = (toastData) => {
        const newToast = {
            id: Date.now(),
            show: true,
            ...toastData
        };
        setToasts(prev => [...prev, newToast]);
    };

    // Function to close toast notifications
    const closeToast = (toastId) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
    };

    // Show loading spinner while fetching token
    if (loading) {
        return (
            <Container className="py-4">
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    // Show error if token fetch failed
    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            </Container>
        );
    }

    // Show error if no user ID could be extracted
    if (!userId) {
        return (
            <Container className="py-4">
                <Alert variant="warning">
                    <Alert.Heading>User ID Not Available</Alert.Heading>
                    <p>Unable to extract user ID from token claims. Please try logging in again.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Debug Panel - Remove this once working */}
            {tokenClaims && (
                <Alert variant="info" className="mb-4">
                    <strong>Debug - Token Claims Available:</strong>
                    <pre style={{ fontSize: '12px', marginTop: '10px' }}>
                        {JSON.stringify(tokenClaims, null, 2)}
                    </pre>
                    <strong>Extracted User ID:</strong> {userId}
                </Alert>
            )}

            <UserProfileHeader 
                name={userData.name}
                email={userData.email}
            />

            {alerts.map(alert => (
                <SecurityAlert 
                    key={alert.id}
                    message={alert.message}
                    type={alert.type}
                    icon={alert.icon}
                />
            ))}

            <PasswordSection onShowToast={showToast} />
            <PasskeysSection 
                onShowToast={showToast} 
                accessToken={accessToken}
                userId={userId}
            />

            {/* Toast Notifications */}
            <ToastNotifications 
                toasts={toasts} 
                onCloseToast={closeToast} 
            />
        </Container>
    );
};

// Export the main component (keeping the same export name for compatibility)
export const IdTokenData = (props) => {
    return <SecurityPage idTokenClaims={props.idTokenClaims} />;
};

// Export individual components for potential reuse
export {
    SecurityPage,
    SecurityPageHeader,
    SecurityAlert,
    PasswordSection,
    PasskeysSection,
    PasskeysHeader,
    PasskeysList,
    PasskeyItem,
    IdentityVerificationModal,
    AddPasskeyModal,
    EditPasskeyModal,
    ToastNotifications,
    GraphApiService
};