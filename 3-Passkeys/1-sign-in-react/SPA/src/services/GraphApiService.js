// Mock data from your API response
const MOCK_PASSKEYS_DATA = {
    "value": [
        {
            "id": "-2_GRUg2-HYz6_1YG4YRAQ2",
            "displayName": "Red key",
            "creationDateTime": "2020-08-10T06:44:09Z",
            "aaGuid": "2fc0579f-8113-47ea-b116-555a8db9202a",
            "model": "NFC key",
            "attestationCertificates": [
                "dbe793efdf1945e2df25d93653a1e8a3268a9075"
            ],
            "attestationLevel": "attested"
        },
        {
            "id": "_jpuR-TGZgk6aQCLF3BQjA2",
            "displayName": "Blue key",
            "creationDateTime": "2020-08-10T06:25:38Z",
            "aaGuid": "c5ef55ff-ad9a-4b9f-b580-ababafe026d0",
            "model": "USB key",
            "attestationCertificates": [
                "b479e7652167f574296e76bfa76731b8ccd22ed7"
            ],
            "attestationLevel": "attested"
        }
    ]
};

// Microsoft Graph API service with mock data support
const GraphApiService = {
    // Function to call Microsoft Graph API
    async callGraphApi(accessToken, endpoint) {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${accessToken}`);
        headers.append('Content-Type', 'application/json');

        const options = {
            method: 'GET',
            headers: headers,
        };

        try {
            const response = await fetch(endpoint, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Graph API call failed:', error);
            throw error;
        }
    },

    // Get FIDO2 authentication methods for a user (now returns mock data)
    async getFido2Methods(accessToken, userId) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return mock data instead of making real API call
        console.log('Using mock FIDO2 data for user:', userId);
        return MOCK_PASSKEYS_DATA;
        
        // Commented out real API call for now
        // const endpoint = `https://graph.microsoft.com/v1.0/users/${userId}/authentication/fido2Methods`;
        // return await this.callGraphApi(accessToken, endpoint);
    },

    // Transform function to handle the actual API response structure
    transformFido2Methods(graphResponse) {
        if (!graphResponse || !graphResponse.value) {
            return [];
        }

        return graphResponse.value.map(method => ({
            id: method.id,
            name: method.displayName || 'Unnamed Passkey',
            lastUsed: method.lastUsedDateTime ? 
                this.formatLastUsed(method.lastUsedDateTime) : 'Never',
            created: method.creationDateTime ? 
                new Date(method.creationDateTime).toLocaleDateString() : 'Unknown',
            device: method.model || 'Unknown Device',
            attestationLevel: method.attestationLevel || 'Unknown',
            aaGuid: method.aaGuid,
            // Store additional Graph API data
            _graphData: method
        }));
    },

    // Format last used date to friendly string
    formatLastUsed(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return '1 day ago';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else {
            const months = Math.floor(diffInDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }
    }
};

export default GraphApiService;
