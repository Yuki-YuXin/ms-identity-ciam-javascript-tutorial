# Component Architecture

This document outlines the refactored component architecture for the Security/Passkeys management application.

## Overview

The original `DataDisplay.jsx` file contained all components in a single large file (~1000+ lines). It has been refactored into smaller, focused, and decoupled components organized by functionality.

## Directory Structure

```
src/
├── services/
│   └── GraphApiService.js          # Microsoft Graph API integration
├── components/
│   ├── DataDisplay.jsx             # Main export (backwards compatibility)
│   ├── SecurityPage.jsx            # Main security page component
│   ├── common/
│   │   ├── index.js               # Barrel exports
│   │   ├── ToastNotifications.jsx # Toast notification system
│   │   └── UIComponents.jsx       # Shared UI components
│   ├── modals/
│   │   ├── index.js               # Barrel exports
│   │   ├── IdentityVerificationModal.jsx
│   │   └── PasskeyModals.jsx      # Add/Edit passkey modals
│   ├── passkeys/
│   │   ├── index.js               # Barrel exports
│   │   ├── PasskeyComponents.jsx  # Presentational components
│   │   └── PasskeysSection.jsx    # Container component
│   └── password/
│       ├── index.js               # Barrel exports
│       └── PasswordSection.jsx    # Password management
```

## Component Breakdown

### Service Layer
- **GraphApiService**: Handles Microsoft Graph API calls and data transformation

### Common Components
- **ToastNotifications**: Reusable toast notification system
- **UIComponents**: Shared presentational components (headers, alerts)

### Modal Components
- **IdentityVerificationModal**: Multi-step identity verification flow
- **AddPasskeyModal**: Two-step passkey creation flow
- **EditPasskeyModal**: Simple passkey renaming

### Passkey Components
- **PasskeyItem**: Individual passkey display (presentational)
- **PasskeysList**: List of passkeys with states (presentational)  
- **PasskeysHeader**: Header with add button and refresh (presentational)
- **PasskeysSection**: Main container with business logic

### Password Components
- **PasswordSection**: Password change functionality with verification

### Main Components
- **SecurityPage**: Main page orchestrating all sections
- **DataDisplay**: Backward compatibility wrapper

## Design Principles

### 1. Separation of Concerns
- **Services**: API calls and data transformation
- **Presentational Components**: Pure UI components, no side effects
- **Container Components**: Business logic, state management, API integration

### 2. Component Composition
- Small, focused components that do one thing well
- Components can be easily composed together
- Clear props interface between components

### 3. Reusability
- Common components can be reused across the application
- Modal components are generic and configurable
- Service layer can be used by any component

### 4. Testability
- Small components are easier to unit test
- Business logic is separated from presentation
- Mock services can be easily provided

### 5. Maintainability
- Each file has a single responsibility
- Related components are grouped in directories
- Clear naming conventions and exports

## Usage Examples

### Importing Individual Components
```javascript
import { PasskeysSection } from './passkeys';
import { ToastNotifications } from './common';
import { AddPasskeyModal } from './modals';
```

### Using the Main Component (Backward Compatibility)
```javascript
import { IdTokenData } from './DataDisplay';

// Works exactly as before
<IdTokenData idTokenClaims={claims} />
```

### Using Individual Components
```javascript
import SecurityPage from './SecurityPage';
import { PasskeysSection } from './passkeys';

// Use the main component
<SecurityPage idTokenClaims={claims} />

// Or use individual sections
<PasskeysSection 
  onShowToast={showToast}
  accessToken={token}
  userId={userId}
/>
```

## Benefits of This Architecture

1. **Modularity**: Each component has a clear, single responsibility
2. **Reusability**: Components can be used independently or composed
3. **Testability**: Smaller components are easier to unit test
4. **Maintainability**: Changes to one feature don't affect others
5. **Developer Experience**: Easier to find and modify specific functionality
6. **Performance**: Potential for better code splitting and lazy loading
7. **Scalability**: Easy to add new features without affecting existing code

## Migration Notes

The refactoring maintains full backward compatibility. The original `DataDisplay.jsx` export (`IdTokenData`) works exactly as before, but now internally uses the new component architecture.

All original functionality has been preserved:
- MSAL integration and token handling
- Microsoft Graph API integration (with mock data)
- Toast notifications
- Modal workflows
- Passkey CRUD operations
- Password management
- Identity verification flow

## Future Improvements

1. **State Management**: Consider using React Context or Redux for global state
2. **Error Boundaries**: Add error boundaries around major sections
3. **Loading States**: Implement skeleton screens for better UX
4. **Accessibility**: Add ARIA labels and keyboard navigation
5. **Performance**: Implement React.memo for pure components
6. **Testing**: Add comprehensive unit and integration tests
