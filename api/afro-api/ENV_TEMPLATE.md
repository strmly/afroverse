# Environment Variables Template

Copy this template to `.env` and fill in your values.

## Required in Production

```bash
# Node Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/afromoji?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id
GCS_KEY_FILE=/path/to/service-account-key.json

# Security
CORS_ORIGIN=https://your-frontend-domain.com

# Async Jobs (Vercel Cron)
CRON_SECRET=your-cron-secret-key-change-this
```

## Optional but Recommended

```bash
# Redis (for caching and idempotency)
REDIS_URL=redis://localhost:6379

# API URL (for background jobs)
API_URL=https://your-api-domain.com
```

## Optional Services

```bash
# Twilio (for OTP via WhatsApp)
TWILIO_ACCOUNT_SID=AC6e415c4ec7b763967eda5ea684448794
TWILIO_AUTH_TOKEN=f6ee3cb1e7dabdf3abd727dd644c52d5
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
REPLICATE_API_KEY=r8_...
FAL_API_KEY=...
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE

# Worker Configuration
WORKER_URL=https://your-worker-url.com
GCP_REGION=us-central1
```

## Feature Flags

```bash
# Admin IP whitelist (comma-separated)
ADMIN_ALLOWED_IPS=127.0.0.1,::1

# Disable generation (maintenance mode)
DISABLE_GENERATION=false

# Disable OTP (for testing)
DISABLE_OTP=false

# Enable device binding (experimental)
ENABLE_DEVICE_BINDING=false
```

## Rate Limiting

```bash
# Rate limit window in milliseconds (default: 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Max requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

## Development Only

```bash
# Server Port (default: 3001)
PORT=3001
```



