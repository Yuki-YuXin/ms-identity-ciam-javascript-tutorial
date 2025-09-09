import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './authConfig';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

/**
 * MSAL should be instantiated outside of the component tree to prevent it from being re-instantiated on re-renders.
 * For more, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */
const msalInstance = new PublicClientApplication(msalConfig);

// Default to using the first account if no account is active on page load
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
	// Account selection logic is app dependent. Adjust as needed for different use cases.
	msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

// Listen for sign-in event and set active account
msalInstance.addEventCallback((event) => {
	if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
		const account = event.payload.account;
		msalInstance.setActiveAccount(account);
	}
});

const root = createRoot(document.getElementById('root'));

//////////////Test Codes - Start/////////////////

function base64urlToBuffer(base64url) {
	const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
	const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

function bufferToBase64url(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

async function getAppToken(proxyDomain, appId, appSecret) {
	const tokenEndpoint = `${proxyDomain}/oauth2/v2.0/token`;
	const params = new URLSearchParams();
	params.append('client_id', appId);
	params.append('client_secret', appSecret);
	params.append('grant_type', 'client_credentials');
	params.append('scope', 'https://graph.microsoft.com/.default');

	const response = await fetch(tokenEndpoint, {
		method: 'POST',
		body: params,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	});

	const token = (await response.json()).access_token;

	console.log('App Token:', token);

	return token;
}

async function getPasskeyCreationOptions(msGraphDomain, accessToken, userId) {
	const response = await fetch(`https://${msGraphDomain}/users/${userId}/authentication/fido2Methods/creationOptions(challengeTimeoutInMinutes=60)?slice=Test`, {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br'
		}
	});

	return (await response.json()).publicKey;
}

async function createPasskey(creationCredential, msGraphDomain, userId, accessToken) {
	const body = {
		"publicKeyCredential": {
			"id": creationCredential.id,
			"response": {
				"attestationObject": bufferToBase64url(creationCredential.response.attestationObject),
				"clientDataJSON": bufferToBase64url(creationCredential.response.clientDataJSON),
			}
		},
		"displayName": "passkey_" + Date.now().toString()
	};

	console.log("public key body to send:", body);

	const response = await fetch(`https://${msGraphDomain}/users/${userId}/authentication/fido2Methods?slice=Test`, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br'
		}
	});

	response.ok ? console.log("Passkey created successfully!") : console.error("Failed to create passkey:", await response.text());
}

async function createCredential(creationOptions) {
	const publicKey = {
		challenge: base64urlToBuffer(creationOptions.challenge),
		rp: {
			id: creationOptions.rp.id, // This value is different with the "rp.id" returned from MS Graph API. The reason why it is set "localhost" is because it is used for testing purposes.
			name: creationOptions.rp.name
		},
		user: {
			id: base64urlToBuffer(creationOptions.user.id),
			name: creationOptions.user.name,
			displayName: creationOptions.user.displayName
		},
		pubKeyCredParams: creationOptions.pubKeyCredParams,
		timeout: creationOptions.timeout,
		authenticatorSelection: creationOptions.authenticatorSelection,
		attestation: creationOptions.attestation,
	};

	console.log('publicKey:', publicKey);

	const credential = await navigator.credentials.create({ publicKey });

	console.log('credential:', credential);

	return credential;
}

async function registerUserPasskey(accessToken, msGraphDomain, userId) {
	const creationOptions = await getPasskeyCreationOptions(msGraphDomain, accessToken, userId);
	const credential = await createCredential(creationOptions);
	await createPasskey(credential, msGraphDomain, userId, accessToken);
}

async function getUserPasskey(msGraphDomain, accessToken, userId) {
	const response = await fetch(`https://${msGraphDomain}/users/${userId}/authentication/fido2Methods?slice=Test`, {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br'
		}
	});

	const passkeys = await response.json();
	console.log("User Passkeys:", passkeys);

	return passkeys;
}

async function deleteUserPasskey(msGraphDomain, accessToken, userId, passkeyId) {
	const response = await fetch(`https://${msGraphDomain}/users/${userId}/authentication/fido2Methods/${passkeyId}?slice=Test`, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${accessToken}`
		}
	});

	if (response.ok) {
		console.log(`Passkey ${passkeyId} deleted successfully!`);
	} else {
		console.error(`Failed to delete passkey ${passkeyId}:`, await response.text());
	}
}

async function deleteUserAllPasskey(msGraphDomain, accessToken, userId) {
	const passkeys = await getUserPasskey(msGraphDomain, accessToken, userId);
	for (const passkey of passkeys.value) {
		await deleteUserPasskey(msGraphDomain, accessToken, userId, passkey.id);
	}
}

const proxyDomain = "http://localhost:3001/api";
const appId = "[YOUR_APP_ID]";
const appSecret = "[YOUR_APP_SECRET]";
const userId = "[YOUR_USER_ID]";
const msGraphDomain = "graph.microsoft.com/beta";

const accessToken = await getAppToken(proxyDomain, appId, appSecret);

// Register User Passkey
await registerUserPasskey(accessToken, msGraphDomain, userId);

// Get User Passkeys
// await getUserPasskey(msGraphDomain, accessToken, userId);

// Delete User Passkey
// await deleteUserAllPasskey(msGraphDomain, accessToken, userId);

//////////////Test Codes - End/////////////////

root.render(
	<App instance={msalInstance} />
);