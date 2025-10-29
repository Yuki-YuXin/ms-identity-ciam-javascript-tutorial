# Microsoft Identity Platform - React SPA with Passkeys

This is a React Single Page Application (SPA) that demonstrates authentication with Microsoft Identity Platform and passkey management using Microsoft Graph API.

## 🚀 Quick Start

### Prerequisites

#### App Setup

- Node.js (version 20 or higher), npm or yarn package manager - https://nodejs.org/en/download
- Windows Administrator access (required for hosts file modification)
- OpenSSL or similar tool for SSL certificate generation (https://slproweb.com/products/Win32OpenSSL.html)

#### Tenant Setup

- Microsoft Entra ID (Azure AD) tenant with CIAM configuration (allowlist)
- User account with MFA enforcement
- Client application registered under CIAM tenant with UserAuthMethod-Passkey.ReadWrite.All application permissions granted by admin

#### Device

- Yubikey supported FIDO2

## Set Up

The following instruction is to set up this sample app **locally**.

### 1. Windows Domain Setup (Required for Passkey rp.id Compliance)

**⚠️ Critical for Passkeys**: WebAuthn requires the `rp.id` (Relying Party ID) to match the domain or subdomain where passkey creation occurs. This setup ensures proper domain matching.

#### Step 1: Update Windows Hosts File

1. **Open Command Prompt as Administrator**:
   - Press `Win + R`, type `cmd`
   - Press `Ctrl + Shift + Enter` (opens as admin)

2. **Edit the hosts file**:

   ```cmd
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. **Add domain mapping** (replace with your actual CIAM domain, locally we need to use **subdomain** of your ciam tenant domain):

For example, for authority like `<tenant-name>.ciamlogin.com`, locally please update file with subdomain e.g. `auth.<tenant-name>.ciamlogin.com` in order to not impact login flow.

   ```
   127.0.0.1    auth.<tenant-name>.ciamlogin.com
   ```

4. **Save and close** the file

#### Step 2: Generate SSL Certificate for Proper Domain

1. **Install OpenSSL** (if not already installed):
   - Download from: 
   - Or use Git Bash if you have Git installed

2. **Open PowerShell as Administrator**:
   - Press `Win + X`, select "Windows PowerShell (Admin)"
   - Or right-click Start button → "Windows PowerShell (Admin)"

3. **Generate certificate for your domain**:

   ```powershell
   # Navigate to your project directory
   cd "C:\path\to\your\project\1-sign-in-react\SPA"

   # Step 1: Create the certificate (replace with your actual CIAM domain)
   New-SelfSignedCertificate -DnsName "<your-subdomain>" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "authCiamCert"

   # Step 2: Set password for certificate export
   $pwd = ConvertTo-SecureString -String '<your-password>' -Force -AsPlainText

   # Step 3: Get the certificate from the store
   $cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object { $_.Subject -eq "CN=<your-subdomain>" }

   # Step 4: Export certificate to PFX format in the same directory as .env
   Export-PfxCertificate -Cert $cert -FilePath ".\auth-cert.pfx" -Password $pwd
   ```

3. **Convert PFX to PEM format using OpenSSL**:

   ```bash
   # Extract certificate (PEM format)
   openssl pkcs12 -in auth-cert.pfx -out auth-cert.pem -clcerts -nokeys

   # Extract private key (PEM format)
   openssl pkcs12 -in auth-cert.pfx -out auth-key.pem -nocerts -nodes
   ```

4. **Install certificate in Trusted Root Certification Authorities**:

   ```powershell
   # Import PFX certificate to Trusted Root store to avoid browser security warnings
   Import-PfxCertificate -FilePath ".\auth-cert.pfx" -CertStoreLocation "Cert:\LocalMachine\Root" -Password $pwd
   ```

5. **Update certificate file names** to match your `.env` configuration

### 2. Tenant Configuration

#### Step 1: Register Redirect URI in Entra Portal

**⚠️ Critical Step**: You must register your redirect URI in the Entra portal for authentication to work.

**Navigate to App Registration:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations**
3. Select your application registration

**Configure Single Page Application Platform:**
1. In the left sidebar, click **Authentication**
2. Under **Platform configurations**, click **+ Add a platform**
3. Select **Single-page application (SPA)**
4. In the **Redirect URIs** section, add your application URL:
   ```
   https://<your-subdomain>:3000
   ```
   Replace `<your-subdomain>` with your actual subdomain
5. Click **Configure** to save

#### Step 2: Verify Required Permissions

Ensure your app registration has the following Microsoft Graph API permissions:

**Application Permissions (Admin consent required):**
- `UserAuthMethod-Passkey.ReadWrite.All` - Required for passkey management

**Grant Admin Consent:**
1. In your app registration, go to **API permissions**
2. Click **Grant admin consent for [Your Tenant]**
3. Confirm the consent

### 3. Application Configuration

Before running the application, you need to configure your Microsoft Entra ID application registration and update the MSAL configuration.

#### Step 1: Configure MSAL Authentication Settings

Update the `msalConfig.auth` section in `src/authConfig.js` with your application details:

```javascript
export const msalConfig = {
    auth: {
        clientId: "<your-client-id-here>",           // Replace with your Application (client) ID
        authority: "https://<your-tenant-name>.ciamlogin.com/", // Replace with your authority URL
        redirectUri: "<redirect-uri>", // Must match your registered redirect URI in Entra portal
    },
    // ... rest of configuration
};
```

**How to get these values:**

1. **Client ID**: Found in your app registration overview page
2. **Authority**: Your CIAM tenant authority URL in the format `https://{tenant-name}.ciamlogin.com/{tenant-name}.onmicrosoft.com`
3. **Redirect URI**: The URL where users will be redirected after authentication **(must be registered in Entra portal)**

#### Step 2: Environment Configuration (.env file)

Update your `.env` file with the development server configuration:

```env
# SSL Configuration for HTTPS
HTTPS=true
HOST=<your-subdomain>
PORT=3000
SSL_CRT_FILE=./auth-cert.pem # cert file
SSL_KEY_FILE=./auth-key.pem # private key file
```

#### Step 3: Application Configuration (authConfig.js)

The React app authentication configuration is now centralized in `src/authConfig.js`. Update the `appConfig` object with your values:

```javascript
export const appConfig = {
    proxyDomain: 'http://localhost:3001/api',
    appId: 'your-client-id',
    appSecret: 'your-client-secret',
    tenantId: 'your-tenant-id',
    customDomain: '<custom-domain>' // your valid custom domain, if not specify, use tenant subdomain by default
};
```

**SECURITY WARNING**: This configuration is for local development only. Never expose the **appSecret** in production environments. Store secrets securely using:

- Environment variables
- Azure Key Vault
- Other secure secret management systems

### 4. Start the Application

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Start CORS Proxy Server

Open a terminal and run the following command:

```bash
npm run cors
```

This starts the proxy server on `http://localhost:3001` for handling Microsoft Graph API requests.

#### Step 3: Start sample app

```bash
npm start
```

This starts the React development server on `https://<your-subdomain>:3000`.

### 5. Access the Application

Open your browser and navigate to:

```
https://<your-subdomain>:3000
```

**Note**: The application runs on HTTPS with a self-signed certificate. You may need to accept the security warning in your browser.

## 🔧 Configuration Details

### SSL Certificates

The application includes SSL certificates for HTTPS development:

- `auth-cert.pem` - SSL certificate
- `auth-key.pem` - SSL private key

### CORS Proxy

The `cors.js` file provides a proxy server that:

- Handles CORS issues when calling Microsoft Graph API
- Runs on port 3001
- Proxies requests to `https://login.microsoftonline.com/{tenantId}`

For production deployment, consider using [Set up a reverse proxy for a single-page app using Azure Front Door](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-native-authentication-cors-solution-production-environment) instead of the local CORS proxy.

### Authentication Configuration

The app uses Microsoft Authentication Library (MSAL) for:

- User authentication with Microsoft Identity Platform
- Token acquisition for Graph API calls
- Multi-factor authentication (MFA) enforcement for passkey operations

## 🔐 Features

### Authentication

- Sign in/out with Microsoft Identity Platform
- Session management with NGCMFA (Next Generation Credentials Multi-Factor Authentication)

### Passkey Management

- View existing passkeys/FIDO2 credentials
- Add new passkeys
- Delete existing passkeys

### Security Features

- MFA enforcement for passkey operations
- Automatic re-authentication when tokens expire
- Enhanced error handling and user feedback
- Toast notifications for user actions

## 🛠️ Development

### Project Structure

```
SPA/
├── public/                          # Static assets
│   ├── index.html                   # Main HTML template
│   ├── favicon.svg                  # Application icon
│   ├── manifest.json                # PWA manifest
│   └── robots.txt                   # Search engine directives
├── src/
│   ├── components/                  # React components
│   │   ├── common/                  # Shared UI components
│   │   │   ├── index.js             # Component exports
│   │   │   ├── ToastNotifications.jsx  # Toast notification system
│   │   │   └── UIComponents.jsx     # Reusable UI elements
│   │   ├── passkeys/                # Passkey management components
│   │   │   ├── index.js             # Component exports
│   │   │   ├── PasskeysSection.jsx  # Main passkey section
│   │   │   └── components/          # Passkey sub-components
│   │   │       ├── DeleteModal.jsx  # Delete confirmation modal
│   │   │       ├── PasskeyDetails.jsx  # Detailed passkey info
│   │   │       ├── PasskeyItem.jsx  # Individual passkey display
│   │   │       ├── PasskeysHeader.jsx  # Section header with actions
│   │   │       ├── PasskeysList.jsx # Passkey list container
│   │   │       └── utils.js         # Component utility functions
│   │   ├── NavigationBar.jsx        # Top navigation component
│   │   ├── PageLayout.jsx           # Main page layout wrapper
│   │   └── SecurityPage.jsx         # Main security/passkey page
│   ├── hooks/                       # Custom React hooks
│   │   └── passkeys/                # Passkey-specific hooks
│   │       ├── index.js             # Hook exports
│   │       ├── useAuthentication.js # Authentication flow management
│   │       ├── useDeleteModal.js    # Delete modal state management
│   │       ├── usePasskeyAddOperation.js    # Add passkey operations
│   │       ├── usePasskeyDeleteOperation.js # Delete passkey operations
│   │       └── usePasskeyFetcher.js # Passkey data fetching
│   ├── services/                    # API service layer
│   │   ├── GraphApiClient.js        # Microsoft Graph API client
│   │   └── PasskeyService.js        # Passkey-specific API calls
│   ├── utils/                       # Utility functions
│   │   ├── graphServiceUtils.js     # Graph API utilities
│   │   ├── passkeyUtils.js          # Passkey-related utilities
│   │   └── tokenUtils.js            # Token management utilities
│   ├── styles/                      # CSS stylesheets
│   │   ├── App.css                  # Main application styles
│   │   └── index.css                # Global styles
│   ├── App.jsx                      # Root application component
│   ├── authConfig.js                # MSAL and app configuration
│   └── index.js                     # Application entry point
├── auth-cert.pem                    # SSL certificate for HTTPS development
├── auth-key.pem                     # SSL private key
├── cors.js                          # CORS proxy server for development
├── package.json                     # Node.js dependencies and scripts
├── package-lock.json                # Locked dependency versions
└── README.md                        # This documentation file
```

### Architecture Overview

#### **Component Architecture**
- **Modular Design**: Components are organized by feature (passkeys, common UI)
- **Composition Pattern**: Smaller, focused components compose larger features
- **Separation of Concerns**: UI components separated from business logic

#### **Hook-Based State Management**
- **Custom Hooks**: Business logic extracted into reusable hooks
- **Separation of Concerns**: Authentication, data fetching, and operations in dedicated hooks
- **Clean API**: Hooks provide simple interfaces for complex operations

#### **Service Layer**
- **API Abstraction**: Service layer abstracts Microsoft Graph API calls
- **Error Handling**: Centralized error handling and response processing
- **Token Management**: Secure token handling and caching

#### **Utility Functions**
- **Pure Functions**: Stateless utility functions for data processing
- **Reusability**: Common operations shared across components
- **Type Safety**: Robust data validation and transformation
```

## 📚 Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Microsoft Graph API fido2AuthenticationMethod](https://learn.microsoft.com/en-gb/graph/api/resources/fido2authenticationmethod?view=graph-rest-beta)
- [WebAuthn/FIDO2 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/authentication/concept-authentication-passwordless)
- [Set up a reverse proxy for a single-page app using Azure Function App](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-native-authentication-cors-solution-test-environment)
