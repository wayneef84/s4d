# Carrier API Setup Guide

This guide will help you get real API access for FedEx, UPS, and USPS to replace the current mock data.

---

## 🚚 FedEx API Setup

### Step 1: Create FedEx Developer Account

1. Go to [FedEx Developer Portal](https://developer.fedex.com/)
2. Click "Register" and create an account
3. Verify your email address

### Step 2: Create a Project

1. Log in to FedEx Developer Portal
2. Click "My Projects" → "Create a Project"
3. Project Name: `Shipment Tracker`
4. Description: `Personal shipment tracking application`
5. Select APIs: **Track API**
6. Click "Create"

### Step 3: Get API Credentials

You'll receive:
- **API Key** (Client ID)
- **Secret Key** (Client Secret)

**Save these securely!** You'll enter them in Settings.

### Step 4: Configure in App

1. Open Shipment Tracker
2. Click Settings (⚙️)
3. Scroll to "API Keys" section
4. Enter:
   - **FedEx API Key:** [Your Client ID]
   - **FedEx Secret Key:** [Your Client Secret]
5. Click "Save Settings"

### Step 5: Test

1. Open Debug Menu (`Ctrl+Shift+D`)
2. Click "FedEx - In Transit" quick add button
3. Should fetch REAL data from FedEx API

### API Limits (Free Tier)

- **Requests per day:** 1,000
- **Requests per second:** 5
- **Sandbox:** Yes (test environment available)

### Sandbox vs Production

**Current Code:** Uses sandbox by default

```javascript
// In js/api/fedex.js
var FEDEX_CONFIG = {
    useSandbox: true,  // Change to false for production
    apiUrl: {
        sandbox: 'https://apis-sandbox.fedex.com/track/v1/trackingnumbers',
        production: 'https://apis.fedex.com/track/v1/trackingnumbers'
    }
};
```

**To use production:**
1. Open `js/api/fedex.js`
2. Change `useSandbox: true` to `useSandbox: false`
3. Reload app

---

## 📦 UPS API Setup

### Step 1: Create UPS Developer Account

1. Go to [UPS Developer Portal](https://developer.ups.com/)
2. Click "Sign Up" and create account
3. Verify email

### Step 2: Create an Application

1. Log in to UPS Developer Portal
2. Go to "My Apps" → "Add Application"
3. Application Name: `Shipment Tracker`
4. Select API: **Tracking API**
5. Click "Create Application"

### Step 3: Get API Credentials

You'll receive:
- **Client ID**
- **Client Secret**

You may also need:
- **UPS Account Number** (optional, for advanced features)
- **Username/Password** (for legacy APIs, if required)

### Step 4: Configure in App

1. Open Shipment Tracker → Settings
2. Enter:
   - **UPS Client ID:** [Your Client ID]
   - **UPS Client Secret:** [Your Client Secret]
3. Click "Save Settings"

### Step 5: Test

1. Debug Menu → Click "UPS - Out for Delivery"
2. Should fetch REAL data from UPS API

### API Limits (Free Tier)

- **Requests per day:** 500
- **Requests per second:** 2
- **Test environment:** Yes (CIE - Customer Integration Environment)

### Test vs Production

**Current Code:** Uses test environment by default

```javascript
// In js/api/ups.js
var UPS_CONFIG = {
    useTest: true,  // Change to false for production
    apiUrl: {
        test: 'https://wwwcie.ups.com/api/track/v1/details',
        production: 'https://onlinetools.ups.com/api/track/v1/details'
    }
};
```

**To use production:**
1. Open `js/api/ups.js`
2. Change `useTest: true` to `useTest: false`
3. Reload app

---

## ✉️ USPS API Setup

### Step 1: Create USPS Web Tools Account

1. Go to [USPS Web Tools](https://www.usps.com/business/web-tools-apis/)
2. Click "Register" → "Getting Started"
3. Fill out registration form
4. Submit for approval (may take 24-48 hours)

### Step 2: Get API Credentials

After approval, you'll receive via email:
- **User ID**
- **Password**

### Step 3: Create USPS Adapter

**File:** `js/api/usps.js` (needs to be created)

```javascript
/**
 * USPS Tracking API Adapter
 * Uses USPS Web Tools API v3
 */

(function(window) {
    'use strict';

    var USPS_CONFIG = {
        apiUrl: {
            test: 'https://secure.shippingapis.com/ShippingAPITest.dll',
            production: 'https://secure.shippingapis.com/ShippingAPI.dll'
        },
        useTest: true
    };

    function trackShipment(awb) {
        console.log('[USPS] Tracking shipment:', awb);

        // Check rate limit
        var rateLimitCheck = APIBase.checkRateLimit('USPS');
        if (!rateLimitCheck.allowed) {
            return Promise.reject(new Error(rateLimitCheck.reason));
        }

        // USPS uses XML API (different from FedEx/UPS JSON)
        var userId = APIBase.getAPIKey('USPS').userId;
        var xml = buildTrackingXML(awb, userId);
        var url = (USPS_CONFIG.useTest ? USPS_CONFIG.apiUrl.test : USPS_CONFIG.apiUrl.production) +
                  '?API=TrackV2&XML=' + encodeURIComponent(xml);

        APIBase.recordRequest('USPS');

        return fetch(url)
            .then(function(response) { return response.text(); })
            .then(function(xmlText) { return parseXMLResponse(xmlText, awb); })
            .catch(function(error) {
                console.error('[USPS] API request failed:', error);
                throw APIBase.createAPIError('USPS', error);
            });
    }

    function buildTrackingXML(awb, userId) {
        return '<TrackRequest USERID="' + userId + '">' +
               '<TrackID ID="' + awb + '"></TrackID>' +
               '</TrackRequest>';
    }

    function parseXMLResponse(xmlText, awb) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extract tracking data from XML
        var trackInfo = xmlDoc.getElementsByTagName('TrackInfo')[0];
        var trackSummary = trackInfo.getElementsByTagName('TrackSummary')[0];
        var status = trackSummary ? trackSummary.textContent : 'Unknown';

        // Parse events
        var events = [];
        var trackDetails = trackInfo.getElementsByTagName('TrackDetail');
        for (var i = 0; i < trackDetails.length; i++) {
            events.push({
                timestamp: trackDetails[i].getElementsByTagName('EventDate')[0].textContent,
                description: trackDetails[i].textContent,
                location: null // USPS doesn't always provide detailed location
            });
        }

        // Map to normalized format
        return {
            awb: awb,
            carrier: 'USPS',
            status: status,
            deliverySignal: mapUSPSStatus(status),
            delivered: status.includes('Delivered'),
            dateShipped: events[events.length - 1]?.timestamp || null,
            estimatedDelivery: null, // USPS doesn't always provide this
            actualDelivery: status.includes('Delivered') ? events[0]?.timestamp : null,
            lastUpdated: new Date().toISOString(),
            origin: { city: null, country: 'US', code: null },
            destination: { city: null, country: 'US', code: null },
            currentLocation: { city: null, country: 'US', code: null },
            service: 'USPS',
            events: events,
            details: { pieceCount: 1, weight: null },
            rawPayload: xmlText
        };
    }

    function mapUSPSStatus(status) {
        if (status.includes('Delivered')) return 'DELIVERY';
        if (status.includes('Out for Delivery')) return 'OUT_FOR_DELIVERY';
        if (status.includes('In Transit')) return 'IN_TRANSIT';
        if (status.includes('Accepted')) return 'PICKUP';
        if (status.includes('Exception') || status.includes('Notice Left')) return 'EXCEPTION';
        return 'IN_TRANSIT';
    }

    window.USPSAdapter = {
        config: USPS_CONFIG,
        trackShipment: trackShipment
    };

})(window);
```

### Step 4: Add USPS to HTML

In `index.html`, add after UPS adapter:

```html
<script src="js/api/usps.js"></script>
```

### Step 5: Add USPS Detection to Utils

In `js/utils.js`, update `detectCarrier()`:

```javascript
// USPS (20-22 digit, or starts with 9 followed by 20 digits)
if (/^(9\d{20,22}|\d{20,22})$/.test(awb)) {
    return 'USPS';
}
```

### Step 6: Configure in App

1. Settings → API Keys
2. Enter:
   - **USPS User ID:** [Your User ID from email]
3. Save Settings

### API Limits

- **Requests per day:** Unlimited (but rate limited by USPS)
- **Best practice:** Max 100 requests/minute
- **Note:** USPS API is XML-based, not JSON

---

## 🔧 Implementation Status

| Carrier | Adapter File | Status | Notes |
|---------|--------------|--------|-------|
| DHL | `js/api/dhl.js` | ✅ Ready | Uses JSON API |
| FedEx | `js/api/fedex.js` | ⚠️ Mock Data | OAuth implemented, needs API keys |
| UPS | `js/api/ups.js` | ⚠️ Mock Data | OAuth implemented, needs API keys |
| USPS | N/A | ❌ Not Created | Needs adapter + XML parsing |

---

## 📝 Adding API Keys to App

### Settings Storage

API keys are stored in IndexedDB under the `settings` object store.

**Structure:**
```javascript
{
    key: 'apiKeys',
    value: {
        DHL: 'your-dhl-key',
        FedEx: {
            apiKey: 'your-client-id',
            secretKey: 'your-client-secret'
        },
        UPS: {
            clientId: 'your-client-id',
            clientSecret: 'your-client-secret'
        },
        USPS: {
            userId: 'your-user-id'
        }
    }
}
```

### Settings UI

Add USPS fields to Settings panel in `index.html`:

```html
<label for="uspsUserId">
    <span>USPS User ID:</span>
    <input type="text" id="uspsUserId" placeholder="Enter USPS User ID">
</label>
```

---

## 🧪 Testing Real APIs

### Test Tracking Numbers

**FedEx:**
- Production: Use real tracking numbers from shipments
- Sandbox: `111111111111` (mock delivered)

**UPS:**
- Production: Use real 1Z tracking numbers
- Test: `1Z999AA10123456784`

**USPS:**
- Production: Use real USPS tracking numbers
- Test: `9400111899561243144614` (example format)

### Debug Menu

After API keys are configured:
1. Press `Ctrl+Shift+D`
2. Click "FedEx - In Transit" or "UPS - Out for Delivery"
3. Adapters will automatically use REAL API instead of mock data
4. Check browser console for API responses

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore` if using environment variables
   - Use placeholder text in docs: `YOUR_API_KEY`

2. **Use Cloudflare Workers proxy** (recommended for production)
   - Keeps API keys server-side
   - Prevents exposure in browser
   - See `CLOUDFLARE_PROXY.md` for setup

3. **Rotate keys regularly**
   - Change API keys every 90 days
   - Revoke old keys in carrier portals

---

## 🚀 Next Steps

1. ✅ Fix debug menu initialization check (done)
2. ⏳ Create USPS adapter (`js/api/usps.js`)
3. ⏳ Update Settings UI for USPS
4. ⏳ Update carrier detection for USPS
5. ⏳ Get API keys from FedEx, UPS, USPS
6. ⏳ Test with real tracking numbers

---

**Need help?** Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for adapter patterns and [TEST_DATA.md](./TEST_DATA.md) for test tracking numbers.
