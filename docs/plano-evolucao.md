# LEXVORTEX — Plano de evolução (3 vertentes)

Estado: ✅ na app · 🟡 especificado, depende do servidor próprio · 🔵 especificado · ⚪ por especificar

## Fases

| Fase | Conteúdo | Estado |
| --- | --- | --- |
| 1 | Prazos CPC/CPT/CC, processos, agenda, minutas, honorários, gravação e transcrição (Whisper), exportação PDF/Word | ✅ |
| 2 | Incidentes de prazos · DUC e taxas de justiça (RCP) · despesas · CRM e conflito de interesses · tarefas · e-mail ao cliente com IA · OCR · caixa de notificações do Citius | ✅ (dados neste dispositivo) |
| 3 | Nuvem e sincronização · alertas Web Push · tarefas partilhadas pela equipa · portal do cliente | 🟡 SQL em `supabase/migrations/0001_lexvortex_sync.sql` |
| 4 | Meios de prova · prescrição · relatório de diligências · calculadora de juros · arquivo físico · diarização | 🔵 |

---

## Vertente 2 — Risco processual

### Incidentes de prazos ✅

Cada prazo tem `incidents[]`; o motor recalcula o termo e explica cada passo.

| Tipo | Efeito no cálculo | Base legal sugerida |
| --- | --- | --- |
| Suspensão `{from, to\|null}` | Os dias dentro do período não contam. Sem fim: suspensão em curso, termo **provisório** (contado até hoje) e estado «Suspenso» | art. 275.º CPC; por acordo das partes, art. 272.º, n.º 4 |
| Prorrogação `{days}` | Soma dias ao prazo antes da contagem | ex.: contestação, até 30 dias, art. 569.º, n.º 4 CPC |
| Interrupção `{from, to\|null}` | O prazo recomeça por inteiro a partir da notificação `to` (presunção do art. 248.º); sem notificação: provisório | apoio judiciário, art. 24.º, n.ºs 4 e 5 da Lei n.º 34/2004 |
| Termo fixado `{date}` | Substitui o termo calculado (o período de multa conta a partir dele) | despacho judicial; justo impedimento, art. 140.º CPC |

Notas: o art. 139.º, n.º 5 CPC (3 dias úteis com multa) é sempre calculado e não é uma prorrogação. Os prazos com incidente mostram o número de incidentes na lista e o painel «Como foi contado».

### Taxas de justiça e DUC ✅

```js
DB.ducs[] = { id, caseId, deadlineId|null, act, ref, amount, issued, paid|null, proof:boolean, aj:boolean }
```

- Atos que exigem taxa (contestação, apelação, embargos, recurso laboral) mostram «Sem DUC», «Taxa por pagar» ou «Taxa paga».
- **Validação ao entregar:** marcar «Entregue» sem taxa paga pede confirmação (art. 145.º CPC — a peça deve ser acompanhada do comprovativo do pagamento ou do apoio judiciário).
- **Alerta no ecrã Hoje** para atos com termo em 10 dias ou menos e taxa por pagar.
- **Pagamento → despesa:** o DUC pago entra automaticamente nas despesas do processo (reembolso sem IVA) para a nota de honorários.
- **Estimativa pelo RCP, Tabela I** (A geral, B, C), a partir do valor da causa; valor da UC configurável (por defeito 102 €); acima de 275 000 € mostra o acréscimo pago a final (3 UC por cada 25 000 € ou fração, coluna A). Estimativa — confirmar sempre no DUC emitido.

### Meios de prova por processo 🔵

```js
DB.evidence[] = { id, caseId, kind:'testemunha'|'documento'|'pericia'|'depoimento'|'inspecao',
  name, address, contact, toNotify:boolean, notifiedAt, status:'a_indicar'|'indicada'|'notificada'|'ouvida'|'prescindida',
  docStatus:'pendente'|'pedido'|'junto', requestedFrom, deadline, quesitos:[{n,text}], notes }
```
- Checklist por processo com contagem (ex.: «3 de 5 testemunhas notificadas»), alerta de documentos pendentes antes da audiência e limite de testemunhas configurável (ex.: art. 511.º CPC).
- Exportar rol de testemunhas e quesitos para Word, prontos a juntar.

