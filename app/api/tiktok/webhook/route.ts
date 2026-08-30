import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractComment, getReplies, replyToComment } from '@/lib/tiktok';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRIGGER = '@askai';

async function generateReply(prompt: string) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: `You are Luoga’s TikTok reply assistant. Answer the commenter directly. Be concise, friendly and useful. Match the language of the comment, especially Swahili or English. Never claim to be human. Do not provide dangerous instructions. Maximum 500 characters.`,
    input: prompt || 'Respond briefly and invite the commenter to ask a question.',
  });
  return response.output_text.trim().slice(0, 500);
}

export async function POST(req: NextRequest) {
  const expected = process.env.TIKTOK_WEBHOOK_SECRET;
  if (expected && req.headers.get('x-luoga-secret') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 });

  const event = String(body.event ?? body.event_type ?? '').toLowerCase();
  if (event && !event.includes('comment')) return NextResponse.json({ ignored: true, reason: 'not a comment event' });

  const comment = extractComment(body);
  if (!comment) return NextResponse.json({ ignored: true, reason: 'comment payload not recognized' });
  if (!comment.text!.toLowerCase().includes(TRIGGER)) return NextResponse.json({ ignored: true, reason: 'no @askAI trigger' });

  if (process.env.AUTO_REPLY !== 'true') {
    return NextResponse.json({ ok: true, mode: 'review', commentId: comment.comment_id, prompt: comment.text });
  }

  // Idempotency guard: don't answer a comment that already has replies.
  const existingReplies = await getReplies(comment.video_id!, comment.comment_id!);
  if (existingReplies.length > 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'comment already has a reply', commentId: comment.comment_id });
  }

  const prompt = comment.text!.replace(new RegExp(TRIGGER, 'ig'), '').trim();
  const reply = await generateReply(prompt);
  const result = await replyToComment(comment.video_id!, comment.comment_id!, reply);

  return NextResponse.json({ ok: true, published: true, commentId: comment.comment_id, reply, tiktok: result });
}

export async function GET() {
  return NextResponse.json({
    service: "Luoga’s Automation",
    status: 'ok',
    trigger: '@askAI',
    connected: Boolean(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_BUSINESS_ID && process.env.OPENAI_API_KEY),
  });
}
