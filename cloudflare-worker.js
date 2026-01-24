/**
 * Cloudflare Worker - Shipment Tracker API Proxy
 *
 * This worker acts as a CORS proxy for carrier APIs (DHL, FedEx, UPS)
 * Deployed at: workers.dev (or custom domain)
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://dash.cloudflare.com
 * 2. Navigate to Workers & Pages
 * 3. Click "Create Application" → "Create Worker"
 * 4. Name it: "shipment-tracker-proxy"
 * 5. Click "Deploy"
 * 6. Click "Edit Code"
 * 7. Paste this entire file
 * 8. Click "Save and Deploy"
 * 9. Copy the worker URL (e.g., https://shipment-tracker-proxy.YOUR_SUBDOMAIN.workers.dev)
 * 10. Update js/api/base.js PROXY_CONFIG.baseUrl with your worker URL
 *
 * ENVIRONMENT VARIABLES (Settings → Variables):
 * Set these in Cloudflare dashboard under Worker settings:
 * - DHL_API_KEY: Your DHL API key
 * - FEDEX_CLIENT_ID: Your FedEx OAuth client ID
 * - FEDEX_CLIENT_SECRET: Your FedEx OAuth client secret
 * - UPS_CLIENT_ID: Your UPS OAuth client ID
 * - UPS_CLIENT_SECRET: Your UPS OAuth client secret
 *
 * @author Wayne Fong (wayneef84)
 * @version 1.0.0
 */

// ============================================================
// CORS HEADERS
// ============================================================

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://wayneef84.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, DHL-API-Key',
    'Access-Control-Max-Age': '86400', // 24 hours
};

// ============================================================
// CARRIER API ENDPOINTS
// ============================================================

const API_ENDPOINTS = {
    DHL: {
        track: 'https://api-eu.dhl.com/track/shipments',
        test: 'https://api-test.dhl.com/track/shipments'
    },
    FEDEX: {
        oauth: {
            sandbox: 'https://apis-sandbox.fedex.com/oauth/token',
            production: 'https://apis.fedex.com/oauth/token'
        },
        track: {
            sandbox: 'https://apis-sandbox.fedex.com/track/v1/trackingnumbers',
            production: 'https://apis.fedex.com/track/v1/trackingnumbers'
        }
    },
    UPS: {
        oauth: {
            test: 'https://wwwcie.ups.com/security/v1/oauth/token',
            production: 'https://onlinetools.ups.com/security/v1/oauth/token'
        },
        track: {
            test: 'https://wwwcie.ups.com/api/track/v1/details',
            production: 'https://onlinetools.ups.com/api/track/v1/details'
        }
    }
};

// ============================================================
// OAUTH TOKEN CACHE (in-memory, resets on worker restart)
// ============================================================

let tokenCache = {
    fedex: { token: null, expiresAt: 0 },
    ups: { token: null, expiresAt: 0 }
};

