import React from 'react';
import SecurityPage from './SecurityPage';
import '../styles/App.css';

// Export the main component (keeping the same export name for compatibility)
export const IdTokenData = (props) => {
    return <SecurityPage idTokenClaims={props.idTokenClaims} />;
};

// Re-export all the individual components for potential reuse
export { default as SecurityPage } from './SecurityPage';
export { default as PasskeysSection } from './passkeys/PasskeysSection';
export { PasskeysHeader, PasskeysList, PasskeyItem } from './passkeys/PasskeyComponents';
export { default as PasswordSection } from './password/PasswordSection';
export { default as IdentityVerificationModal } from './modals/IdentityVerificationModal';
export { AddPasskeyModal, EditPasskeyModal } from './modals/PasskeyModals';
export { default as ToastNotifications } from './common/ToastNotifications';
export { SecurityAlert, SecurityPageHeader, UserProfileHeader } from './common/UIComponents';
export { default as GraphApiService } from '../services/GraphApiService';
