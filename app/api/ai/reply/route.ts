import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { comment, language = 'auto' } = await req.json().catch(() => ({}));
  if (typeof comment !== 'string' || !comment.trim()) {
    return NextResponse.json({ error: 'comment is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: `You are Luoga AI, a creator copilot for African TikTok creators. Write a natural, concise reply to the viewer. Match the viewer's language; support Swahili and English. Never claim to be human. Avoid unsafe instructions. Maximum 500 characters. Language hint: ${language}.`,
    input: comment.trim(),
  });

  return NextResponse.json({ reply: response.output_text.trim().slice(0, 500) });
}
