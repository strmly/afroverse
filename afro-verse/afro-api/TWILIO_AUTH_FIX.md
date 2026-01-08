# Twilio Authentication Error Fix

## Problem
The `/api/auth/otp/send` endpoint was returning:
```json
{
  "error": "provider_error",
  "message": "Authenticate"
}
```

This error occurs when:
1. **Twilio credentials are invalid or missing** - The "Authenticate" message is Twilio's way of saying the Account SID or Auth Token is wrong
2. **Phone number format issues** - Numbers like "0780782399" need proper normalization

## Root Causes

### 1. Twilio Authentication Error
The error "Authenticate" (HTTP 401) from Twilio indicates:
- `TWILIO_ACCOUNT_SID` is incorrect or missing
- `TWILIO_AUTH_TOKEN` is incorrect or missing
- Credentials are set but don't match

### 2. Phone Number Format
The phone number `"0780782399"` is in local South African format and needs to be normalized to E.164 format (`+27780782399`).

## Fixes Applied

### 1. Enhanced Twilio Error Handling
**File**: `src/services/twilio.service.ts`

**Changes**:
- ✅ Added specific handling for Twilio authentication errors (401, error code 20003)
- ✅ Added handling for invalid phone number errors (error code 21211)
- ✅ Added handling for rate limiting (429, error code 20429)
- ✅ Improved error messages to be user-friendly (don't expose internal Twilio errors)
- ✅ Enhanced logging with error codes and status codes

**Error Handling**:
```typescript
// Authentication errors now return:
{
  "error": "provider_error",
  "message": "SMS service configuration error. Please contact support."
}

// Invalid phone number errors now return:
{
  "error": "provider_error", 
  "message": "Invalid phone number format. Please use international format (e.g., +27821234567)."
}
```

### 2. Improved Phone Number Validation
**File**: `src/utils/phone.ts`

**Changes**:
- ✅ Enhanced normalization to handle numbers starting with "27" (country code without +)
- ✅ Better error messages for common phone number format issues
- ✅ More helpful validation errors that guide users to correct format

**Supported Formats**:
- `0780782399` → `+27780782399` (local SA format)
- `2780782399` → `+27780782399` (country code without +)
- `+2780782399` → `+27880782399` (already in E.164)

### 3. Enhanced Logging
**Files**: `src/services/auth.service.ts`, `src/services/twilio.service.ts`

**Changes**:
- ✅ Added detailed logging for phone number validation
- ✅ Logs original and normalized phone numbers (masked for privacy)
- ✅ Logs Twilio error codes and status codes
- ✅ Better debugging information without exposing sensitive data

## How to Fix in Vercel

### Step 1: Verify Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Check your **Account SID** and **Auth Token**:
   - Account SID: Starts with `AC...`
   - Auth Token: Found in Account Settings

3. In Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Verify these variables are set correctly:
     - `TWILIO_ACCOUNT_SID` - Should start with `AC`
     - `TWILIO_AUTH_TOKEN` - Should be a long string
     - `TWILIO_VERIFY_SERVICE_SID` - Should start with `VA`

### Step 2: Test Twilio Credentials

You can test if your credentials work by running:
```bash
curl -X POST https://verify.twilio.com/v2/Services/{YOUR_VERIFY_SERVICE_SID}/Verifications \
  -u "{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}" \
  -d "To=+27821234567" \
  -d "Channel=sms"
```

If you get a 401 error, your credentials are wrong.

### Step 3: Verify Phone Number Format

The API now accepts multiple formats:
- ✅ `0780782399` (local SA format)
- ✅ `2780782399` (country code without +)
- ✅ `+2780782399` (E.164 format)

All will be normalized to `+2780782399`.

### Step 4: Deploy the Fix

```bash
cd afro-verse/afro-api
git add .
git commit -m "fix: Improve Twilio error handling and phone validation"
git push
```

Or deploy directly:
```bash
vercel --prod
```

## Testing

### Test with cURL:

```bash
# Test with local format (should work)
curl -X POST https://afroverse-wp9s.vercel.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneE164": "0780782399"}'

# Test with E.164 format (should work)
curl -X POST https://afroverse-wp9s.vercel.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneE164": "+2780782399"}'
```

### Expected Responses:

**If Twilio credentials are correct:**
```json
{
  "otpSessionId": "60d5ec49f1b2c72d88f8e3a1",
  "message": "OTP sent successfully"
}
```

**If Twilio credentials are wrong:**
```json
{
  "error": "provider_error",
  "message": "SMS service configuration error. Please contact support."
}
```

**If phone number is invalid:**
```json
{
  "error": "invalid_phone",
  "message": "Invalid phone number format. Please use international format (e.g., +27821234567 or 07821234567)"
}
```

## Monitoring

After deployment, check Vercel logs:
```bash
vercel logs --follow
```

Look for:
- `Twilio authentication failed` - Credentials are wrong
- `Phone validation failed` - Phone number format issue
- `OTP sent successfully` - Everything working

## Common Issues

### Issue: Still getting "Authenticate" error
**Solution**: 
1. Double-check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in Vercel
2. Make sure there are no extra spaces or quotes
3. Verify credentials in Twilio Console
4. Redeploy after updating environment variables

### Issue: Phone number validation fails
**Solution**:
- Use format: `0780782399` or `+2780782399`
- Make sure it's a valid South African mobile number (starts with 0, 6, 7, or 8 after country code)

### Issue: "SMS service configuration error"
**Solution**:
- This means Twilio credentials are invalid
- Check Vercel environment variables
- Verify in Twilio Console that the account is active

## Files Modified

1. `src/services/twilio.service.ts` - Enhanced error handling
2. `src/utils/phone.ts` - Improved phone validation
3. `src/services/auth.service.ts` - Better logging

---

**Created**: January 8, 2026
**Issue**: Twilio "Authenticate" error and phone number format
**Status**: ✅ Fixed with improved error handling and validation

