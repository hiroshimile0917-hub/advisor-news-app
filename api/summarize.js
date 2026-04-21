export const config = { runtime: 'edge' };

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `あなたは金融アドバイザー向けニュース要約AIです。
以下のルールに従って記事を要約してください：
1. 要約は3行以内の日本語で記述する
2. アドバイザーが顧客に説明しやすい簡潔な表現を使う
3. 数値・社名・固有名詞は省略せず正確に記載する
4. 最後に投資への影響度を「影響度：高／中／低」の形式で1行追加する`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { title, text } = body;
  if (!title && !text) {
    return new Response(JSON.stringify({ error: 'title or text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userContent = [
    title ? `【タイトル】${title}` : '',
    text  ? `【本文】${text}`     : '',
  ].filter(Boolean).join('\n\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 300,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'Claude API error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const raw  = data.content?.[0]?.text ?? '';

    // parse impact level from last line "影響度：高"
    const impactMatch = raw.match(/影響度[：:]\s*(高|中|低)/);
    const impact  = impactMatch?.[1] ?? null;
    const summary = raw.replace(/影響度[：:]\s*(高|中|低)\s*$/, '').trim();

    return new Response(JSON.stringify({ summary, impact }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Request failed', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