### Prescrição e caducidade (direito substantivo) 🔵

```js
DB.limitations[] = { id, clientId|caseId, right, regime, startDate, years|months|days, basis,
  interruptions:[{date, act}], dueDate, status }
```
- Catálogo inicial (a validar por jurista): prescrição ordinária 20 anos (art. 309.º CC); 5 anos (art. 310.º CC); responsabilidade extracontratual 3 anos desde o conhecimento do direito (art. 498.º CC); créditos laborais 1 ano após a cessação (art. 337.º CT); presuntivas (arts. 316.º e 317.º CC).
- Interrupção por citação/notificação judicial (art. 323.º CC) reinicia a contagem (art. 326.º CC). Contagem pelo art. 279.º CC (motor já existente, regime substantivo).
- Alertas a 90, 30 e 7 dias; ligação a leads e clientes antes de existir processo.

### Relatório de diligências e trabalho invisível 🔵

- Junta numa linha temporal o que já existe: registo de tempo, despesas, marcações, transcrições, documentos e prazos cumpridos, com filtro por período.
- PDF para o cliente com resumo opcional em linguagem clara (mesma função de IA do e-mail), sem dados internos.

---

## Vertente 3 — Escritório, CRM e inteligência

| Módulo | Estado | Notas |
| --- | --- | --- |
| Despesas e custas na nota de honorários | ✅ | reembolsos sem IVA (art. 16.º, n.º 6, al. c) CIVA); despesas com IVA somam à base |
| CRM: leads, clientes, caderneta | ✅ | conversão lead → cliente → processo; consulta inicial; próximo passo; taxa de conversão |
| Conflito de interesses | ✅ | ao criar processo ou lead: cliente que é parte contrária noutro processo, ou parte contrária que é cliente; nomes comparados sem acentos e sem «Lda», «S.A.»; pede confirmação |
| Tarefas e delegação | ✅ local · 🟡 partilha | colunas Por fazer / Em curso / Concluído; equipa no Perfil; tarefa a partir de um prazo (3 dias úteis antes do termo) |
| E-mail ao cliente com IA | ✅ | Edge Function `lexvortex-assist` (Groq); sem NIF, IBAN, CC nem moradas; português de Portugal; sem prometer resultados; revisão obrigatória |
| Calculadora de juros e taxas | 🔵 | juros civis (taxa legal, Portaria n.º 291/2003) e comerciais (taxa supletiva semestral publicada pela DGTF) com tabela de períodos editável; taxa de justiça pelo RCP já disponível no processo |
| Portal do cliente | 🟡 | depende da nuvem: link com token + PIN, só leitura (fase, próximas datas, documentos e relatórios partilhados); RLS dedicada; registo de acessos |
| Arquivo físico | 🔵 | `case.archive = {location, cabinet, shelf, box, folder, out:{to, since}}`; pesquisa por localização; etiqueta com QR que abre o processo |

## Vertente 1 — Infraestrutura

| Módulo | Estado | Notas |
| --- | --- | --- |
| Nuvem e sincronização | 🟡 | ver `docs/especificacao-fase-2-3.md` (secção A) e a migração SQL; local-first por *hash* de registos, `upsert` e `updated_at` |
| Alertas Web Push | 🟡 | service worker + VAPID + `pg_cron` diário; inclui prazos, taxas por pagar e prescrições |
| OCR | ✅ | Tesseract.js 5 (português) em PDFs digitalizados e fotografias, a pedido |
| Diarização | 🔵 | Deepgram ou AssemblyAI sobre o áudio completo, alinhado com o texto do Whisper; avaliar qualidade em pt-PT, custo e RGPD |

## Aviso

Bases legais, valores e tabelas devem ser revistos por um jurista antes de uso comercial. As estimativas não substituem a análise do profissional.
