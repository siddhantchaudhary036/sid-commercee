# Clerk Webhook Setup Guide

## What I've Created

1. **Users Table** (`convex/schema.ts`) - Stores user data synced from Clerk
2. **User Functions** (`convex/users.ts`) - CRUD operations for users
3. **Webhook Handler** (`app/api/webhooks/clerk/route.js`) - Processes Clerk events

## Setup Steps

### 1. Deploy Your Next.js App
First, deploy your app to a hosting platform (Vercel recommended):
```bash
# If using Vercel
vercel
```

Your webhook URL will be: `https://your-domain.com/api/webhooks/clerk`

### 2. Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
6. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Click **Create**
8. Copy the **Signing Secret** (starts with `whsec_`)

### 3. Add Webhook Secret to Environment

Update your `.env.local`:
```
CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### 4. Test Locally (Optional)

To test webhooks locally, use Clerk's webhook testing or ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL in Clerk webhook settings
```

## Convex Deployment Commands

- **Dev deployment**: `npx convex dev` (watches for changes)
- **One-time push**: `npx convex dev --once` (what I just ran)
- **Production deployment**: `npx convex deploy`

## How It Works

1. User signs up/updates/deletes in Clerk
2. Clerk sends webhook to your Next.js API route
3. Webhook verifies the request using svix
4. User data is synced to Convex database
5. You can query users using the functions in `convex/users.ts`

## Using the User Functions

```javascript
// In your components
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Get current user
const currentUser = useQuery(api.users.getCurrentUser);

// Get user by Clerk ID
const user = useQuery(api.users.getUserByClerkId, { clerkId: "user_xxx" });
```

## Troubleshooting

- Check webhook logs in Clerk Dashboard
- Verify `CLERK_WEBHOOK_SECRET` is set correctly
- Ensure your deployment URL is accessible
- Check Next.js logs for errors