// ============================================================
// MAIN REQUEST HANDLER
// ============================================================

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: CORS_HEADERS
        });
    }

    try {
        // Route based on path
        if (url.pathname.startsWith('/dhl/')) {
            return await handleDHL(request, url);
        } else if (url.pathname.startsWith('/fedex/')) {
            return await handleFedEx(request, url);
        } else if (url.pathname.startsWith('/ups/')) {
            return await handleUPS(request, url);
        } else if (url.pathname === '/health') {
            return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        } else {
            return jsonResponse({ error: 'Unknown endpoint' }, 404);
        }
    } catch (error) {
        console.error('Worker error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

// ============================================================
// DHL HANDLER
// ============================================================

async function handleDHL(request, url) {
    const pathParts = url.pathname.split('/');
    const action = pathParts[2]; // /dhl/track or /dhl/batch

    if (action === 'track') {
        const awb = url.searchParams.get('awb');
        if (!awb) {
            return jsonResponse({ error: 'Missing awb parameter' }, 400);
        }

        const apiKey = env.DHL_API_KEY || url.searchParams.get('apiKey');
        if (!apiKey) {
            return jsonResponse({ error: 'DHL API key not configured' }, 401);
        }

        const useTest = url.searchParams.get('test') === 'true';
        const endpoint = useTest ? API_ENDPOINTS.DHL.test : API_ENDPOINTS.DHL.track;
        const trackingUrl = `${endpoint}?trackingNumber=${encodeURIComponent(awb)}`;

        const response = await fetch(trackingUrl, {
            method: 'GET',
            headers: {
                'DHL-API-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        return jsonResponse({
            success: response.ok,
            status: response.status,
            data: data,
            timestamp: new Date().toISOString()
        });
    }

    return jsonResponse({ error: 'Unknown DHL action' }, 404);
}

// ============================================================
// FEDEX HANDLER
// ============================================================

async function handleFedEx(request, url) {
    const pathParts = url.pathname.split('/');
    const action = pathParts[2]; // /fedex/oauth or /fedex/track

    const useSandbox = url.searchParams.get('sandbox') !== 'false';

    if (action === 'oauth') {
        return await getFedExToken(useSandbox);
    } else if (action === 'track') {
        const awb = url.searchParams.get('awb');
        if (!awb) {
            return jsonResponse({ error: 'Missing awb parameter' }, 400);
        }

        // Get OAuth token
        const tokenResponse = await getFedExToken(useSandbox);
        const tokenData = await tokenResponse.json();

        if (!tokenData.success || !tokenData.token) {
            return jsonResponse({ error: 'Failed to get FedEx OAuth token' }, 401);
        }

        // Track shipment
        const endpoint = useSandbox ? API_ENDPOINTS.FEDEX.track.sandbox : API_ENDPOINTS.FEDEX.track.production;

        const trackResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.token}`,
                'Content-Type': 'application/json',
                'X-locale': 'en_US'
            },
            body: JSON.stringify({
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: awb
                        }
                    }
                ]
            })
        });

        const data = await trackResponse.json();

        return jsonResponse({
            success: trackResponse.ok,
            status: trackResponse.status,
            data: data,
            timestamp: new Date().toISOString()
        });
    }

    return jsonResponse({ error: 'Unknown FedEx action' }, 404);
}

async function getFedExToken(useSandbox) {
    // Check cache
    const now = Date.now();
    if (tokenCache.fedex.token && now < tokenCache.fedex.expiresAt) {
        console.log('Using cached FedEx token');
        return jsonResponse({
            success: true,
            token: tokenCache.fedex.token,
            cached: true
        });
    }

    const clientId = env.FEDEX_CLIENT_ID;
    const clientSecret = env.FEDEX_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return jsonResponse({ error: 'FedEx credentials not configured' }, 401);
    }

    const endpoint = useSandbox ? API_ENDPOINTS.FEDEX.oauth.sandbox : API_ENDPOINTS.FEDEX.oauth.production;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        })
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
        // Cache token (expires in ~3600s, cache for 55min)
        const expiresIn = data.expires_in || 3600;
        tokenCache.fedex.token = data.access_token;
        tokenCache.fedex.expiresAt = now + ((expiresIn - 300) * 1000);

        return jsonResponse({
            success: true,
            token: data.access_token,
            expiresIn: expiresIn
        });
    }

    return jsonResponse({ error: 'OAuth request failed', details: data }, response.status);
}

// ============================================================
// UPS HANDLER
// ============================================================

async function handleUPS(request, url) {
    const pathParts = url.pathname.split('/');
    const action = pathParts[2]; // /ups/oauth or /ups/track

    const useTest = url.searchParams.get('test') !== 'false';

    if (action === 'oauth') {
        return await getUPSToken(useTest);
    } else if (action === 'track') {
        const awb = url.searchParams.get('awb');
        if (!awb) {
            return jsonResponse({ error: 'Missing awb parameter' }, 400);
        }

        // Get OAuth token
        const tokenResponse = await getUPSToken(useTest);
        const tokenData = await tokenResponse.json();

        if (!tokenData.success || !tokenData.token) {
            return jsonResponse({ error: 'Failed to get UPS OAuth token' }, 401);
        }

        // Track shipment
        const endpoint = useTest ? API_ENDPOINTS.UPS.track.test : API_ENDPOINTS.UPS.track.production;
        const trackingUrl = `${endpoint}/${encodeURIComponent(awb)}`;

        const trackResponse = await fetch(trackingUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenData.token}`,
                'Content-Type': 'application/json',
                'transId': `shipment-tracker-${Date.now()}`,
                'transactionSrc': 'shipment-tracker'
            }
        });

        const data = await trackResponse.json();

        return jsonResponse({
            success: trackResponse.ok,
            status: trackResponse.status,
            data: data,
            timestamp: new Date().toISOString()
        });
    }

    return jsonResponse({ error: 'Unknown UPS action' }, 404);
}

async function getUPSToken(useTest) {
    // Check cache
    const now = Date.now();
    if (tokenCache.ups.token && now < tokenCache.ups.expiresAt) {
        console.log('Using cached UPS token');
        return jsonResponse({
            success: true,
            token: tokenCache.ups.token,
            cached: true
        });
    }

    const clientId = env.UPS_CLIENT_ID;
    const clientSecret = env.UPS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return jsonResponse({ error: 'UPS credentials not configured' }, 401);
    }

    const endpoint = useTest ? API_ENDPOINTS.UPS.oauth.test : API_ENDPOINTS.UPS.oauth.production;

    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials'
        })
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
        // Cache token
        const expiresIn = data.expires_in || 3600;
        tokenCache.ups.token = data.access_token;
        tokenCache.ups.expiresAt = now + ((expiresIn - 300) * 1000);

        return jsonResponse({
            success: true,
            token: data.access_token,
            expiresIn: expiresIn
        });
    }

    return jsonResponse({ error: 'OAuth request failed', details: data }, response.status);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        }
    });
}

// ============================================================
// ENVIRONMENT VARIABLES ACCESS
// ============================================================

// Note: In Cloudflare Workers, env is passed via context
// For this template, we use a global-like accessor
const env = typeof ENV !== 'undefined' ? ENV : {};
