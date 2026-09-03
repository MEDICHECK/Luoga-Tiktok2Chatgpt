import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const DEFAULT_SCOPE = 'user.info.basic';

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) {
    return NextResponse.json({ error: 'TikTok OAuth is not configured', missing: ['TIKTOK_CLIENT_ID', 'TIKTOK_REDIRECT_URI'] }, { status: 503 });
  }

  const state = crypto.randomBytes(32).toString('hex');
  const scope = process.env.TIKTOK_OAUTH_SCOPE || DEFAULT_SCOPE;
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', clientKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/tiktok/oauth',
    maxAge: 600,
  });
  return response;
}
