# CJ-Vertex — Pitch comercial

*A secretária digital do advogado português. Os prazos não falham, os dados não saem do escritório.*

## A frase de abertura (30 segundos)

> «Quantas vezes já confirmou o mesmo prazo três vezes, com medo das férias judiciais ou de um feriado municipal? A CJ-Vertex conta os prazos pelo CPC, avisa no telemóvel antes de terminarem, controla os DUC e verifica conflitos de interesses em segundos. Funciona no seu computador e no seu telemóvel, sem mensalidades, e os dados dos seus clientes nunca saem do seu aparelho.»

## As dores que resolvemos

| Dor do advogado | O que a CJ-Vertex faz |
| --- | --- |
| Medo de perder um prazo fatal | Motor de prazos CPC, CPT e Código Civil: férias judiciais, processos urgentes, feriados municipais, tolerâncias de ponto, presunção de notificação, dilação, multa do art. 139.º. **Semáforo** no ecrã inicial (vermelho, amarelo, verde) e alertas no telemóvel 7, 3 e 1 dia antes |
| Notificações do Citius para ler e calcular | Cola-se o texto ou o e-mail da notificação: a app reconhece o processo, a data e o prazo, e o advogado só confirma |
| Peças rejeitadas por falta de taxa de justiça | Controlo de **DUC**: por pagar, em atraso, pago; aviso antes de entregar uma peça sem taxa paga |
| Conflitos de interesses descobertos tarde | **Verificação relâmpago**: um nome é cruzado com clientes, partes contrárias, testemunhas e mandantes |
| Sigilo profissional e RGPD | Tudo guardado no próprio aparelho; **modo sigilo total**: nada sai do aparelho |
| Horas a escrever o que se disse | Gravação com transcrição automática (opcional), exportação em Word e PDF |
| Trabalho invisível que o cliente não vê | Diário de diligências e **relatório em PDF** para o cliente ou para o Apoio Judiciário |
| Honorários e despesas por faturar | Notas de honorários com IVA e retenção na fonte, despesas e taxas de justiça incluídas automaticamente |
| Mensalidades de software | **Zero mensalidades**: paga-se uma vez a instalação e a formação |

## Porque é diferente

1. **Feita para a lei portuguesa** — não é uma agenda genérica: conhece o CPC, a LOSJ, o RCP e o CIRS.
2. **Local-first** — os dados vivem no aparelho do advogado; não há servidor de terceiros com os processos dos clientes.
3. **Testada** — o motor de prazos tem uma bateria de testes com casos reais calculados à mão (ver `tests/prazos.test.js`).
4. **Funciona sem internet** e instala-se como uma aplicação no Windows, no Mac e no Android.
5. **Segurança de escritório** — PIN de entrada, bloqueio automático por inatividade, PIN de administrador para cópias de segurança e registo de auditoria.

## Demonstração em 5 minutos

1. Criar um processo e colar uma notificação do Citius → o prazo aparece calculado, com a explicação passo a passo.
2. Marcar o processo como urgente → mostrar como o prazo deixa de suspender em férias.
3. Ecrã inicial → semáforo de prazos e alerta de DUC por pagar.
4. Pesquisar o nome de uma parte contrária na lupa → aviso de conflito.
5. Gravar 20 segundos de conversa → texto transcrito → exportar em Word.
6. Ligar o modo sigilo → «a partir de agora, nada sai deste aparelho».

## Preço (proposta)

Sem mensalidades. Paga-se uma vez a instalação, a configuração e a formação presencial.

| Pacote | Para quem | Inclui | Preço (+ IVA) |
| --- | --- | --- | --- |
| **Solo** | Advogado ou solicitador em prática individual | Instalação no computador e no telemóvel, configuração (perfil, PIN de administrador, feriados municipais, tolerâncias), importação de até 50 processos, 2 h de formação presencial, 30 dias de acompanhamento | **390 €** |
| **Escritório** | 2 a 5 profissionais | O mesmo, para até 5 pessoas e aparelhos, importação de até 200 processos, 4 h de formação, 60 dias de acompanhamento | **890 €** |
| **Sociedade** | 6 a 15 profissionais | Por proposta: levantamento de processos, formação por equipas, modelos de minutas próprios | **desde 1 490 €** |
| Horas adicionais | Formação, importação de dados, modelos | Presencial ou remoto | **45 €/h** |
| Atualização anual (opcional) | Quem quer as novidades instaladas e verificadas | Visita anual, atualização das tolerâncias e feriados, verificação das cópias de segurança | **120 €/ano** |

Os valores são uma proposta inicial para validar com os primeiros 5 a 10 escritórios.

## Objeções frequentes

- **«E se perder o telemóvel?»** — Cópia de segurança com PIN de administrador, para disco externo ou pen; a app avisa quando a última cópia tem mais de 7 dias.
- **«E se a app errar um prazo?»** — O motor mostra cada passo do cálculo e foi desenhado para, em caso de dúvida, errar para antes, nunca para depois. É uma ferramenta de apoio: a confirmação final é sempre do advogado.
- **«A transcrição envia o áudio para fora?»** — Sim, quando usada. Por isso é opcional, e o modo sigilo desliga-a por completo.
- **«Funciona no meu computador do escritório?»** — Sim: instala-se a partir do Chrome ou do Edge, no Windows ou no Mac, e abre como uma aplicação.

## O que não dizer

- Não prometer que «substitui a verificação do advogado».
- Não dizer «100% sem internet» quando a transcrição ou a IA estão ligadas; dizer «com o modo sigilo, nada sai do aparelho».
