# Microsoft Identity Platform - React SPA with Passkeys

This is a React Single Page Application (SPA) that demonstrates authentication with Microsoft Identity Platform and passkey management using Microsoft Graph API.

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher) - Required for React 18 and react-scripts 5
- npm or yarn package manager
- Windows Administrator access (required for hosts file modification)
- OpenSSL or similar tool for SSL certificate generation
- Microsoft Entra ID (Azure AD) tenant with CIAM configuration (allowlist)
- User account with MFA enforcement
- Yubikey supported FIDO2
- Client application registered under CIAM tenant with UserAuthenticationMethod.ReadWrite.All application permissions granted by admin

### 1. Install Dependencies

```bash
npm install
```

### 2. Windows Domain Setup (Required for Passkey rp.id Compliance)

**⚠️ Critical for Passkeys**: WebAuthn requires the `rp.id` (Relying Party ID) to match the domain where passkey creation occurs. This setup ensures proper domain matching.

#### Step 2.1: Update Windows Hosts File

1. **Open Command Prompt as Administrator**:
   - Press `Win + R`, type `cmd`
   - Press `Ctrl + Shift + Enter` (opens as admin)

2. **Edit the hosts file**:
   ```cmd
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. **Add domain mapping** (replace with your actual CIAM domain, locally we need to use subdomain):
   ```
   127.0.0.1    your-subdomain
   ```

4. **Save and close** the file

#### Step 2.2: Generate SSL Certificate for Proper Domain

1. **Install OpenSSL** (if not already installed):
   - Download from: https://slproweb.com/products/Win32OpenSSL.html
   - Or use Git Bash if you have Git installed

2. **Open PowerShell as Administrator**:
   - Press `Win + X`, select "Windows PowerShell (Admin)"
   - Or right-click Start button → "Windows PowerShell (Admin)"

3. **Generate certificate for your domain**:
   ```powershell
   # Navigate to your project directory
   cd "C:\path\to\your\project\1-sign-in-react\SPA"

   # Step 1: Create the certificate (replace with your actual CIAM domain)
   New-SelfSignedCertificate -DnsName "your-subdomain" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "authCiamCert"

   # Step 2: Set password for certificate export
   $pwd = ConvertTo-SecureString -String 'your-password' -Force -AsPlainText

   # Step 3: Get the certificate from the store
   $cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object { $_.Subject -eq "CN=your-subdomain" }

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

#### Step 2.3: Configuration Setup

**Environment Configuration (.env file):**

Update your `.env` file with the development server configuration:

```env
# SSL Configuration for HTTPS
HTTPS=true
HOST=your-subdomain
PORT=3000
SSL_CRT_FILE=./auth-cert.pem
SSL_KEY_FILE=./auth-key.pem
```

**Application Configuration (authConfig.js):**

The React app authentication configuration is now centralized in `src/authConfig.js`. Update the `appConfig` object with your values:

```javascript
export const appConfig = {
    proxyDomain: 'http://localhost:3001/api',
    appId: 'your-client-id',
    appSecret: 'your-client-secret',
    tenantId: 'your-tenant-id',
};
```

**Important**: 
- Replace `your-subdomain` with your actual CIAM domain or subdomain
- The `HOST` value must exactly match your CIAM domain or subdomain for `rp.id` compliance
- Update the values in `authConfig.js` with your actual Azure AD/CIAM configuration

### 3. Start the Application

You need to run both the CORS proxy server and the React application:

#### Terminal 1 - Start CORS Proxy Server
```bash
npm run cors
```
This starts the proxy server on `http://localhost:3001` for handling Microsoft Graph API requests.

#### Terminal 2 - Start React Application
```bash
npm start
```
This starts the React development server on `https://<your-subdomain>:3000`.

### 4. Access the Application

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

For production deployment, consider using [Set up a reverse proxy for a single-page app using Azure Function App](https://docs.microsoft.com/en-us/azure/static-web-apps/add-api) instead of the local CORS proxy.

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
src/
├── components/
│   ├── common/          # Shared UI components and utilities
│   ├── passkeys/        # Passkey-specific components
│   └── modals/          # Modal dialogs
├── services/            # API service layer
├── utils/               # Utility functions
├── styles/              # CSS stylesheets
└── authConfig.js        # MSAL configuration
```

### Key Components
- **SecurityPage** - Main page container with token management
- **PasskeysSection** - Passkey management with self-contained authentication
- **NavigationBar** - App navigation with sign-in/out functionality
- **ToastNotifications** - User feedback system

## 📚 Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Microsoft Graph API fido2AuthenticationMethod](https://learn.microsoft.com/en-gb/graph/api/resources/fido2authenticationmethod?view=graph-rest-beta)
- [WebAuthn/FIDO2 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/authentication/concept-authentication-passwordless)
- [Set up a reverse proxy for a single-page app using Azure Function App](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-native-authentication-cors-solution-test-environment)
