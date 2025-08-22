import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

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

export default IdentityVerificationModal;
