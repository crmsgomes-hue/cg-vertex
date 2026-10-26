# CG VERTEX — Especificação técnica das fases 2 e 3

Documento de trabalho. Estado de cada ponto: ✅ implementado na app · 🟡 especificado, falta servidor · 🔵 especificado.

| # | Módulo | Estado |
| --- | --- | --- |
| A | Nuvem e sincronização (Supabase Auth + PostgreSQL + RLS) | 🟡 SQL pronto em [`supabase/migrations/0001_lexvortex_sync.sql`](../supabase/migrations/0001_lexvortex_sync.sql) |
| B | Alertas de prazos com a app fechada (Web Push) | 🟡 |
| C | Separação automática de oradores (diarização) | 🔵 |
| D | OCR de PDFs digitalizados | 🔵 |
| 1 | Despesas e custas processuais, integradas na nota de honorários | ✅ |
| 2 | CRM: leads, clientes ativos e contactos úteis | 🔵 |
| 3 | Tarefas internas e delegação | 🔵 (depende de A) |
| 4 | Assistente de IA para e-mails ao cliente | 🔵 |
| 5 | Preparação para notificações do Citius | 🔵 (parcial: leitura de datas em PDF ✅) |

---

## A. Nuvem e sincronização (local-first)

**Princípio:** o dispositivo continua a ser a fonte imediata (a app funciona sem rede); a nuvem é a cópia partilhada. A sincronização corre em segundo plano.

**Modelo:** cada tabela tem `(firm_id, id)` como chave, `data jsonb` com o mesmo objeto que a app já guarda, `deleted` (remoção suave), `updated_at` posto pelo servidor. RLS: só membros do escritório leem e escrevem (`is_member(firm_id)`).

**Autenticação:** Supabase Auth com código por e-mail (OTP de 6 dígitos — ajustar o modelo de e-mail para incluir `{{ .Token }}`); o PIN continua a ser o desbloqueio rápido local. Em produção, configurar SMTP próprio (o envio por defeito do Supabase tem limites baixos).

**Algoritmo de sincronização (sem instrumentar cada alteração):**
1. Para cada tabela local, calcular um *hash* (FNV-1a) do JSON de cada registo e comparar com o último *hash* sincronizado (`DB.sync.hash[tabela][id]`).
2. **Enviar:** registos com *hash* diferente → `upsert` (`onConflict: 'firm_id,id'`); ids que desapareceram localmente → `deleted = true`. Nos prazos, enviar também `due_date`, `grace_end` e `done` calculados pelo motor.
3. **Receber:** `select … where firm_id = ? and updated_at > cursor order by updated_at` (páginas de 1000); aplicar localmente (substituir ou remover) e atualizar *hash* e cursor.
4. Conflitos: a última escrita ganha (ordem do servidor). Edições feitas durante a sincronização seguem na volta seguinte.
5. Disparo: ao abrir a app, ao voltar online (`online`), 2 s depois de cada gravação local e a cada 60 s com a app aberta.
6. Ficheiros (áudio, documentos): enviar para `lexvortex-files/<firm_id>/<id>` e marcar `data.remote = true`; descarregar a pedido quando faltarem no dispositivo.

**Migração dos dados atuais:** no primeiro login sem escritório → `rpc('create_firm')`; com o *hash* vazio, todos os registos locais são enviados. Num segundo dispositivo, o primeiro *pull* traz tudo.

**IDs:** passar a gerar ids com `crypto.randomUUID()` para evitar colisões entre dispositivos.

## B. Alertas de prazos (Web Push)

- `manifest.json` + `sw.js` na raiz (GitHub Pages serve em https). O *service worker* trata `push` (`showNotification` com título, processo e dias restantes) e `notificationclick` (abre a app no processo).
- Chaves VAPID geradas uma vez; a pública vai na app, a privada num *Secret* do Supabase.
- Tabela `push_subscriptions (user_id, firm_id, endpoint, p256dh, auth, created_at)` com RLS por utilizador.
- Edge Function `lexvortex-alerts` (Deno + `npm:web-push`): seleciona prazos `not done and not deleted` com `due_date - current_date in (7,3,1,0)` ou em período de multa, e envia a cada membro do escritório.
- `pg_cron` diário às 07:30 UTC (08:30 em Lisboa no inverno) a chamar a função com `net.http_post`.
- iPhone: só funciona com a app instalada no ecrã principal (iOS 16.4 ou superior).

## C. Diarização

- O Whisper da Groq não identifica oradores. Proposta: manter o Whisper para o texto em direto (boa qualidade em português de Portugal) e, ao parar a gravação, enviar o áudio completo a um serviço com diarização (Deepgram ou AssemblyAI, ambos com `pt` e etiquetas de orador).
- Alinhar por tempo: cada segmento do Whisper recebe o orador cuja fala mais se sobrepõe. O advogado associa uma vez "Orador A → Juiz", e a app aplica a toda a gravação.
- Custos e qualidade em pt-PT a validar com gravações reais antes de escolher o fornecedor. Áudio de clientes só com contrato de subcontratação RGPD e alojamento/processamento compatíveis.

## D. OCR em PDFs digitalizados

- Quando o pdf.js não encontra texto, desenhar as primeiras 3 páginas num `canvas` (escala 2) e passar ao Tesseract.js 5 (jsDelivr) com a língua `por`; aplicar o mesmo `findDates`.
- O modelo de português (~10–15 MB) é descarregado uma vez e fica em cache. Mostrar progresso ("A ler página 2 de 3…").

---

## 1. Despesas e custas processuais ✅

**Implementado na app.** Em cada processo, secção "Despesas e custas".

