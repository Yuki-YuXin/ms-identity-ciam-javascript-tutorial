import { registerUserPasskey, deleteUserPasskey } from '../../services/PasskeyService';
import { createToastMessages } from '../../utils/passkeyUtils';
import { useAuthentication } from './useAuthentication';

const GRAPH_API_PROPAGATION_DELAY = 2000;

/**
 * Hook for managing passkey operations (add/delete)
 * @param {Object} params - Hook parameters
 * @param {string} params.appToken - Authentication token
 * @param {string} params.userId - User ID
 * @param {string} params.ngcmfaExpiry - NGCMFA token expiry
 * @param {Function} params.onShowToast - Toast notification function
 * @param {Function} params.fetchPasskeys - Function to refresh passkey list
 * @param {Array} params.currentPasskeys - Current passkeys array for count
 * @returns {Object} Operation handlers
 */
export const usePasskeyOperations = ({ 
    appToken, 
    userId, 
    ngcmfaExpiry, 
    onShowToast, 
    fetchPasskeys,
    currentPasskeys 
}) => {
    const { isTokenExpired, handleReAuthentication, cacheOperation } = useAuthentication({ onShowToast });

    const performAddPasskey = async () => {
        const currentCount = currentPasskeys.length;
        
        try {
            console.log('Performing passkey addition...');

            await registerUserPasskey(appToken, userId);
            console.log(`Passkey added successfully!`);
            
            // Show immediate success toast
            if (onShowToast) {
                onShowToast(createToastMessages.passkeyAdded());
            }
            
            console.log('Waiting for Microsoft Graph API to propagate changes...');
            await new Promise(resolve => setTimeout(resolve, GRAPH_API_PROPAGATION_DELAY));
            
            const updatedPasskeys = await fetchPasskeys({
                type: 'add',
                expectedCount: currentCount + 1
            }, {
                setLoadingState: true,
                showToast: true
            });

            console.log(`Passkey addition flow completed. Final count: ${updatedPasskeys?.length || 'unknown'}`);
        } catch (err) {
            console.error('Error adding passkey:', err);
            if (onShowToast) {
                onShowToast(createToastMessages.errorAdding(err.message));
            }
        }
    };

    const handleAddPasskey = async () => {
        if (isTokenExpired(ngcmfaExpiry)) {
            console.log('NGCMFA token expired, caching operation and showing identity verification popup...');
            
            const addOperation = { action: 'add' };
            cacheOperation(addOperation);

            console.log('Add operation cached in sessionStorage');
            await handleReAuthentication();
            return;
        }

        console.log('NGCMFA token is valid, proceeding with passkey addition...');
        await performAddPasskey();
    };

    const performDelete = async (passkeyId, cachedPasskeyName) => {
        const passkeyToDelete = currentPasskeys.find(p => p.id === passkeyId);
        console.log(`Deleting passkey with ID: ${passkeyId}`);
        const passkeyDisplayName = passkeyToDelete ? passkeyToDelete.name : cachedPasskeyName;
        
        try {
            await deleteUserPasskey(appToken, userId, passkeyId);
            console.log(`Passkey deleted. Expecting passkey ${passkeyId} to be removed from list.`);
            
            const updatedPasskeys = await fetchPasskeys({
                type: 'delete',
                passkeyId: passkeyId
            }, {
                setLoadingState: true,
                showToast: true
            });

            if (onShowToast && updatedPasskeys !== null) {
                onShowToast(createToastMessages.passkeyDeleted(passkeyDisplayName || 'Unknown'));
            }
        } catch (err) {
            console.error('Error deleting passkey:', err);
            if (onShowToast) {
                onShowToast(createToastMessages.errorDeleting(err.message));
            }
        }
    };

    return {
        handleAddPasskey,
        performAddPasskey,
        performDelete
    };
};
