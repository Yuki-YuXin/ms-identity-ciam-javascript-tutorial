import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

// Add Passkey Modal Component
export const AddPasskeyModal = ({ show, onHide, onSave }) => {
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
export const EditPasskeyModal = ({ show, onHide, passkey, onSave }) => {
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
