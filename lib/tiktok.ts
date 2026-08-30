const BASE = 'https://business-api.tiktok.com/open_api/v1.3';

function authHeaders() {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error('Missing TIKTOK_ACCESS_TOKEN');
  return { 'Access-Token': token, 'Content-Type': 'application/json' };
}

export type TikTokComment = {
  comment_id?: string;
  video_id?: string;
  text?: string;
  create_time?: string | number;
  unique_identifier?: string;
  user_id?: string;
  parent_comment_id?: string;
  [key: string]: unknown;
};

async function parse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== undefined && json.code !== 0) {
    throw new Error(`TikTok API ${res.status}: ${json.message || 'request failed'}`);
  }
  return json;
}

export async function getComments(videoId: string) {
  const res = await fetch(`${BASE}/business/comment/list/`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ business_id: process.env.TIKTOK_BUSINESS_ID, video_id: videoId, status: 'PUBLIC' }),
    cache: 'no-store',
  });
  const json = await parse(res);
  return (json.data?.comments || json.data?.list || []) as TikTokComment[];
}

export async function getReplies(videoId: string, commentId: string) {
  const res = await fetch(`${BASE}/business/comment/reply/list/`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ business_id: process.env.TIKTOK_BUSINESS_ID, video_id: videoId, comment_id: commentId, status: 'ALL' }),
    cache: 'no-store',
  });
  const json = await parse(res);
  return (json.data?.comments || json.data?.replies || json.data?.list || []) as TikTokComment[];
}

export async function replyToComment(videoId: string, commentId: string, text: string) {
  const res = await fetch(`${BASE}/business/comment/reply/create/`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ business_id: process.env.TIKTOK_BUSINESS_ID, video_id: videoId, comment_id: commentId, text }),
    cache: 'no-store',
  });
  return parse(res);
}

export async function getBusinessVideos() {
  const fields = JSON.stringify(['item_id', 'caption', 'comments', 'create_time']);
  const url = `${BASE}/business/video/list/?business_id=${encodeURIComponent(process.env.TIKTOK_BUSINESS_ID || '')}&fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  const json = await parse(res);
  return (json.data?.videos || json.data?.list || []) as Array<{item_id?: string; [key: string]: unknown}>;
}

export function extractComment(body: any): TikTokComment | null {
  let root = body;
  if (typeof body?.content === 'string') {
    try { root = { ...body, ...JSON.parse(body.content) }; } catch { /* keep root */ }
  }
  const c = root?.comment || root?.data?.comment || root?.data || root;
  if (!c) return null;
  const commentId = String(c.comment_id ?? c.id ?? root?.comment_id ?? root?.data?.comment_id ?? '');
  const videoId = String(c.video_id ?? c.item_id ?? root?.video_id ?? root?.data?.video_id ?? '');
  const text = String(c.text ?? c.comment_text ?? c.content ?? '').trim();
  if (!commentId || !videoId || !text) return null;
  return { ...c, comment_id: commentId, video_id: videoId, text };
}
