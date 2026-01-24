# Test Tracking Numbers

This document contains test tracking numbers for development and testing purposes.

## DHL Express Sandbox

DHL provides specific test tracking numbers for their sandbox environment:

- `00340434161094042557`
- `00340434161094038253`
- `00340434161094032954`
- `00340434161094027318`
- `00340434161094022115`
- `00340434161094015902`

**Source:** [DHL Developer Portal - Shipment Tracking](https://developer.dhl.com/api-reference/shipment-tracking?language_content_entity=en)

## FedEx Sandbox

FedEx provides test tracking numbers for their sandbox API:

- `111111111111` - Returns delivered status
- `063407591022258` - Example from API documentation

**Note:** FedEx sandbox sometimes expects real tracking numbers for testing different scenarios.

**Sources:**
- [FedEx Track API Documentation](https://developer.fedex.com/api/en-us/catalog/track.html)
- [FedEx Sandbox Virtualization Guide](https://developer.fedex.com/api/en-us/guides/sandboxvirtualization.html)

## UPS Sandbox

UPS provides a test environment accessible via:
- Test URL: `https://wwwcie.ups.com/security/v1/oauth/token`
- Production URL: `https://onlinetools.ups.com/security/v1/oauth/token`

**Note:** Specific test tracking numbers are provided in the UPS Developer Portal documentation after registration.

**Sources:**
- [UPS Developer Portal](https://developer.ups.com/api/reference)
- [UPS Tracking API Documentation](https://github.com/UPS-API/api-documentation/blob/main/Tracking.yaml)

## Testing Without API Keys (Mock Data)

For development without API keys, the app can use mock data with the following format:

### DHL Mock Tracking
```javascript
{
    awb: '1234567890',
    carrier: 'DHL',
    status: 'In Transit',
    deliverySignal: 'IN_TRANSIT',
    origin: { city: 'Hong Kong', country: 'HK' },
    destination: { city: 'Los Angeles', country: 'US' },
    estimatedDelivery: '2026-01-30T12:00:00Z'
}
```

### FedEx Mock Tracking
```javascript
{
    awb: '111111111111',
    carrier: 'FedEx',
    status: 'Delivered',
    deliverySignal: 'DELIVERY',
    origin: { city: 'Memphis', country: 'US' },
    destination: { city: 'New York', country: 'US' },
    actualDelivery: '2026-01-20T14:30:00Z'
}
```

### UPS Mock Tracking
```javascript
{
    awb: '1Z999AA10123456784',
    carrier: 'UPS',
    status: 'Out for Delivery',
    deliverySignal: 'OUT_FOR_DELIVERY',
    origin: { city: 'Atlanta', country: 'US' },
    destination: { city: 'Boston', country: 'US' },
    estimatedDelivery: '2026-01-23T18:00:00Z'
}
```
