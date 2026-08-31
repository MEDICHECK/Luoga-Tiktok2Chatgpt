import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  const stateCookie = req.cookies.get('tiktok_oauth_state')?.value;
  const params = req.nextUrl.searchParams;
  const state = params.get('state');
  const code = params.get('code');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  if (error) return NextResponse.json({ error, error_description: errorDescription }, { status: 400 });
  if (!clientKey || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'TikTok OAuth is not fully configured', missing: [!clientKey && 'TIKTOK_CLIENT_ID', !clientSecret && 'TIKTOK_CLIENT_SECRET', !redirectUri && 'TIKTOK_REDIRECT_URI'].filter(Boolean) }, { status: 503 });
  }
  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.json({ error: 'invalid_oauth_state' }, { status: 400 });
  }
  if (!code) return NextResponse.json({ error: 'missing_authorization_code' }, { status: 400 });

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    body,
    cache: 'no-store',
  });
  const tokenJson = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || tokenJson.error) {
    return NextResponse.json({ error: 'tiktok_token_exchange_failed', details: tokenJson }, { status: 502 });
  }

  const response = NextResponse.json({
    ok: true,
    message: 'TikTok authorization succeeded. Store these server-side; do not share them publicly.',
    open_id: tokenJson.open_id,
    scope: tokenJson.scope,
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token,
    expires_in: tokenJson.expires_in,
    refresh_expires_in: tokenJson.refresh_expires_in,
  });
  response.cookies.delete('tiktok_oauth_state');
  return response;
}
