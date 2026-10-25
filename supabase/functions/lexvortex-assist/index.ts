import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LEXVORTEX — assistente de comunicação com o cliente (modelo de linguagem na Groq).
// Não guarda dados: recebe o contexto do processo e devolve um rascunho de e-mail.
// A chave da Groq vem do Secret GROQ_API_KEY do projeto Supabase.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const PREFERRED = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
let cachedModels: string[] | null = null;

async function availableModels(key: string): Promise<string[]> {
  if (cachedModels) return cachedModels;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) return PREFERRED;
    const ids: string[] = ((await r.json()).data || []).map((m: any) => m.id);
    const ordered = PREFERRED.filter((m) => ids.includes(m));
    const extra = ids.filter((m) => !ordered.includes(m) && !/whisper|tts|guard|vision|embed|distil|playai|orpheus|compound/i.test(m));
    cachedModels = ordered.length ? ordered : extra.slice(0, 3);
    return cachedModels.length ? cachedModels : PREFERRED;
  } catch {
    return PREFERRED;
  }
}

const SYSTEM = `És o assistente de um escritório de advogados em Portugal. Escreves e-mails para clientes em português europeu (de Portugal, não do Brasil), claros, simples e cordiais, sem juridiquês: quando um termo jurídico for indispensável, explica-o numa frase curta.
Regras obrigatórias:
- Usa apenas os factos, datas e valores que estão nos dados. Nunca inventes nada. Se faltar informação, escreve de forma genérica.
- Nunca prometas resultados nem dês probabilidades de ganhar.
- Não dês conselhos jurídicos para além do que está nos dados.
- Datas por extenso (ex.: 12 de novembro de 2026).
- Estrutura: saudação; ponto da situação; próximos passos com datas; o que se pede ao cliente, se houver; disponibilidade para esclarecimentos; despedida com o nome do advogado.
- Tom: "formal" = tratamento por "Exmo./Exma. Senhor(a)" e "V. Exa."; "proximo" = cordial e direto, tratamento pelo nome.
Responde apenas com um objeto JSON: {"assunto": "...", "corpo": "..."}. No corpo usa quebras de linha normais.`;

function parseOut(text: string) {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    const o = JSON.parse(m ? m[0] : text);
    if (o.assunto && o.corpo) return { assunto: String(o.assunto), corpo: String(o.corpo) };
  } catch { /* segue */ }
  const s = text.match(/assunto\s*:\s*(.+)/i);
  return { assunto: s ? s[1].trim() : "Ponto da situação do seu processo", corpo: text.replace(/assunto\s*:.+\n?/i, "").trim() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const key = Deno.env.get("GROQ_API_KEY");
  if (req.method === "GET") return json({ ok: true, configured: !!key, models: key ? await availableModels(key) : [] });
  if (!key) return json({ error: "not_configured" }, 503);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  if (body?.task !== "client_email" || typeof body.context !== "object") return json({ error: "bad_request" }, 400);
  const ctx = JSON.stringify(body.context).slice(0, 12000);
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: "Escreve o e-mail de atualização ao cliente com base nestes dados (JSON):\n" + ctx },
  ];
  let lastErr = "";
  for (const model of await availableModels(key)) {
    for (const jsonMode of [true, false]) {
      const payload: any = { model, messages, temperature: 0.3, max_tokens: 1400 };
      if (jsonMode) payload.response_format = { type: "json_object" };
      let r: Response;
      try {
        r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch { return json({ error: "upstream_unreachable" }, 502); }
      if (r.status === 401) return json({ error: "not_configured" }, 503);
      if (r.status === 429) return json({ error: "rate_limited", retry_after: r.headers.get("retry-after") }, 429);
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content || "";
        if (text.trim()) return json({ ...parseOut(text), model });
        lastErr = "empty";
        continue;
      }
      lastErr = (await r.text()).slice(0, 300);
      if (jsonMode && /response_format|json/i.test(lastErr)) continue;
      break;
    }
  }
  return json({ error: "upstream_error", detail: lastErr }, 502);
});
