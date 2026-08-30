# Luoga’s Automation

TikTok comments → `@askAI` → OpenAI → automatic TikTok reply.

## Production architecture

1. TikTok Business Organic API sends a `comment.update` webhook to `/api/tiktok/webhook`.
2. Luoga verifies the `TikTok-Signature` HMAC using the TikTok app client secret.
3. Only comments containing `@askAI` are processed.
4. OpenAI generates a concise reply in the comment's language (Swahili/English supported).
5. Luoga checks existing replies for idempotency.
6. TikTok Business API `/business/comment/reply/create/` publishes the reply on the owned video.

TikTok's current Business API exposes read/reply operations for comments on owned organic videos, including `business/comment/list`, `business/comment/reply/list`, and `business/comment/reply/create`. citeturn2search0turn3search2

## Required environment variables

Copy `.env.example` into your deployment environment.

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-5-mini`)
- `TIKTOK_CLIENT_ID`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_BUSINESS_ID` — the `open_id` returned by TikTok account-holder OAuth
- `AUTO_REPLY=true` to enable publishing

TikTok account-holder access tokens expire after one day and the refresh token can be used to renew them; keep the refresh token secure and use TikTok's OAuth flow rather than hard-coding credentials. citeturn8search1

## TikTok Developer Portal setup

1. Create/configure a TikTok developer app.
2. Enable the TikTok account/Organic API capabilities needed for comments.
3. Request the comment read/manage scopes required by your app.
4. Configure an HTTPS webhook callback:
   `https://YOUR_DOMAIN/api/tiktok/webhook`
5. Subscribe to the `COMMENT` webhook event (`comment.update`). TikTok's webhook system supports comment-event subscriptions and can scope them to selected video IDs. citeturn5search0turn5search2
6. Complete the TikTok account-holder OAuth authorization and put the returned `access_token` and `open_id` into the deployment environment.
7. Test with `AUTO_REPLY=false` first.
8. Set `AUTO_REPLY=true` only after reviewing generated replies.

## Trigger

Comment:

`@askAI What is the fastest way to learn Python?`

Luoga extracts the question, generates the answer, and replies directly to that TikTok comment.

## Endpoint health check

`GET /api/tiktok/webhook`

Returns whether the required AI/TikTok credentials are present. It never returns credential values.

## Security

TikTok webhook requests are verified using the official `TikTok-Signature` HMAC-SHA256 mechanism and a timestamp window. citeturn7search0

Never commit `.env` files, access tokens, refresh tokens, or TikTok client secrets to GitHub.
