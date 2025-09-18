import { useState, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { useMsal } from '@azure/msal-react';
import { tokenRequest, appConfig } from '../authConfig';
import { calculateNgcmfaExpiration, getAccessToken, getCachedAppToken } from '../utils/tokenUtils';

import { UserProfileHeader, SecurityAlert } from './common/UIComponents';
import ToastNotifications from './common/ToastNotifications';
import PasskeysSection from './passkeys/PasskeysSection';

const NGCMFA_EXPIRY_MINUTES = 10;
const SECONDS_PER_MINUTE = 60;

export const SecurityPage = () => {
    const { instance, accounts } = useMsal();
    const [accessToken, setAccessToken] = useState(null);
    const [appToken, setAppToken] = useState(null);
    const [ngcmfaExpiration, setNgcmfaExpiration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessTokenError, setAccessTokenError] = useState(null);
    const [appTokenError, setAppTokenError] = useState(null);
    const [toasts, setToasts] = useState([]);


    useEffect(() => {
        console.log('SecurityPage mounted, fetching access token...');
        const fetchAccessToken = async () => {
            try {
                const result = await getAccessToken(instance, accounts, tokenRequest);

                if (result.error) {
                    setAccessTokenError(result.error);
                    setLoading(false);
                } else {
                    setAccessTokenError(null);
                    setAccessToken(result.decodedToken);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Access token fetch failed:', error);
                setAccessTokenError(`Failed to get access token: ${error.message}`);
                setLoading(false);
            }
        };

        fetchAccessToken();
    }, [instance, accounts]);

    useEffect(() => {
        const fetchAppToken = async () => {
            try {
                const token = await getCachedAppToken(
                    instance, 
                    appConfig.proxyDomain, 
                    appConfig.appId, 
                    appConfig.appSecret
                );
                if (token) {
                    setAppTokenError(null);
                    setAppToken(token);
                } else {
                    throw new Error('App token request returned empty result');
                }
            } catch (error) {
                console.error('Failed to fetch app token:', error);
                setAppTokenError(`Failed to get app token: ${error.message}. Passkey functionality may be limited.`);
            }
        };

        fetchAppToken();
    }, [instance]);

    useEffect(() => {
        if (accessToken) {
            const expiration = calculateNgcmfaExpiration(accessToken, NGCMFA_EXPIRY_MINUTES, SECONDS_PER_MINUTE);
            setNgcmfaExpiration(expiration);
            console.log('NGCMFA expiration updated:', expiration);
        } else {
            setNgcmfaExpiration(null);
            console.log('NGCMFA expiration cleared');
        }
    }, [accessToken]);

    const getUserId = () => {
        if (accessToken && accessToken.oid) {
            console.log('Using appToken for user ID:', accessToken.oid);
            return accessToken.oid;
        }

        console.warn('No user ID found in token claims');
        return null;
    };

    const getUserData = () => {
        const defaultUserData = {
            name: "User",
            email: "user@example.com",
        };

        if (accessToken) {
            console.log('Using accessToken for user data');
            return {
                name: accessToken.name || accessToken.given_name || accessToken.family_name || defaultUserData.name,
                email: accessToken.unique_name || accessToken.email || accessToken.preferred_username || accessToken.upn || accessToken.unique_name || defaultUserData.email,
            };
        }

        console.log('Using default user data');
        return defaultUserData;
    };

    const displayError = accessTokenError || appTokenError;
    const userData = !loading && !accessTokenError ? getUserData() : { name: "Loading...", email: "Loading..." };
    const userId = !loading && !accessTokenError ? getUserId() : null;

    const alerts = [
        {
            id: 1,
            message: "For your security, multi-factor authentication is required when managing your credentials",
            type: "info",
            icon: FaBell
        }
    ];

    const showToast = (toastData) => {
        const newToast = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            show: true,
            ...toastData
        };
        setToasts(prev => [...prev, newToast]);
    };

    const closeToast = (toastId) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
    };

    if (loading) {
        return (
            <Container className="py-4">
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        );
    }

    if (displayError) {
        return (
            <Container className="py-4">
                <Alert variant={accessTokenError ? "danger" : "warning"}>
                    <Alert.Heading>
                        {accessTokenError ? "Authentication Error" : "Service Error"}
                    </Alert.Heading>
                    <p>{displayError}</p>
                    {accessTokenError && appTokenError && (
                        <>
                            <hr />
                            <p><strong>Additional issue:</strong> {appTokenError}</p>
                        </>
                    )}
                </Alert>
            </Container>
        );
    }

    if (!userId) {
        return (
            <Container className="py-4">
                <Alert variant="warning">
                    <Alert.Heading>User ID Not Available</Alert.Heading>
                    <p>Unable to extract user ID from token claims. Please try logging in again.</p>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <UserProfileHeader
                name={userData.name}
                email={userData.email}
            />

            {alerts.map(alert => (
                <SecurityAlert
                    key={alert.id}
                    message={alert.message}
                    type={alert.type}
                    icon={alert.icon}
                />
            ))}

            <PasskeysSection
                onShowToast={showToast}
                appToken={appToken}
                userId={userId}
                ngcmfaExpiry={ngcmfaExpiration}
            />

            {/* Toast Notifications */}
            <ToastNotifications
                toasts={toasts}
                onCloseToast={closeToast}
            />
        </Container>
    );
};

export default SecurityPage;
