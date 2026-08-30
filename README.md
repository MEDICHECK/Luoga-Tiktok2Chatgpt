# Luoga's Automation

TikTok comments → AI → reply workflow.

## Flow

1. A TikTok comment contains `@askAI`.
2. TikTok sends the event to `/api/tiktok/webhook`.
3. Luoga's Automation extracts the question.
4. OpenAI generates a short reply in the commenter's language.
5. By default the result is returned for review. Automatic posting is enabled only when `AUTO_REPLY=true` and an authorized `TIKTOK_REPLY_URL` is configured.

## Environment

Copy `.env.example` to `.env.local` and add your credentials. Never commit secrets.

## Local run

```bash
npm install
npm run dev
```

Webhook endpoint: `/api/tiktok/webhook`

## Deployment

This is a Next.js app designed for Vercel. Configure environment variables in the Vercel project before enabling automatic replies.

## TikTok access

The app does not bypass TikTok authentication or use unofficial account credentials. Your TikTok developer application must provide the permissions/endpoints needed for the comment workflow.
