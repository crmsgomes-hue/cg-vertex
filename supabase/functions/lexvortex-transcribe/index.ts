import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// LEXVORTEX — transcrição de excertos de áudio com Whisper Large v3 (Groq).
// Não guarda áudio nem texto: recebe um excerto, devolve o texto e esquece.
// A chave da Groq vem do Secret GROQ_API_KEY do projeto Supabase (nunca no código).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MAX_BYTES = 24 * 1024 * 1024;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const key = Deno.env.get("GROQ_API_KEY");
  if (req.method === "GET") {
    if (!key) return json({ ok: true, configured: false, status: 0 });
    try {
      const t = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
      return json({ ok: true, configured: t.ok, status: t.status });
    } catch {
      return json({ ok: true, configured: false, status: 0 });
    }
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!key) return json({ error: "not_configured" }, 503);

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "bad_request" }, 400); }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "no_file" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "too_large" }, 413);
  if (file.size < 2000) return json({ text: "", segments: [] });

  const prompt = String(form.get("prompt") || "").slice(-800);
  const out = new FormData();
  out.append("file", file, file.name || "excerto.wav");
  out.append("model", "whisper-large-v3");
  out.append("language", "pt");
  out.append("temperature", "0");
  out.append("response_format", "verbose_json");
  out.append("prompt", "Transcrição em português de Portugal, com pontuação correta, de uma diligência ou reunião jurídica: Meritíssimo Juiz, Excelência, mandatário, testemunha, autor, réu, contestação, requerimento, despacho, sentença, artigo, n.º, alínea, Código de Processo Civil. " + prompt);

  let r: Response;
  try {
    r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: out,
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }
  if (r.status === 401) return json({ error: "not_configured" }, 503);
  if (r.status === 429) return json({ error: "rate_limited", retry_after: r.headers.get("retry-after") }, 429);
  if (!r.ok) return json({ error: "upstream_error", status: r.status, detail: (await r.text()).slice(0, 300) }, 502);

  const data = await r.json();
  // Remove segmentos que o Whisper costuma inventar no silêncio
  const HALLU = /^(legendas|obrigad[oa] por (ver|assistir)|subscreve|inscreve-te|\.+|…)$/i;
  const segments = (data.segments || [])
    .filter((s: any) => (s.no_speech_prob ?? 0) < 0.6 && (s.avg_logprob ?? 0) > -1.2)
    .map((s: any) => ({ start: s.start, end: s.end, text: String(s.text || "").trim() }))
    .filter((s: any) => s.text && !HALLU.test(s.text));
  return json({ text: segments.map((s: any) => s.text).join(" "), segments });
});
