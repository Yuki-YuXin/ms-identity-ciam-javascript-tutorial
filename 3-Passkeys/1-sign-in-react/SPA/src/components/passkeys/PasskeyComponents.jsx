import React from 'react';
import { Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { FaKey, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

// PasskeyItem (Presentational Component)
export const PasskeyItem = ({ passkey, onEdit, onDelete, isLoading = false }) => {
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

// PasskeysList component with better empty state
export const PasskeysList = ({ passkeys, onEdit, onDelete, isLoading = false, error = null }) => {
    if (error) {
        return (
            <Alert variant="danger" className="mb-0">
                <div className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>
                        <Alert.Heading className="mb-1">Error loading passkeys</Alert.Heading>
                        <p className="mb-0">{error}</p>
                    </div>
                </div>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-3" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="text-muted mb-0">Loading your passkeys...</p>
            </div>
        );
    }

    if (passkeys.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="mb-3">
                    <FaKey size={48} className="text-muted opacity-50" />
                </div>
                <h6 className="text-muted mb-2">No passkeys configured yet</h6>
                <p className="text-muted small mb-0">
                    Create a passkey to sign in faster and more securely
                </p>
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
export const PasskeysHeader = ({ count, maxCount, onAddClick, isLoading = false, onRefresh }) => {
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
