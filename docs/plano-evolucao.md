# CG VERTEX — Plano de evolução (3 vertentes)

Estado: ✅ na app · 🟡 especificado, depende do servidor próprio · 🔵 especificado · ⚪ por especificar

## Fases

| Fase | Conteúdo | Estado |
| --- | --- | --- |
| 1 | Prazos CPC/CPT/CC, processos, agenda, minutas, honorários, gravação e transcrição (Whisper), exportação PDF/Word | ✅ |
| 2 | Incidentes de prazos · DUC e taxas de justiça (RCP) · despesas · CRM e conflito de interesses · tarefas · e-mail ao cliente com IA · OCR · caixa de notificações do Citius | ✅ (dados neste dispositivo) |
| 3 | Nuvem e sincronização · alertas Web Push · tarefas partilhadas pela equipa · portal do cliente | 🟡 SQL em `supabase/migrations/0001_lexvortex_sync.sql` |
| 4 | Meios de prova ✅ · prescrição e caducidade ✅ · relatório de diligências · calculadora de juros · arquivo físico · diarização | 🔵 |

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

### Meios de prova por processo ✅

```js
DB.evidence[] = { id, caseId, kind:'testemunha'|'documento'|'pericia'|'depoimento'|'inspecao',
  name, address, contact, toNotify:boolean, notifiedAt, status:'a_indicar'|'indicada'|'notificada'|'ouvida'|'prescindida',
  docStatus:'pendente'|'pedido'|'junto', requestedFrom, deadline, quesitos:[{n,text}], notes }
```
- Checklist por processo com contagem (ex.: «3 de 5 testemunhas notificadas»), alerta de documentos pendentes antes da audiência e limite de testemunhas configurável (ex.: art. 511.º CPC).
- Exportar rol de testemunhas e quesitos para Word, prontos a juntar.

### Prescrição e caducidade (direito substantivo) ✅

Implementado: catálogo de 11 tipos com base legal, contagem pelo art. 279.º CC (incluindo meses e anos sem dia correspondente), interrupções que reiniciam o prazo (art. 326.º CC), data-limite para instaurar a ação 5 dias antes do termo na prescrição (art. 323.º, n.º 2 CC), regra própria da caducidade (art. 331.º CC), alertas no ecrã Hoje e ligação a clientes, leads e processos.


```js
DB.limitations[] = { id, clientId|caseId, right, regime, startDate, years|months|days, basis,
  interruptions:[{date, act}], dueDate, status }
```
- Catálogo inicial (a validar por jurista): prescrição ordinária 20 anos (art. 309.º CC); 5 anos (art. 310.º CC); responsabilidade extracontratual 3 anos desde o conhecimento do direito (art. 498.º CC); créditos laborais 1 ano após a cessação (art. 337.º CT); presuntivas (arts. 316.º e 317.º CC).
- Interrupção por citação/notificação judicial (art. 323.º CC) reinicia a contagem (art. 326.º CC). Contagem pelo art. 279.º CC (motor já existente, regime substantivo).
- Alertas a 90, 30 e 7 dias; ligação a leads e clientes antes de existir processo.

### Relatório de diligências e trabalho invisível ✅

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
| Calculadora de juros e taxas | ✅ | juros civis (taxa legal, Portaria n.º 291/2003) e comerciais (taxa supletiva semestral publicada pela DGTF) com tabela de períodos editável; taxa de justiça pelo RCP já disponível no processo |
| Portal do cliente | ✅ ficha cifrada · 🟡 portal online | já disponível como ficheiro cifrado com PIN; o portal online depende da nuvem: link com token + PIN, só leitura (fase, próximas datas, documentos e relatórios partilhados); RLS dedicada; registo de acessos |
| Arquivo físico | ✅ | `case.archive = {location, cabinet, shelf, box, folder, out:{to, since}}`; pesquisa por localização; etiqueta com QR que abre o processo |

## Vertente 1 — Infraestrutura

| Módulo | Estado | Notas |
| --- | --- | --- |
| Nuvem e sincronização | 🟡 | ver `docs/especificacao-fase-2-3.md` (secção A) e a migração SQL; local-first por *hash* de registos, `upsert` e `updated_at` |
| Alertas Web Push | 🟡 | service worker + VAPID + `pg_cron` diário; inclui prazos, taxas por pagar e prescrições |
| OCR | ✅ | Tesseract.js 5 (português) em PDFs digitalizados e fotografias, a pedido |
| Diarização | 🔵 | Deepgram ou AssemblyAI sobre o áudio completo, alinhado com o texto do Whisper; avaliar qualidade em pt-PT, custo e RGPD |

## Aviso

Bases legais, valores e tabelas devem ser revistos por um jurista antes de uso comercial. As estimativas não substituem a análise do profissional.

