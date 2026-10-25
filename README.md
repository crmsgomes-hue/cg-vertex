# LEXVORTEX — Secretária Digital Jurídica

*Automação, gestão de prazos e eficiência para o exercício da advocacia.*

App web/mobile (PWA) para advogados e solicitadores em Portugal: processos, prazos judiciais com contagem automática, agenda, minutas, honorários, documentos, registo de tempo e gravação com transcrição.

- **App online:** https://crmsgomes-hue.github.io/lexvortex/
- **Código da app:** [`index.html`](index.html) — ficheiro único (HTML + CSS + JavaScript, sem build)
- **Plano de evolução (3 vertentes):** [`docs/plano-evolucao.md`](docs/plano-evolucao.md)
- **Especificação das fases 2 e 3:** [`docs/especificacao-fase-2-3.md`](docs/especificacao-fase-2-3.md)
- **SQL da sincronização (Supabase):** [`supabase/migrations/0001_lexvortex_sync.sql`](supabase/migrations/0001_lexvortex_sync.sql)
- **Servidores (Supabase Edge Functions, Deno):** [transcrição](supabase/functions/lexvortex-transcribe/index.ts) · [assistente de e-mail](supabase/functions/lexvortex-assist/index.ts)

## Funcionalidades

| Módulo | O que faz |
| --- | --- |
| Hoje | Prazo fatal mais próximo em destaque, prazos nas próximas 48 h, audiências, honorários por receber, processos ativos |
| Processos | Criar, editar, arquivar e apagar processos e clientes; filtros por urgência; pesquisa |
| Prazos | Motor de contagem CPC / CPT / Código Civil: art. 138.º e 139.º CPC (multa), art. 248.º e 249.º (presunção de notificação), art. 245.º (dilação), férias judiciais (art. 28.º LOSJ), feriados nacionais e municipais, art. 279.º CC; linha temporal e passos explicados |
| Gravações | Gravação contínua (Web Audio API) em excertos WAV 16 kHz cortados nas pausas, transcritos com Whisper Large v3; quem fala marcado por toque; correção de texto; pesquisa; exportação PDF e Word |
| Documentos | Juntar PDFs e fotografias ao processo; leitura do texto com pdf.js ou OCR (Tesseract.js) e deteção de datas para calcular prazos |
| Notificações | Importar notificações do Citius (PDF ou fotografia): reconhece n.º de processo, data e prazo; o advogado confirma e o prazo é criado |
| Incidentes de prazos | Suspensão, prorrogação, interrupção (apoio judiciário) e termo fixado pelo tribunal, com recálculo e passos explicados |
| Taxas de justiça (DUC) | Registo de DUC por ato, estimativa pela Tabela I do RCP, alertas e validação antes da entrega, lançamento automático nas despesas |
| Clientes | Leads, clientes e caderneta de contactos; verificação de conflito de interesses |
| Tarefas | Por fazer, Em curso, Concluído; atribuição à equipa; tarefas a partir de prazos |
| E-mail ao cliente | Rascunho em linguagem clara gerado por IA a partir do processo, para rever e enviar |
| Registo de tempo | Cronómetro por processo e registo manual; criação de nota de honorários a partir das horas |
| Minutas | Procuração forense, carta de interpelação, requerimento de adiamento e modelos próprios com campos `{{cliente}}`, `{{processo}}`…; exportação Word e PDF |
| Agenda | Marcações e termos de prazos; ligação a Google Calendar, Outlook e ficheiro .ics |
| Despesas | Taxas de justiça, custas, certidões, deslocações, peritos; reembolsos sem IVA (art. 16.º, n.º 6, al. c) CIVA) e despesas com IVA, incluídas automaticamente na nota de honorários |
| Honorários | IVA 23 %, retenção IRS 23 % (art. 101.º e 151.º CIRS) para clientes com contabilidade organizada; notas de honorários (rascunho, emitida com n.º anual, em atraso, paga) com PDF |
| Perfil | Dados do advogado, PIN, valor por hora, cópia de segurança (exportar/importar JSON) |

## Arquitetura

- **Frontend:** um único `index.html`, JavaScript sem framework. Bibliotecas carregadas só quando precisas, por CDN: jsPDF 2.5.1 (PDF), docx 8.5.0 (Word), pdf.js 3.11.174 (leitura de PDF). Fontes IBM Plex (Google Fonts).
- **Dados:** guardados no próprio dispositivo — `localStorage` (chave `lexvortex-v2`) para dados; IndexedDB (`lexvortex-audio`) para áudio e documentos. PIN guardado como hash SHA-256.
- **Transcrição:** a app envia excertos WAV à Edge Function `lexvortex-transcribe`, que os passa ao Whisper Large v3 da Groq (`language=pt`, `verbose_json`) e filtra segmentos de silêncio. A função não guarda áudio nem texto. A chave da Groq fica num *Secret* do Supabase (`GROQ_API_KEY`), nunca na app.
- **Alojamento:** GitHub Pages (https é necessário para o microfone).

## Em falta / próximos passos

1. **Nuvem e sincronização** entre dispositivos (Supabase: Auth + PostgreSQL com RLS por escritório + Storage).
2. **Alertas de prazos com a app fechada** (Web Push com service worker + função agendada).
3. **Separação automática de oradores** (diarização; requer serviço próprio, p. ex. Deepgram ou AssemblyAI).
4. OCR de PDFs digitalizados.

## Aviso

A contagem de prazos e as minutas são ferramentas de apoio e não substituem a análise do profissional. Os valores legais e fiscais devem ser validados antes de uso comercial.
