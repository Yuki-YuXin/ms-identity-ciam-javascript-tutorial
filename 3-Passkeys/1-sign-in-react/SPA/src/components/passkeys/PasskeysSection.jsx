import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { PasskeysHeader, PasskeysList } from './PasskeyComponents';
import { AddPasskeyModal, EditPasskeyModal } from '../modals/PasskeyModals';
import IdentityVerificationModal from '../modals/IdentityVerificationModal';
import GraphApiService from '../../services/GraphApiService';

// PasskeysSection (Container Component) - Updated with Graph API integration
const PasskeysSection = ({ onShowToast, accessToken, userId }) => {
    const [passkeys, setPasskeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPasskey, setEditingPasskey] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const maxPasskeys = 10;

    // Function to fetch passkeys (now uses mock data)
    const fetchPasskeys = async () => {
        if (!accessToken || !userId) {
            setError('Access token or user ID not available');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            // Use mock data service
            const response = await GraphApiService.getFido2Methods(accessToken, userId);
            const transformedPasskeys = GraphApiService.transformFido2Methods(response);
            
            setPasskeys(transformedPasskeys);
            
            // Show success toast only on manual refresh (not initial load)
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
        const passkeyToDelete = passkeys.find(p => p.id === passkeyId);
        setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
        
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
        const newPasskey = {
            id: Date.now().toString(),
            ...passkeyData,
            created: new Date().toLocaleDateString(),
            lastUsed: 'Never',
            attestationLevel: 'attested'
        };
        setPasskeys(prev => [...prev, newPasskey]);
        setShowAddModal(false);
        setPendingAction(null);
        
        if (onShowToast) {
            onShowToast({
                title: 'Passkey created',
                message: `"${newPasskey.name}" has been successfully created.`,
                variant: 'success'
            });
        }
    };

    const handleSaveEditedPasskey = (updatedPasskey) => {
        setPasskeys(prev => prev.map(p => 
            p.id === updatedPasskey.id ? updatedPasskey : p
        ));
        setShowEditModal(false);
        setEditingPasskey(null);
        setPendingAction(null);
        
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

export default PasskeysSection;
