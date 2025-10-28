import { getPasskeyCreationOptions, registerUserPasskey } from '../../services/PasskeyService';
import { createToastMessages } from '../../utils/passkeyUtils';
import { useAuthentication } from './useAuthentication';

const GRAPH_API_PROPAGATION_DELAY = 2000;

export const usePasskeyAddOperation = ({ 
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
            if (!appToken || !userId) {
                throw new Error('Missing appToken or userId');
            }

            const creationOptions = await getPasskeyCreationOptions(appToken, userId);
            if (onShowToast && creationOptions.excludeCredentials.length > 0) {
                onShowToast(createToastMessages.duplicateRegistrationWarning());
                console.warn('To avoid registration failure, please use a different security key or phone than previously used.');
            }
            await registerUserPasskey(creationOptions, appToken, userId);
            
            if (onShowToast) {
                onShowToast(createToastMessages.passkeyAdded());
            }
            
            await new Promise(resolve => setTimeout(resolve, GRAPH_API_PROPAGATION_DELAY));
            
            await fetchPasskeys({
                type: 'add',
                expectedCount: currentCount + 1
            }, {
                setLoadingState: true,
                showToast: true
            });

        } catch (err) {
            if (onShowToast) {
                onShowToast(createToastMessages.errorAdding(err.message));
            }
        }
    };

    const handleAddPasskey = async () => {
        if (isTokenExpired(ngcmfaExpiry)) {
            const addOperation = { action: 'add' };
            cacheOperation(addOperation);
            await handleReAuthentication();
            return;
        }

        await performAddPasskey();
    };

    return {
        handleAddPasskey,
        performAddPasskey
    };
};
