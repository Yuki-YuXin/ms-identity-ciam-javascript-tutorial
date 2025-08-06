import React, { useState } from 'react';
import { Container, Button, Alert, Card, ListGroup, Modal, Form } from 'react-bootstrap';
import { FaShieldAlt, FaKey, FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

import '../styles/App.css';

// Mock data for demonstration
const mockPasskeys = [
    {
        id: 1,
        name: 'iPhone Touch ID',
        lastUsed: '2 days ago',
        created: 'January 15, 2024',
        device: 'iPhone 15 Pro'
    },
    {
        id: 2,
        name: 'Windows Hello',
        lastUsed: '1 week ago',
        created: 'December 10, 2023',
        device: 'Surface Laptop'
    }
];

// 8. PasskeyItem (Presentational Component)
const PasskeyItem = ({ passkey, onEdit, onDelete }) => {
    return (
        <ListGroup.Item className="d-flex justify-content-between align-items-center">
            <div>
                <div className="d-flex align-items-center mb-1">
                    <FaKey className="me-2 text-primary" />
                    <strong>{passkey.name}</strong>
                </div>
                <small className="text-muted">
                    Last used: {passkey.lastUsed} • Created: {passkey.created}
                </small>
                <br />
                <small className="text-muted">Device: {passkey.device}</small>
            </div>
            <div>
                <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => onEdit(passkey)}
                >
                    <FaEdit />
                </Button>
                <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => onDelete(passkey.id)}
                >
                    <FaTrash />
                </Button>
            </div>
        </ListGroup.Item>
    );
};

// 7. PasskeysList (Presentational Component)
const PasskeysList = ({ passkeys, onEdit, onDelete }) => {
    if (passkeys.length === 0) {
        return (
            <div className="text-center py-4">
                <FaKey className="text-muted mb-3" size={48} />
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
                />
            ))}
        </ListGroup>
    );
};

// 6. PasskeysHeader (Presentational Component)
const PasskeysHeader = ({ count, maxCount, onAddClick }) => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h5 className="mb-1">Passkeys</h5>
                <small className="text-muted">
                    {count} of {maxCount} passkeys configured
                </small>
            </div>
            <Button 
                variant="primary" 
                size="sm"
                onClick={onAddClick}
                disabled={count >= maxCount}
            >
                <FaPlus className="me-1" />
                Add Passkey
            </Button>
        </div>
    );
};

// 5. PasskeysSection (Container Component)
const PasskeysSection = () => {
    const [passkeys, setPasskeys] = useState(mockPasskeys);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPasskey, setEditingPasskey] = useState(null);
    const maxPasskeys = 5;

    const handleAddPasskey = () => {
        setShowAddModal(true);
    };

    const handleEditPasskey = (passkey) => {
        setEditingPasskey(passkey);
        setShowAddModal(true);
    };

    const handleDeletePasskey = (passkeyId) => {
        setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
    };

    const handleSavePasskey = (passkeyData) => {
        if (editingPasskey) {
            setPasskeys(prev => prev.map(p => 
                p.id === editingPasskey.id ? { ...p, ...passkeyData } : p
            ));
        } else {
            const newPasskey = {
                id: Date.now(),
                ...passkeyData,
                created: new Date().toLocaleDateString(),
                lastUsed: 'Never'
            };
            setPasskeys(prev => [...prev, newPasskey]);
        }
        setShowAddModal(false);
        setEditingPasskey(null);
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <PasskeysHeader 
                    count={passkeys.length} 
                    maxCount={maxPasskeys}
                    onAddClick={handleAddPasskey} 
                />
                <PasskeysList 
                    passkeys={passkeys} 
                    onEdit={handleEditPasskey}
                    onDelete={handleDeletePasskey} 
                />
            </Card.Body>

            {/* Add/Edit Passkey Modal */}
            <Modal show={showAddModal} onHide={() => {
                setShowAddModal(false);
                setEditingPasskey(null);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingPasskey ? 'Edit Passkey' : 'Add New Passkey'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        handleSavePasskey({
                            name: formData.get('name'),
                            device: formData.get('device')
                        });
                    }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Passkey Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="name"
                                defaultValue={editingPasskey?.name || ''}
                                placeholder="e.g., iPhone Touch ID" 
                                required 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Device</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="device"
                                defaultValue={editingPasskey?.device || ''}
                                placeholder="e.g., iPhone 15 Pro" 
                                required 
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button 
                                variant="secondary" 
                                className="me-2"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingPasskey(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {editingPasskey ? 'Update' : 'Add'} Passkey
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
};

// 4. PasswordSection (Container Component)
const PasswordSection = () => {
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const handleChangePassword = () => {
        setShowChangePasswordModal(true);
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-1">Password</h5>
                        <small className="text-muted">
                            Last changed: 3 months ago
                        </small>
                    </div>
                    <Button variant="outline-primary" onClick={handleChangePassword}>
                        Change Password
                    </Button>
                </div>
            </Card.Body>

            {/* Change Password Modal */}
            <Modal show={showChangePasswordModal} onHide={() => setShowChangePasswordModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Current Password</Form.Label>
                            <Form.Control type="password" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control type="password" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control type="password" required />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button 
                                variant="secondary" 
                                className="me-2"
                                onClick={() => setShowChangePasswordModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Update Password
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
};

// 3. SecurityAlert (Presentational Component)
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

// 2. SecurityPageHeader (Presentational Component)
const SecurityPageHeader = ({ title, subtitle }) => {
    return (
        <div className="text-center mb-4">
            <div className="d-flex justify-content-center align-items-center mb-2">
                <FaShieldAlt className="me-2 text-primary" size={32} />
                <h2 className="mb-0">{title}</h2>
            </div>
            <p className="text-muted">{subtitle}</p>
        </div>
    );
};

// 1. SecurityPage (Container Component)
const SecurityPage = ({ idTokenClaims }) => {
    const alerts = [
        {
            id: 1,
            message: "For your security, multi-factor authentication is required when managing your credentials.",
            type: "info",
            icon: FaKey
        }
    ];

    return (
        <Container className="py-4">
            <SecurityPageHeader 
                title="Security"
                subtitle="Manage sign-in and verification options for your account"
            />

            {alerts.map(alert => (
                <SecurityAlert 
                    key={alert.id}
                    message={alert.message}
                    type={alert.type}
                    icon={alert.icon}
                />
            ))}

            <PasswordSection />
            <PasskeysSection />

            {/* Debug: Show ID Token Claims */}
            {idTokenClaims && (
                <Card className="mt-4">
                    <Card.Header>
                        <h6 className="mb-0">Debug: ID Token Claims</h6>
                    </Card.Header>
                    <Card.Body>
                        <small className="text-muted">
                            <pre>{JSON.stringify(idTokenClaims, null, 2)}</pre>
                        </small>
                    </Card.Body>
                </Card>
            )}
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
    PasskeyItem
};