---

## Refinamento final da advocacia de trincheira

### 1. Processos urgentes e férias judiciais ✅

- A urgência é uma **propriedade do processo** (`case.urgentLegal`, `urgentType`, `urgentBasis`) e o motor aplica-a a todos os prazos do processo, incluindo os já criados; mudar a natureza do processo recalcula tudo.
- Catálogo com base legal: procedimento cautelar (art. 363.º, n.º 1 CPC), insolvência e PER (art. 9.º, n.º 1 CIRE), tutelar cível (art. 13.º RGPTC), promoção e proteção (art. 102.º, n.º 1 LPCJP), penal com arguido detido ou preso (arts. 103.º, n.º 2, al. a) e 104.º, n.º 2 CPP), impugnação do despedimento (art. 26.º, n.º 1 CPT), urgentes administrativos (art. 36.º CPTA), outro (base livre).
- Regras do motor (art. 138.º, n.º 1 CPC): os prazos não se suspendem em férias judiciais (art. 28.º LOSJ: 22 dez–3 jan, Domingo de Ramos–Segunda-feira de Páscoa, 16 jul–31 ago) quando o processo é urgente ou o prazo é de 6 meses ou mais; o termo em sábado, domingo, feriado ou tolerância continua a passar para o dia útil seguinte (art. 138.º, n.º 2); os dias de férias contados são assinalados na linha temporal e na explicação.
- Ecrã Hoje: aviso durante as férias judiciais (e 10 dias antes de começarem) com o número de processos urgentes que continuam a contar.

### 2. Mandatos, procurações e substabelecimentos ✅

```js
DB.mandates[] = { id, caseId, clientId, kind: 'procuracao'|'substabelecimento', date, grantor, grantee,
  powers: { gerais: true, confessar, desistir, transigir, substabelecer, receber },
  reserve: 'com'|'sem'|null, status: 'em_vigor'|'substabelecida_com_reserva'|'substabelecida_sem_reserva'|'revogada'|'renunciada'|'caducada',
  endDate, docId }
```
- Estado por processo e aviso se não houver procuração em vigor junta.
- Poderes especiais (art. 45.º, n.º 2 CPC) verificados antes de minutas de confissão, desistência ou transação: aviso «a procuração não confere poderes para transigir».
- Substabelecimento sem reserva retira o mandatário anterior; com reserva mantém ambos.
- Revogação e renúncia (art. 47.º CPC): data de efeito, prazo para constituir novo mandatário quando a constituição é obrigatória e tarefa automática de comunicação ao cliente.
- A minuta «Procuração forense» passa a criar o registo do mandato com os poderes escolhidos.

### 3. Trânsito em julgado e execução ✅

```js
case.judgment = { decisionDate, noticeDate, appealDays, estimatedFinal, finalDate, confirmed: boolean,
  type: 'condenacao_pecuniaria'|'entrega'|'facto'|'absolvicao'|'outro', amount }
```
- **Trânsito estimado** = notificação (presunção do art. 248.º) + prazo de recurso (30 dias, ou 15 nos urgentes e nos casos do art. 638.º CPC), com o motor de prazos (férias, transferência de termo). O advogado confirma a data real (art. 628.º CPC).
- Ao confirmar, cria automaticamente:
  - prazo da **nota discriminativa e justificativa de custas de parte** (art. 25.º, n.º 1 RCP);
  - **prescrição do direito reconhecido por sentença**: 20 anos (art. 311.º CC), no módulo de prescrição;
  - em condenações pecuniárias, início dos **juros compulsórios** de 5% ao ano (art. 829.º-A, n.º 4 CC);
  - prazo de cumprimento voluntário quando a decisão o fixar, e tarefa «Avaliar execução», com a sentença como título executivo (art. 703.º, n.º 1, al. a) CPC).

### 4. Obrigações profissionais ✅

```js
DB.obligations[] = { id, kind: 'quota_ordem'|'seguro_rc'|'previdencia'|'formacao'|'outro', label, dueDate,
  recurrence: 'mensal'|'trimestral'|'semestral'|'anual'|null, amount, reminderDays: [30, 7, 1], history: [{ date, amount, note }] }
```
- Painel no Perfil: quotas da Ordem (OA ou OSAE), seguro de responsabilidade civil profissional, contribuições de previdência e outras obrigações configuráveis pelo próprio advogado (valores e periodicidade não vêm pré-definidos, para não ficarem desatualizados).
- «Paguei» regista o histórico e avança a data seguinte conforme a periodicidade; alertas no ecrã Hoje.


## Decisões de âmbito

- A biblioteca de legislação penal (CP/CPP) foi retirada do âmbito a pedido, antes de ser publicada; não existe código nem dados dela na app.