```js
// DB.expenses[]
{ id, caseId, date: 'AAAA-MM-DD', cat: 'taxa'|'custas'|'certidao'|'desloc'|'perito'|'correio'|'traducao'|'outra',
  desc, amount, reemb: true /* paga em nome e por conta do cliente */, paidBy: 'office'|'client',
  billed: false, feeId: null, created }
```

**Regras fiscais aplicadas:**
- `reemb = true` (por defeito em taxas de justiça, custas, certidões e peritos): reembolso **sem IVA e sem retenção** (art. 16.º, n.º 6, al. c) do CIVA).
- `reemb = false` (deslocações, traduções, portes…): soma à base tributável dos honorários (IVA 23% e retenção, quando aplicável).
- `paidBy = 'client'`: só registo, nunca é debitada.

**Integração com honorários:** ao criar uma nota de honorários para um processo, as despesas por debitar aparecem já marcadas; ao guardar:

```
hon        = honorários indicados
H          = hon + Σ despesas com IVA          → base de IVA e de retenção
exp        = outras despesas + Σ reembolsos     → somado no fim, sem impostos
total      = H + IVA(H) − retenção(H) + exp
```

As despesas ficam `billed = true` com `feeId`; apagar o rascunho devolve-as a "por debitar". O registo de tempo também inclui as despesas abertas. Cada nota tem **PDF** com honorários, despesas com IVA, IVA, retenção, reembolsos e total; ao emitir recebe número sequencial anual (`2026/001`). A nota é documento interno: a fatura-recibo continua a ser emitida no Portal das Finanças ou em programa certificado.

**SQL (fase A):** tabela `expenses` incluída na migração.

## 2. CRM: leads, clientes ativos e contactos úteis

```js
// DB.clients[] ganha:
{ status: 'lead'|'active'|'former', source: 'recomendação'|'site'|'telefone'|…, firstContact: 'AAAA-MM-DD',
  consult: { date, fee, paid, notes }, nextStep: { date, text }, lostReason }
// DB.contacts[] — caderneta do escritório
{ id, kind: 'magistrado'|'oficial_justica'|'conservatoria'|'perito'|'seguradora'|'colega'|'outro',
  name, org, role, phone, email, address, notes, caseIds: [] }
```

- Vista "Contactos" com três separadores: **Leads**, **Clientes**, **Caderneta**. Filtros por tipo e pesquisa.
- Lead → cliente: botão "Converter em cliente e abrir processo", que cria o processo já com o cliente.
- Funil simples: leads do mês, taxa de conversão e valor das consultas iniciais.
- Contactos úteis ligáveis a processos (ex.: perito nomeado, seguradora da parte contrária); chamada e e-mail com um toque (`tel:`, `mailto:`).
- RGPD: base legal e prazo de conservação para leads não convertidos (ex.: apagar ao fim de 12 meses, com aviso).

## 3. Tarefas internas e delegação

```js
// DB.tasks[]
{ id, caseId|null, title, notes, status: 'todo'|'doing'|'done', priority: 'normal'|'alta',
  assignee: userId, createdBy: userId, due: 'AAAA-MM-DD', linkedDeadlineId|null, doneAt }
```

- Vista "Tarefas" em colunas Por fazer / Em curso / Concluído (deslizar na horizontal no telemóvel), filtros "As minhas" e "Todas".
- Criar tarefa a partir de um prazo (ex.: "Preparar contestação" com prazo interno 3 dias úteis antes do termo).
- **Depende da fase A** (equipa partilhada): atribuição a membros do escritório (`members`); RLS — estagiários e administrativos veem as tarefas atribuídas e as do escritório; só advogados apagam.
- Alertas de tarefas em atraso pelo mesmo mecanismo Web Push.

## 4. Assistente de IA para e-mails ao cliente

- Botão no processo: **"Gerar e-mail de atualização ao cliente"**. Contexto enviado: fase, últimos prazos e marcações, últimas transcrições/notas escolhidas pelo advogado, e (opcional) o texto do último documento.
- Edge Function `lexvortex-assist` (mesmo padrão da transcrição), com modelo de linguagem; instruções: português de Portugal, linguagem clara, sem juridiquês, sem prometer resultados, sem inventar factos, com os próximos passos e datas.
- Minimização de dados: enviar só o necessário e substituir NIF, moradas e IBAN por marcadores.
- Saída editável na app; "Abrir no e-mail" (`mailto:` com assunto e corpo) ou copiar. O advogado revê sempre antes de enviar.

## 5. Preparação para notificações do Citius

O Citius não disponibiliza API pública a terceiros; o desenho assenta em **importar** e **confirmar**, nunca em acesso automático ao portal.

```js
// DB.inbox[] — notificações por confirmar
{ id, source: 'pdf'|'email'|'manual', receivedAt, fileId|null, rawText,
  parsed: { caseNumber, court, actType, elaborationDate, deadlineDays, confidence },
  status: 'pending'|'confirmed'|'discarded', deadlineId|null }
```

- **Importar PDF** (já existe a leitura de datas ✅): acrescentar extração do n.º de processo (`/\d{1,6}\/\d{2}\.\d[A-Z0-9]{1,8}/`), associação automática ao processo com esse número e sugestão do tipo de ato.
- **E-mail:** endereço de receção dedicado (ex.: Cloudflare Email Routing ou Postmark Inbound → Edge Function) para o advogado reencaminhar os avisos; a função extrai o texto e cria um item na caixa de entrada.
- **Caixa de entrada** na app: cada notificação mostra processo, data de elaboração e prazo proposto (motor da secção Prazos, art. 248.º CPC); **o advogado confirma** e o prazo é criado. Nada é criado sem confirmação.
