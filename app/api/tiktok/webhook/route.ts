import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRIGGER = '@askai';

export async function POST(req: NextRequest) {
  const expected = process.env.TIKTOK_WEBHOOK_SECRET;
  if (expected && req.headers.get('x-luoga-secret') !== expected) return NextResponse.json({error:'unauthorized'},{status:401});
  const body = await req.json().catch(()=>null);
  if (!body) return NextResponse.json({error:'invalid json'},{status:400});

  const comment = String(body.comment?.text ?? body.comment_text ?? body.text ?? '').trim();
  const commentId = String(body.comment?.id ?? body.comment_id ?? '');
  if (!comment || !comment.toLowerCase().includes(TRIGGER)) return NextResponse.json({ignored:true});

  const prompt = comment.replace(new RegExp(TRIGGER,'ig'),'').trim();
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: 'You are Luoga’s TikTok reply assistant. Answer the commenter directly. Be concise, friendly and useful. Match the language of the comment (especially Swahili or English). Do not claim to be human. Do not give dangerous instructions. Maximum 500 characters.',
    input: prompt || 'Respond briefly and invite the commenter to ask a question.'
  });
  const reply = response.output_text.trim();

  // TikTok comment publishing is intentionally delegated to an approved adapter.
  // This avoids pretending that an unavailable/public endpoint exists. Set TIKTOK_REPLY_URL
  // only when your TikTok app has an authorized endpoint for comment replies.
  let published = false;
  if (process.env.TIKTOK_REPLY_URL && process.env.AUTO_REPLY === 'true') {
    const r = await fetch(process.env.TIKTOK_REPLY_URL,{method:'POST',headers:{'content-type':'application/json',...(process.env.TIKTOK_ACCESS_TOKEN?{authorization:`Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`}:{})},body:JSON.stringify({comment_id:commentId,text:reply})});
    published = r.ok;
  }
  return NextResponse.json({ok:true,commentId,reply,published,mode:published?'automatic':'review'});
}

export async function GET(){return NextResponse.json({service:'Luoga’s Automation',status:'ok',trigger:'@askAI'});}
