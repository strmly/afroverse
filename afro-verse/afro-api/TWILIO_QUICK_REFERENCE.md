# Twilio WhatsApp OTP - Quick Reference

## 🚀 Quick Setup

```bash
# 1. Configure credentials
npm run setup:twilio

# 2. Create Verify Service
npm run twilio:create-service

# 3. Test integration
npm run test:twilio +27821234567
```

## 🔑 Credentials

```bash
Account SID: AC6e415c4ec7b763967eda5ea684448794
Auth Token:  f6ee3cb1e7dabdf3abd727dd644c52d5
```

## 📝 Environment Variables

```bash
TWILIO_ACCOUNT_SID=AC6e415c4ec7b763967eda5ea684448794
TWILIO_AUTH_TOKEN=f6ee3cb1e7dabdf3abd727dd644c52d5
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISABLE_OTP=false
```

## 💻 API Usage

### Send OTP

```typescript
import { sendWhatsAppOTP } from './services/twilio.service';

const result = await sendWhatsAppOTP('+27821234567');
if (result.success) {
  console.log('OTP sent:', result.providerRef);
}
```

### Verify OTP

```typescript
import { verifyWhatsAppOTP } from './services/twilio.service';

const result = await verifyWhatsAppOTP('+27821234567', '123456');
if (result.success) {
  console.log('Verified:', result.status);
}
```

## 🔌 API Endpoints

### POST /api/auth/otp/send

```json
{
  "phoneE164": "+27821234567"
}
```

Response:
```json
{
  "otpSessionId": "...",
  "message": "OTP sent successfully"
}
```

### POST /api/auth/otp/verify

```json
{
  "otpSessionId": "...",
  "code": "123456"
}
```

Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "isNewUser": true,
  "user": { ... }
}
```

## 🛡️ Rate Limits

- **3 OTP requests** per phone in 10 minutes
- **5 verification attempts** per session
- **10-minute expiry** for codes

## 🧪 Testing

```bash
# Full test
npm run test:twilio +27821234567

# cURL test
curl -X POST http://localhost:3001/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneE164": "+27821234567"}'
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Twilio not configured" | Run `npm run setup:twilio` |
| "Failed to send OTP" | Run `npm run twilio:create-service` |
| "Invalid code" | Check code and expiry |
| "Rate limited" | Wait 10 minutes |

## 📊 Development Mode

When Twilio is not configured:
- Uses code: `123456`
- Auto-success
- Console logging

## 💰 Costs

- ~$0.005 per verification
- $15 free trial credit

## 📚 Resources

- [Setup Guide](../TWILIO_SETUP_GUIDE.md)
- [Twilio Console](https://console.twilio.com)
- [Verify Dashboard](https://console.twilio.com/us1/develop/verify/services)

---

**Quick Start:** `npm run setup:twilio && npm run twilio:create-service && npm run test:twilio`



