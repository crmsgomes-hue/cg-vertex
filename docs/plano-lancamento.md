# LEXVORTEX — Plano para o lançamento comercial

## 1. Antes do primeiro cliente (obrigatório)

- [ ] **Revisão jurídica**: um advogado confirma os 28 casos de `tests/prazos.test.js`, o catálogo de prazos e as bases legais citadas na app.
- [ ] **Servidor próprio da LEXVORTEX**: mudar as funções de transcrição e IA para um projeto Supabase só da LEXVORTEX e criar uma chave Groq nova (a atual foi partilhada numa conversa e é a conta gratuita pessoal).
- [ ] **Transcrição para clientes pagantes**: avaliar um fornecedor com contrato de subcontratação RGPD e processamento na UE; até lá, apresentar a transcrição como opcional e recomendar o modo sigilo para dados sensíveis.
- [ ] **Termos de utilização e política de privacidade**: ferramenta de apoio, limitação de responsabilidade, dados guardados no aparelho do cliente.
- [ ] **Faturação da própria LEXVORTEX**: atividade aberta e programa de faturação certificado para emitir as faturas da instalação.

## 2. Em cada instalação (lista de verificação)

- [ ] Instalar no computador (Chrome ou Edge → Instalar LEXVORTEX) e no telemóvel (app Android ou app web instalada).
- [ ] Criar o perfil do advogado e o PIN de entrada.
- [ ] Definir o **PIN de administrador** com o responsável do escritório.
- [ ] Escolher o tempo de **bloqueio automático** (recomendado: 5 minutos).
- [ ] Confirmar o **município do tribunal** de cada processo (feriados municipais) e registar as **tolerâncias de ponto** do ano.
- [ ] Ligar o **modo sigilo** se o escritório não quiser transcrição nem IA.
- [ ] Ativar os **avisos** (Perfil → Ativar avisos) e testar um alerta.
- [ ] Fazer a **primeira cópia de segurança** para disco externo ou pen e explicar a rotina semanal.
- [ ] Formação: criar processo, colar notificação, prazos e incidentes, DUC, conflitos, honorários, gravação.

## 3. Depois do lançamento

- [ ] Recolher a opinião dos primeiros 5 escritórios e ajustar o preço.
- [ ] Publicar na Google Play Store (conta de programador Google, pagamento único).
- [ ] Sincronização opcional entre aparelhos do mesmo escritório, cifrada, para quem a quiser (SQL já preparado em `supabase/migrations`).
