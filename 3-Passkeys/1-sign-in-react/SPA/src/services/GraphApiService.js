const msGraphDomain = "graph.microsoft.com/beta";

function base64urlToBuffer(base64url) {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

function bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function formatLastUsed(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return "Today";
    } else if (diffInDays === 1) {
        return "1 day ago";
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? "1 month ago" : `${months} months ago`;
    }
}

function transformFido2Methods(graphResponse) {
    if (!graphResponse || !graphResponse.value) {
        return [];
    }
    return graphResponse.value.map((method) => ({
        id: method.id,
        name: method.displayName || "Unnamed Passkey",
        lastUsed: method.lastUsedDateTime
            ? formatLastUsed(method.lastUsedDateTime)
            : "Never",
        created: method.createdDateTime
            ? new Date(method.createdDateTime).toLocaleDateString()
            : "Unknown",
        model: method.model || "Unknown Device",
        attestationLevel: method.attestationLevel || "Unknown",
        aaGuid: method.aaGuid,
        _graphData: method,
    }));
}

async function getPasskeyCreationOptions(appToken, userId) {
    const response = await fetch(
        `https://${msGraphDomain}/users/${userId}/authentication/fido2Methods/creationOptions(challengeTimeoutInMinutes=60)?slice=Test`,
        {
            headers: {
                Authorization: `Bearer ${appToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
            },
        }
    );

    return (await response.json()).publicKey;
}

async function createCredential(creationOptions) {
    const publicKey = {
        challenge: base64urlToBuffer(creationOptions.challenge),
        rp: {
            id: creationOptions.rp.id,
            name: creationOptions.rp.name,
        },
        user: {
            id: base64urlToBuffer(creationOptions.user.id),
            name: creationOptions.user.name,
            displayName: creationOptions.user.displayName,
        },
        pubKeyCredParams: creationOptions.pubKeyCredParams,
        timeout: creationOptions.timeout,
        authenticatorSelection: creationOptions.authenticatorSelection,
        attestation: creationOptions.attestation,
    };

    console.log("Passkey creation options configured");

    const credential = await navigator.credentials.create({ publicKey });

    console.log("Passkey credential created successfully");

    return credential;
}

async function createPasskey(creationCredential, userId, appToken) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueName = `passkey_${timestamp}_${randomSuffix}`;

    const body = {
        publicKeyCredential: {
            id: creationCredential.id,
            response: {
                attestationObject: bufferToBase64url(
                    creationCredential.response.attestationObject
                ),
                clientDataJSON: bufferToBase64url(
                    creationCredential.response.clientDataJSON
                ),
            },
        },
        displayName: uniqueName,
    };

    console.log("Preparing passkey registration request");

    const response = await fetch(
        `https://${msGraphDomain}/users/${userId}/authentication/fido2Methods?slice=Test`,
        {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                Authorization: `Bearer ${appToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
            },
        }
    );

    response.ok
        ? console.log("Passkey created successfully!")
        : console.error("Failed to create passkey:", await response.text());
}

/**
 * Register a new passkey for a user using Microsoft Graph API
 * @param {string} appToken - Application access token for Graph API authentication
 * @param {string} userId - The user ID to register the passkey for
 * @returns {Promise<void>} Promise that resolves when passkey registration is complete
 * @throws {Error} Throws error if passkey registration fails
 */
export async function registerUserPasskey(appToken, userId) {
    const creationOptions = await getPasskeyCreationOptions(appToken, userId);
    const credential = await createCredential(creationOptions);
    await createPasskey(credential, userId, appToken);
}

async function getUserPasskey(appToken, userId) {
    const response = await fetch(
        `https://${msGraphDomain}/users/${userId}/authentication/fido2Methods?slice=Test`,
        {
            headers: {
                Authorization: `Bearer ${appToken}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
            },
        }
    );

    const passkeys = await response.json();
    console.log(`Retrieved ${passkeys?.value?.length || 0} user passkeys`);
    return passkeys;
}

/**
 * Fetch and transform user passkeys from Microsoft Graph API
 * @param {string} appToken - Application access token for Graph API authentication
 * @param {string} userId - The user ID to fetch passkeys for
 * @returns {Promise<Array<Object>>} Promise that resolves to array of transformed passkey objects
 * @throws {Error} Throws error if fetching passkeys fails
 */
export async function fetchUserPasskey(appToken, userId) {
    const passkeys = await getUserPasskey(appToken, userId);
    return transformFido2Methods(passkeys);
}

/**
 * Delete a specific passkey for a user using Microsoft Graph API
 * @param {string} appToken - Application access token for Graph API authentication
 * @param {string} userId - The user ID that owns the passkey
 * @param {string} passkeyId - The ID of the passkey to delete
 * @returns {Promise<void>} Promise that resolves when passkey deletion is complete
 * @throws {Error} Throws error if passkey deletion fails
 */
export async function deleteUserPasskey(appToken, userId, passkeyId) {
    const response = await fetch(
        `https://${msGraphDomain}/users/${userId}/authentication/fido2Methods/${passkeyId}?slice=Test`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${appToken}`,
            },
        }
    );

    if (response.ok) {
        console.log(`Passkey ${passkeyId} deleted successfully!`);
    } else {
        console.error(
            `Failed to delete passkey ${passkeyId}:`,
            await response.text()
        );
    }
}

async function deleteUserAllPasskey(msGraphDomain, appToken, userId) {
    const passkeys = await getUserPasskey(msGraphDomain, appToken, userId);
    for (const passkey of passkeys.value) {
        await deleteUserPasskey(msGraphDomain, appToken, userId, passkey.id);
    }
}
