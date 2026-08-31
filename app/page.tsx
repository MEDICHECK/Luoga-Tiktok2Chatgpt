'use client';

import { useState } from 'react';

const plans = [
  ['Free', '$0', '10 AI replies/month'],
  ['Creator', '$5/mo', '500 AI replies + content tools'],
  ['Pro', '$15/mo', '2,000 replies + analytics'],
  ['Agency', '$49/mo', 'Multiple creators + team tools'],
];

export default function Home() {
  const [comment, setComment] = useState('Habari Luoga, nifanye nini ili video yangu iwe viral?');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setReply('');
    try {
      const r = await fetch('/api/ai/reply', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ comment }) });
      const data = await r.json();
      setReply(data.reply || data.error || 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <main style={{maxWidth:1100, margin:'0 auto', padding:'56px 24px', fontFamily:'system-ui'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:20}}>
        <strong style={{fontSize:24}}>LUOGA AI</strong>
        <a href="#pricing">Pricing</a>
      </header>

      <section style={{padding:'80px 0 50px', maxWidth:820}}>
        <p style={{fontWeight:700}}>AFRICA-FIRST CREATOR COPILOT</p>
        <h1 style={{fontSize:'clamp(42px,7vw,76px)', lineHeight:1.02, margin:'12px 0'}}>Turn every comment into your next piece of content.</h1>
        <p style={{fontSize:20, lineHeight:1.5}}>Luoga understands Swahili and English, writes creator-ready replies, turns questions into scripts, and helps creators publish better content.</p>
        <a href="#demo" style={{display:'inline-block', marginTop:18, padding:'14px 22px', borderRadius:12, background:'#111', color:'#fff', textDecoration:'none'}}>Try Luoga free</a>
      </section>

      <section id="demo" style={{border:'1px solid #ddd', borderRadius:20, padding:28, marginBottom:60}}>
        <h2>Live AI reply demo</h2>
        <p>Paste a TikTok comment and generate a concise reply.</p>
        <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={4} style={{width:'100%', padding:14, borderRadius:12, border:'1px solid #ccc', boxSizing:'border-box'}} />
        <button onClick={generate} disabled={loading} style={{marginTop:12, padding:'12px 18px', borderRadius:10}}>{loading?'Generating…':'Generate reply'}</button>
        {reply && <div style={{marginTop:18, padding:18, background:'#f5f5f5', borderRadius:12}}><strong>Luoga:</strong><p>{reply}</p></div>}
      </section>

      <section style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16}}>
        {['Comment → Reply','Comment → Script','Swahili + English','Content Calendar'].map((x,i)=><article key={x} style={{padding:22,border:'1px solid #ddd',borderRadius:16}}><b>0{i+1}</b><h3>{x}</h3><p>Built for creators who want to save time and publish consistently.</p></article>)}
      </section>

      <section id="pricing" style={{padding:'70px 0'}}>
        <h2>Simple creator pricing</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
          {plans.map(([name,price,desc])=><article key={name} style={{border:'1px solid #ddd',borderRadius:16,padding:22}}><h3>{name}</h3><div style={{fontSize:30,fontWeight:800}}>{price}</div><p>{desc}</p><button style={{padding:'10px 14px',borderRadius:10}}>Choose {name}</button></article>)}
        </div>
        <p style={{marginTop:18,color:'#666'}}>Payments are intentionally not activated until a payment provider is connected. TikTok publishing is enabled only for the scopes/capabilities approved for the creator's account.</p>
      </section>

      <footer style={{padding:'30px 0',borderTop:'1px solid #ddd',color:'#666'}}>Luoga AI · AI that speaks your audience's language.</footer>
    </main>
  );
}
