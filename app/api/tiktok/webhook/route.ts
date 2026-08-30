import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'node:crypto';
import OpenAI from 'openai';
import { extractComment, getReplies, replyToComment } from '@/lib/tiktok';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRIGGER = '@askai';
const MAX_REPLY_LENGTH = 500;
const inFlight = new Set<string>();

function verifyTikTokSignature(rawBody: string, header: string | null) {
  const secret = process.env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key?.trim(), rest.join('=').trim()];
    }),
  );

  if (!parts.t || !parts.s) return false;
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');

  const received = parts.s;
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;

  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

async function generateReply(prompt: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions:
      'You are Luoga’s TikTok reply assistant. Answer the commenter directly. Be concise, friendly and useful. Match the language of the comment, especially Swahili or English. Never claim to be human. Do not provide dangerous instructions. Maximum 500 characters.',
    input: prompt || 'Respond briefly and invite the commenter to ask a question.',
  });

  return response.output_text.trim().slice(0, MAX_REPLY_LENGTH);
}

async function processComment(commentId: string, videoId: string, text: string) {
  if (inFlight.has(commentId)) return;
  inFlight.add(commentId);

  try {
    if (!process.env.TIKTOK_ACCESS_TOKEN || !process.env.TIKTOK_BUSINESS_ID) {
      throw new Error('Missing TikTok credentials');
    }

    // TikTok delivers webhooks at least once. Check the current thread before posting.
    const existingReplies = await getReplies(videoId, commentId);
    if (existingReplies.length > 0) return;

    const prompt = text.replace(new RegExp(TRIGGER, 'ig'), '').trim();
    const reply = await generateReply(prompt);
    if (!reply) return;

    await replyToComment(videoId, commentId, reply);
  } finally {
    inFlight.delete(commentId);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyTikTokSignature(rawBody, req.headers.get('TikTok-Signature'))) {
    return NextResponse.json({ error: 'invalid webhook signature' }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const event = String(body.event ?? body.event_type ?? '').toLowerCase();
  if (event && !event.includes('comment')) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'not a comment event' });
  }

  const comment = extractComment(body);
  if (!comment?.comment_id || !comment.video_id || !comment.text) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'comment payload not recognized' });
  }

  if (!comment.text.toLowerCase().includes(TRIGGER)) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'no @askAI trigger' });
  }

  // Acknowledge TikTok immediately. TikTok retries deliveries when a 200 is not returned.
  // Work continues after the response so AI/API latency does not cause webhook retries.
  if (process.env.AUTO_REPLY === 'true') {
    after(() =>
      processComment(comment.comment_id!, comment.video_id!, comment.text!).catch((error) => {
        console.error('Luoga comment processing failed:', error);
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    accepted: true,
    mode: process.env.AUTO_REPLY === 'true' ? 'auto_reply' : 'review',
    commentId: comment.comment_id,
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'Luoga’s Automation',
    status: 'ok',
    trigger: '@askAI',
    autoReply: process.env.AUTO_REPLY === 'true',
    configured: Boolean(
      process.env.TIKTOK_ACCESS_TOKEN &&
        process.env.TIKTOK_BUSINESS_ID &&
        process.env.OPENAI_API_KEY,
    ),
  });
}
