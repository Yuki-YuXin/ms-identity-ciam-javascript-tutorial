import { useState, useEffect, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { useMsal } from '@azure/msal-react';
import { PasskeysHeader, PasskeysList } from './PasskeyComponents';
import { fetchUserPasskey, registerUserPasskey,  deleteUserPasskey } from '../../services/GraphApiService';
import { clearAppTokenCache } from '../../utils/tokenUtils';
import { loginRequest } from '../../authConfig';
import { 
    PASSKEY_CONSTANTS, 
    createRetryDelay, 
    createFetchDelay, 
    checkNgcmfaExpiration, 
    createToastMessages 
} from '../../utils/passkeyUtils';

const PasskeysSection = ({ onShowToast, appToken, userId, ngcmfaExpiry }) => {
    const { instance } = useMsal();
    const [passkeys, setPasskeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const maxPasskeys = PASSKEY_CONSTANTS.MAX_PASSKEYS;

    const fetchPasskeys = useCallback(async (expectedChange = null, options = {}) => {
        const { 
            maxRetries = expectedChange ? PASSKEY_CONSTANTS.MAX_RETRIES : 1,
            showToast = false,
            setLoadingState = true 
        } = options;

        if (!appToken || !userId) {
            setError('Access token or user ID not available');
            if (setLoadingState) setIsLoading(false);
            return;
        }

        let lastError;
        
        if (setLoadingState) {
            setIsLoading(true);
            setError(null);
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (maxRetries > 1) {
                    console.log(`Fetch attempt ${attempt}/${maxRetries}...`);
                }
                
                const transformedPasskeys = await fetchUserPasskey(appToken, userId);
                console.log(`Found ${transformedPasskeys.length} passkeys${maxRetries > 1 ? ` on attempt ${attempt}` : ''}`);
                
                if (expectedChange) {
                    const { type, passkeyId, expectedCount } = expectedChange;
                    
                    if (type === 'add' && expectedCount && transformedPasskeys.length < expectedCount) {
                        console.log(`Expected ${expectedCount} passkeys after add, but got ${transformedPasskeys.length}. Retrying...`);
                        if (attempt < maxRetries) {
                            await createRetryDelay(attempt);
                            continue;
                        }
                    }
                    
                    if (type === 'delete' && passkeyId && transformedPasskeys.some(p => p.id === passkeyId)) {
                        console.log(`Passkey ${passkeyId} still exists after delete. Retrying...`);
                        if (attempt < maxRetries) {
                            await createRetryDelay(attempt);
                            continue;
                        }
                    }
                }
                
                setPasskeys(transformedPasskeys);
                console.log(`Successfully updated passkey list with ${transformedPasskeys.length} items`);
                
                if (setLoadingState) {
                    setIsLoading(false);
                }
                
                if (showToast && passkeys.length > 0 && onShowToast) {
                    onShowToast(createToastMessages.passkeysRefreshed(transformedPasskeys.length));
                }
                
                return transformedPasskeys;
                
            } catch (error) {
                lastError = error;
                if (maxRetries > 1) {
                    console.warn(`Fetch attempt ${attempt} failed:`, error);
                } else {
                    console.error('Error fetching FIDO2 methods:', error);
                }
                
                if (attempt < maxRetries) {
                    await createFetchDelay(attempt);
                }
            }
        }
        
        const errorMsg = `Failed to load passkeys: ${lastError?.message || 'Unknown error'}`;
        setError(errorMsg);
        
        if (onShowToast) {
            onShowToast(createToastMessages.errorLoading());
        }
        
        if (setLoadingState) {
            setIsLoading(false);
        }
        
        if (expectedChange) {
            throw lastError || new Error('Max retries exceeded');
        }
        
        return null;
    }, [appToken, userId]);

    const handleSignIn = async () => {
        try {
            console.log('User clicked Re-sign in - proceeding with logout redirect...');
            console.log('(Operation already cached when popup was shown)');
            
            if (onShowToast) {
                onShowToast({
                    title: 'Redirecting...',
                    message: 'Signing out and redirecting to sign-in page...',
                    variant: 'info',
                    autoHide: true
                });
            }

            const account = instance.getAllAccounts()[0];
            clearAppTokenCache(instance);
            await instance.loginRedirect({
                ...loginRequest,
                loginHint: account.username
            });
        } catch (error) {
            console.error('Sign-in redirect failed:', error);
            if (onShowToast) {
                onShowToast({
                    title: 'Authentication error',
                    message: 'Failed to redirect to sign-in page. Please try again.',
                    variant: 'danger'
                });
            }
        }
    };

    const handleReAuthentication = async () => {
        try {
            if (onShowToast) {
                console.log('Showing enhanced session expired toast with sign-in action...');
                onShowToast(createToastMessages.sessionExpiredWithAction(handleSignIn));
            }
        } catch (error) {
            console.error('Error during re-authentication setup:', error);
            if (onShowToast) {
                onShowToast(createToastMessages.authError());
            }
        }
    };

    const performAddPasskey = async () => {
        console.log('Performing passkey addition...');

        const currentCount = passkeys.length;
        
        try {
            setIsLoading(true);
            setError(null);

            await registerUserPasskey(appToken, userId);
            console.log(`Passkey added. Expecting list to grow from ${currentCount} to ${currentCount + 1}`);
            
            console.log('Waiting for Microsoft Graph API to propagate changes...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const updatedPasskeys = await fetchPasskeys({
                type: 'add',
                expectedCount: currentCount + 1
            }, {
                setLoadingState: false
            });

            if (onShowToast && updatedPasskeys) {
                onShowToast(createToastMessages.passkeyAdded());
            }
        } catch (err) {
            console.error('Error adding passkey:', err);
            if (onShowToast) {
                onShowToast(createToastMessages.errorAdding(err.message));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPasskey = async () => {
        if (checkNgcmfaExpiration(ngcmfaExpiry)) {
            console.log('NGCMFA token expired, caching operation and showing identity verification popup...');
            setIsLoading(false);
            setError(null);
            
            // Use same structure as delete for consistency
            const addOperation = { action: 'add' };
            sessionStorage.setItem("postLoginAction", JSON.stringify(addOperation));

            console.log('Add operation cached in sessionStorage');
            await handleReAuthentication();
            return;
        }

        console.log('NGCMFA token is valid, proceeding with passkey addition...');
        await performAddPasskey();
    };

    const performDelete = async (passkeyId, cachedPasskeyName) => {
        const passkeyToDelete = passkeys.find(p => p.id === passkeyId);
        console.log(`Deleting passkey with ID: ${passkeyId}`);
        const passkeyDisplayName = passkeyToDelete ? passkeyToDelete.name : cachedPasskeyName;
        
        try {
            setIsLoading(true);
            setError(null);

            await deleteUserPasskey(appToken, userId, passkeyId);
            console.log(`Passkey deleted. Expecting passkey ${passkeyId} to be removed from list.`);
            
            const updatedPasskeys = await fetchPasskeys({
                type: 'delete',
                passkeyId: passkeyId
            }, {
                setLoadingState: false
            });

            if (onShowToast && updatedPasskeys !== null) {
                onShowToast(createToastMessages.passkeyDeleted(passkeyDisplayName || 'Unknown'));
            }
        } catch (err) {
            console.error('Error deleting FIDO2 methods:', err);
            if (onShowToast) {
                onShowToast(createToastMessages.errorDeleting(err.message));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePasskey = async (passkeyId, passkeyName) => {
        if (checkNgcmfaExpiration(ngcmfaExpiry)) {
            console.log('NGCMFA token expired, triggering re-authentication...');
            setIsLoading(false);
            setError(null);

            // Cache both action and passkeyId
            const deleteOperation = { 
                action: 'delete', 
                passkeyId: passkeyId,
                passkeyName: passkeyName
            };
            sessionStorage.setItem("postLoginAction", JSON.stringify(deleteOperation));
            console.log('Delete operation cached with passkeyId:', passkeyId);

            await handleReAuthentication();
            return;
        }

        console.log('NGCMFA token is valid, proceeding with passkey deletion...');
        await performDelete(passkeyId);
    };


    useEffect(() => {
        console.log('useEffect - Loading passkeys...');
        fetchPasskeys().catch(error => {
            console.error('Error in useEffect fetchPasskeys:', error);
        });
    }, [fetchPasskeys]);

    useEffect(() => {
        instance.handleRedirectPromise()
            .then((response) => {
                if (response) {
                    console.log("User authenticated successfully");
                }

                const actionData = sessionStorage.getItem("postLoginAction");
                console.log("Post-login action from sessionStorage:", actionData);
                
                if (actionData) {
                    try {
                        const operation = JSON.parse(actionData);
                        sessionStorage.removeItem("postLoginAction");
                        
                        if (operation.action === "add") {
                            console.log("Resuming ADD operation");
                            performAddPasskey();
                        } else if (operation.action === "delete" && operation.passkeyId) {
                            console.log("Resuming DELETE operation for passkey:", operation.passkeyId);
                            performDelete(operation.passkeyId, operation.passkeyName);
                        }
                    } catch (error) {
                        console.error("Error parsing cached operation:", error);
                        sessionStorage.removeItem("postLoginAction");
                    }
                }
            }).catch((error) => {
                console.error("Login failed:", error);
            });
        }, []);


    return (
        <Card className="mb-4">
            <Card.Body>
                <PasskeysHeader 
                    count={passkeys.length} 
                    maxCount={maxPasskeys}
                    onAddClick={handleAddPasskey}
                    isLoading={isLoading}
                />
                <PasskeysList 
                    passkeys={passkeys} 
                    onDelete={handleDeletePasskey}
                    isLoading={isLoading}
                    error={error}
                />
            </Card.Body>
        </Card>
    );
};

export default PasskeysSection;
