# Setting Twilio Credentials in Vercel

## Quick Setup Guide

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Navigate to your project: `afroverse-wp9s` (or your project name)

2. **Open Project Settings**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Environment Variables**

   Add these three variables for **Production** environment:

   | Variable Name | Value |
   |--------------|-------|
   | `TWILIO_ACCOUNT_SID` | `AC6e415c4ec7b763967eda5ea684448794` |
   | `TWILIO_AUTH_TOKEN` | `fc55b90583a29120613b0ffe57d40aec` |
   | `TWILIO_VERIFY_SERVICE_SID` | `VA2acfd63f76f552a5e0dc350b474e5793` |

   **Steps:**
   - Click **Add New**
   - Enter the variable name (e.g., `TWILIO_ACCOUNT_SID`)
   - Enter the value
   - Select **Production** (and optionally **Preview** and **Development** if you want)
   - Click **Save**
   - Repeat for all three variables

4. **Redeploy**
   - After adding all variables, go to **Deployments**
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy** to apply the new environment variables

### Option 2: Vercel CLI

If you prefer using the CLI:

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Set Environment Variables:**
   ```bash
   cd afro-verse/afro-api
   
   # Set Account SID
   echo "AC6e415c4ec7b763967eda5ea684448794" | vercel env add TWILIO_ACCOUNT_SID production
   
   # Set Auth Token
   echo "fc55b90583a29120613b0ffe57d40aec" | vercel env add TWILIO_AUTH_TOKEN production
   
   # Set Verify Service SID
   echo "VA2acfd63f76f552a5e0dc350b474e5793" | vercel env add TWILIO_VERIFY_SERVICE_SID production
   ```

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

## Verify Setup

After setting the variables, test the OTP endpoint:

```bash
curl -X POST https://afroverse-wp9s.vercel.app/api/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneE164": "0780782399"}'
```

**Expected Response (Success):**
```json
{
  "otpSessionId": "...",
  "message": "OTP sent successfully"
}
```

**If you still get errors:**
- Check Vercel logs: `vercel logs --follow`
- Verify all three variables are set correctly
- Make sure you redeployed after adding the variables

## Security Notes

⚠️ **Important:**
- Never commit these credentials to git
- They are already in `.gitignore` (if you have one)
- Only set them in Vercel environment variables
- Consider rotating these credentials periodically

## Troubleshooting

### Still getting "Authenticate" error?
1. Double-check the values in Vercel dashboard (no extra spaces)
2. Make sure you selected **Production** environment
3. Redeploy after adding variables
4. Check Vercel logs for detailed error messages

### Variables not working?
- Environment variables are only available after redeployment
- Make sure you're testing the production URL
- Check that variables are set for the correct environment (Production)

---

**Credentials Provided:**
- Account SID: `AC6e415c4ec7b763967eda5ea684448794`
- Auth Token: `fc55b90583a29120613b0ffe57d40aec`
- Verify Service SID: `VA2acfd63f76f552a5e0dc350b474e5793`




