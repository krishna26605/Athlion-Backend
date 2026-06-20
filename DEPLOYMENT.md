# ATHLiON Backend — Deployment Guide

## Architecture Overview

| Mode | Entry Point | Transport |
|------|-------------|-----------|
| Local dev | `server.js` | Express on `PORT` (default 5000) |
| AWS Lambda | `handler.js` → `serverless-http` | Lambda Function URL |

**Why Lambda Function URL instead of API Gateway?**
The AI chatbot (`/api/ai/chat`) runs multi-step tool-calling loops (up to 5 iterations). API Gateway enforces a hard 29-second execution timeout that cannot be increased. Lambda Function URLs support up to 15-minute timeouts, eliminating HTTP 504 errors under heavy AI workloads.

---

## Prerequisites

1. **Node.js 20+** installed locally.
2. **AWS CLI** configured with an IAM user that has Lambda, IAM, and CloudFormation permissions:
   ```bash
   aws configure
   # Enter: AWS Access Key ID, Secret Access Key, region (ap-south-1), output format (json)
   ```
3. **Serverless Framework v3** installed globally:
   ```bash
   npm install -g serverless
   ```
4. **MongoDB Atlas** network access open to `0.0.0.0/0` (for Lambda — see note below).

---

## Step 1: Provision Secrets in AWS SSM Parameter Store

All secrets must be stored as **SecureString** parameters. Replace `<value>` with actual values.

```bash
aws ssm put-parameter --name /athlion/MONGODB_URI       --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/JWT_SECRET        --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/RAZORPAY_KEY_ID   --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/RAZORPAY_KEY_SECRET --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/TWILIO_ACCOUNT_SID --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/TWILIO_AUTH_TOKEN  --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/TWILIO_WHATSAPP_NUMBER --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/SMTP_HOST         --type SecureString --value "smtp.gmail.com"
aws ssm put-parameter --name /athlion/SMTP_PORT         --type SecureString --value "587"
aws ssm put-parameter --name /athlion/SMTP_USER         --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/SMTP_PASS         --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/FROM_EMAIL        --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/GEMINI_API_KEY    --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/GROQ_API_KEY      --type SecureString --value "<value>"
aws ssm put-parameter --name /athlion/OPENAI_API_KEY    --type SecureString --value "<value>"
```

The IAM role that Serverless creates for the Lambda function needs `ssm:GetParameter` permission on `/athlion/*`. Add this to the role in the AWS console or via an IAM policy attachment after first deploy.

---

## Step 2: MongoDB Atlas Network Access

Lambda functions run from dynamic AWS IP addresses. Choose one of:

| Option | Setup | Trade-off |
|--------|-------|-----------|
| **Allow all IPs** (simplest) | Atlas → Network Access → Add `0.0.0.0/0` | Easy but less restrictive |
| **AWS VPC + NAT Gateway** (production) | Place Lambda in a VPC with a NAT Gateway; whitelist the NAT's Elastic IP in Atlas | More secure, adds ~$35/month for NAT |

For initial deployment, `0.0.0.0/0` is fine. Migrate to VPC/NAT once you have production traffic.

---

## Step 3: Deploy

```bash
cd Backend/Athlion-Backend
npm install
npm run deploy
```

After a successful deploy, Serverless outputs the **Lambda Function URL**:
```
endpoint: https://<id>.lambda-url.ap-south-1.on.aws/
```

---

## Step 4: Configure the Frontend

In `Frontend/Athlion-Frontend/.env` (or Vercel environment variables), set:

```
NEXT_PUBLIC_API_URL=https://<id>.lambda-url.ap-south-1.on.aws
```

Re-deploy the frontend after updating this variable.

---

## Local Development

```bash
npm run dev
# Server running in development mode on port 5000
```

The local entry point (`server.js`) connects to MongoDB once before starting, then the per-request DB middleware is a no-op (connection already active).

---

## Caching & Rate Limiting — Production Caveats

### In-Memory Cache (`node-cache`)
- The events response cache has a 5-minute TTL.
- **This cache is per-Lambda instance.** Concurrent Lambda instances each maintain their own cache; cache misses on one instance are not visible to others.
- Cache is also cleared on each cold start.

### In-Memory Rate Limiting (`express-rate-limit`)
- Rate limit counters are stored in each Lambda instance's memory.
- Under concurrent traffic across multiple instances, a single IP can exceed the configured limit.

### Redis Migration Path (Recommended for Production)

To share state across Lambda instances, replace both the cache and rate-limit store with **Upstash Redis** (serverless-compatible, pay-per-request):

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Install the adapter packages:
   ```bash
   npm install ioredis rate-limit-redis @upstash/redis
   ```
3. Replace `node-cache` in `src/utils/eventsCache.js`:
   ```js
   const { Redis } = require('@upstash/redis');
   const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN });
   // Use redis.get/set/del with JSON.stringify/parse instead of NodeCache
   ```
4. Replace the in-memory store in rate limiters:
   ```js
   const { RedisStore } = require('rate-limit-redis');
   const store = new RedisStore({ sendCommand: (...args) => redis.call(...args) });
   // Pass store to rateLimit({ store, ... })
   ```
5. Add `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` to SSM Parameter Store and `serverless.yml`.
