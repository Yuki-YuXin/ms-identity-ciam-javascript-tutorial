import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { useMsal } from '@azure/msal-react';
import { tokenRequest } from '../authConfig';

// Import the separated components
import { UserProfileHeader, SecurityAlert } from './common/UIComponents';
import ToastNotifications from './common/ToastNotifications';
import PasskeysSection from './passkeys/PasskeysSection';
import PasswordSection from './password/PasswordSection';

// SecurityPage component with MSAL integration and Graph API
const SecurityPage = ({ idTokenClaims }) => {
    const { instance, accounts } = useMsal();
    const [accessToken, setAccessToken] = useState(null);
    const [tokenClaims, setTokenClaims] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);

    // Function to decode JWT token
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    };

    // Fetch access token on component mount
    useEffect(() => {
        const getAccessToken = async () => {
            if (accounts.length > 0) {
                try {
                    const request = {
                        ...tokenRequest,
                        account: accounts[0],
                    };

                    // Try to get token silently first
                    const response = await instance.acquireTokenSilent(request);
                    setAccessToken(response.accessToken);
                    
                    // Decode the access token to show claims
                    const decodedToken = parseJwt(response.accessToken);
                    setTokenClaims(decodedToken);
                    setLoading(false);
                } catch (error) {
                    console.error('Error acquiring access token:', error);
                    setError('Failed to acquire access token. This might be because the token is not available or has expired.');
                    setLoading(false);
                }
            } else {
                setError('No account found');
                setLoading(false);
            }
        };

        getAccessToken();
    }, [instance, accounts]);

    // Extract user ID from token claims
    const getUserId = () => {
        // Debug: Log available claims
        console.log('TokenClaims:', tokenClaims);
        console.log('IdTokenClaims:', idTokenClaims);

        // If we have token claims, extract user ID (oid)
        if (tokenClaims && tokenClaims.oid) {
            console.log('Using tokenClaims for user ID:', tokenClaims.oid);
            return tokenClaims.oid;
        }

        // If we have idTokenClaims as fallback
        if (idTokenClaims && idTokenClaims.oid) {
            console.log('Using idTokenClaims for user ID:', idTokenClaims.oid);
            return idTokenClaims.oid;
        }

        // Fallback: try other possible user identifier claims
        if (tokenClaims) {
            const fallbackId = tokenClaims.sub || tokenClaims.unique_name;
            if (fallbackId) {
                console.log('Using fallback user ID from tokenClaims:', fallbackId);
                return fallbackId;
            }
        }

        if (idTokenClaims) {
            const fallbackId = idTokenClaims.sub || idTokenClaims.unique_name;
            if (fallbackId) {
                console.log('Using fallback user ID from idTokenClaims:', fallbackId);
                return fallbackId;
            }
        }

        console.warn('No user ID found in token claims');
        return null;
    };

    // Extract user data from token claims
    const getUserData = () => {
        // Default fallback data
        const defaultUserData = {
            name: "User",
            email: "user@example.com",
        };

        // Debug: Log available claims
        console.log('TokenClaims:', tokenClaims);
        console.log('IdTokenClaims:', idTokenClaims);

        // If we have token claims, extract user information
        if (tokenClaims) {
            console.log('Using tokenClaims for user data');
            return {
                name: tokenClaims.name || tokenClaims.given_name || tokenClaims.family_name || defaultUserData.name,
                email: tokenClaims.unique_name || tokenClaims.email || tokenClaims.preferred_username || tokenClaims.upn || tokenClaims.unique_name || defaultUserData.email,
            };
        }

        // If we have idTokenClaims as fallback
        if (idTokenClaims) {
            console.log('Using idTokenClaims for user data');
            return {
                name: idTokenClaims.name || idTokenClaims.given_name || idTokenClaims.family_name || defaultUserData.name,
                email: idTokenClaims.unique_name || idTokenClaims.email || idTokenClaims.preferred_username || idTokenClaims.upn || idTokenClaims.unique_name || defaultUserData.email,
            };
        }

        console.log('Using default user data');
        return defaultUserData;
    };

    // Only get user data and ID after token is loaded
    const userData = !loading && !error ? getUserData() : { name: "Loading...", email: "Loading..." };
    const userId = !loading && !error ? getUserId() : null;

    const alerts = [
        {
            id: 1,
            message: "For your security, multi-factor authentication is required when managing your credentials",
            type: "info",
            icon: FaBell
        }
    ];

    // Function to show toast notifications
    const showToast = (toastData) => {
        const newToast = {
            id: Date.now(),
            show: true,
            ...toastData
        };
        setToasts(prev => [...prev, newToast]);
    };

    // Function to close toast notifications
    const closeToast = (toastId) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
    };

    // Show loading spinner while fetching token
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

    // Show error if token fetch failed
    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                </Alert>
            </Container>
        );
    }

    // Show error if no user ID could be extracted
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

            <PasswordSection onShowToast={showToast} />
            <PasskeysSection 
                onShowToast={showToast} 
                accessToken={accessToken}
                userId={userId}
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
