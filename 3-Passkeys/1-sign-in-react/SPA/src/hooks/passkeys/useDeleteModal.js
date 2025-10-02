import { useState } from 'react';
import { useAuthentication } from './useAuthentication';

/**
 * Hook for managing delete confirmation modal state and actions
 * @param {Object} params - Hook parameters
 * @param {string} params.ngcmfaExpiry - NGCMFA token expiry
 * @param {Function} params.onShowToast - Toast notification function
 * @param {Function} params.performDelete - Function to perform actual deletion
 * @returns {Object} Modal state and handlers
 */
export const useDeleteModal = ({ ngcmfaExpiry, onShowToast, performDelete }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passkeyToDelete, setPasskeyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { isTokenExpired, handleReAuthentication, cacheOperation } = useAuthentication({ onShowToast });

    const initiate = (passkeyId, passkeyName, passkey) => {
        setPasskeyToDelete({ id: passkeyId, name: passkeyName, ...passkey });
        setShowDeleteModal(true);
    };

    const confirm = async () => {
        if (!passkeyToDelete) return;

        const { id: passkeyId, name: passkeyName } = passkeyToDelete;

        if (isTokenExpired(ngcmfaExpiry)) {
            console.log('NGCMFA token expired, triggering re-authentication...');
            hide();

            const deleteOperation = { 
                action: 'delete', 
                passkeyId: passkeyId,
                passkeyName: passkeyName
            };
            cacheOperation(deleteOperation);
            console.log('Delete operation cached with passkeyId:', passkeyId);

            await handleReAuthentication();
            return;
        }

        console.log('NGCMFA token is valid, proceeding with passkey deletion...');
        
        // Immediately hide modal and let main list handle loading state
        hide();
        
        try {
            await performDelete(passkeyId, passkeyName);
        } catch (error) {
            console.error('Delete operation failed:', error);
        }
    };

    const hide = () => {
        setShowDeleteModal(false);
        setPasskeyToDelete(null);
        setIsDeleting(false);
    };

    return {
        initiate,
        props: {
            show: showDeleteModal,
            passkey: passkeyToDelete,
            onConfirm: confirm,
            onCancel: hide,
            isDeleting
        }
    };
};
