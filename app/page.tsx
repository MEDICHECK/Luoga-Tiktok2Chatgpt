export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: '60px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>Luoga&apos;s Automation</h1>
      <p>TikTok comments → <b>@askAI</b> → OpenAI → TikTok reply.</p>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {[
          ['1', 'Connect TikTok', 'Authorize your TikTok account with the Business Organic API and configure the webhook.'],
          ['2', 'Trigger', 'A viewer writes @askAI in a comment on one of your owned videos.'],
          ['3', 'Generate', 'Luoga removes the trigger and asks OpenAI for a concise Swahili or English answer.'],
          ['4', 'Publish', 'When automatic mode is enabled, Luoga replies directly to the TikTok comment.'],
        ].map(([n, t, d]) => (
          <section key={n} style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20 }}>
            <b>{n}</b><h2>{t}</h2><p>{d}</p>
          </section>
        ))}
      </div>
      <p style={{ marginTop: 30, color: '#666' }}>
        Webhook: <code>/api/tiktok/webhook</code> · Health: <code>GET /api/tiktok/webhook</code>
      </p>
      <p style={{ color: '#666' }}>
        Start with <code>AUTO_REPLY=false</code>, verify the generated responses, then enable automatic replies.
      </p>
    </main>
  );
}
