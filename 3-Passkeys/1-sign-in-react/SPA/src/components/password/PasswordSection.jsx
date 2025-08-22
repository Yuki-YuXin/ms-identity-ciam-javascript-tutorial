import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import IdentityVerificationModal from '../modals/IdentityVerificationModal';

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

export default PasswordSection;
