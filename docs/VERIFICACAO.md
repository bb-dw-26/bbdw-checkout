# Verificação local da implementação

Registro de 21/10/2026. Inclui verificações locais e captura real no Sentry. Ainda não é um ensaio completo até o PR nem um reparo produzido pelo Codex.

| Verificação | Resultado |
| --- | --- |
| `npm run check` em `main` | 10 testes passaram, lint e TypeScript aprovados |
| SDK → coletor HTTP local | Duas requisições simultâneas, um evento por requisição, IDs isolados, sem headers/cookies/query/pedido; 422 não gera evento |
| `npm run check` em CHK-001 | Build e lint passam; 3 testes de contrato falham com 500, expondo a regressão |
| Smoke saudável com 4 apps e navegador | Retirada, validação de endereço, entrega e layout mobile passaram |
| Smoke CHK-001 com 4 apps e navegador | 500, carrinho preservado, request ID correlacionado e um envelope com TypeError e frame `app:///src/orders.js` |
| Validação do reparo em cópia descartável | Novo teste de serviço falhou na revisão defeituosa; 11 testes passaram após correção de referência |
| Workflow YAML | `actionlint` aprovado |
| Retomada da publicação com Git local real | Falha simulada na API depois do push: nova tentativa reutiliza o commit; PR existente não é duplicado; intervenção posterior na branch é preservada; artifact ausente impede publicação |
| Compose | Configuração validada; containers não executados localmente nesta verificação |

A correção usada para verificar o validador foi montada explicitamente a partir da referência saudável, sem invocar Codex e sem criar PR fictício. Não apresentar essa evidência como uma resolução autônoma.

Os três testes adicionais de publicação usam repositórios Git temporários e uma API GitHub simulada; nenhum PR é criado por eles. Com esses testes, a suíte saudável contém 13 testes.

Os testes existentes não foram removidos ou enfraquecidos. A falha de CI da branch `demo/chk-001` é esperada; `main` precisa continuar saudável. Os smoke tests encerraram os processos iniciados.

## Captura real no Sentry — 21/10/2026

- Organização `bbdw-workshop`, projeto dedicado `bbw-checkout`.
- Release `977434de2c892d80c332feab965cf1ddc8f1ed0a`, da branch `demo/chk-001`.
- Ambiente `bbw-ensaio`, cenário `CHK-001`, execução e request ID `sentry-20261021-103952`.
- POST de retirada com cliente sem endereço retornou HTTP 500 em uma instância isolada na porta 3004, consultando users e catalog locais.
- [BBW-CHECKOUT-1](https://bbdw-workshop.sentry.io/issues/7804654951/), evento `fafc7574251f4ffa87577c0b16f6c0b1`: TypeError ao acessar `postalCode` em endereço nulo.
- Upload dos source maps concluído. O evento resolveu o frame para `src/orders.ts:155`, com a linha `const postalCode = customer.address!.postalCode;` e sem erros de processamento.
- A ponte autenticada publicou a issue #1 com os metadados desse evento. Duas consultas seguintes em modo `--publish --watch` e uma nova execução reutilizaram a mesma issue. Como o Sentry devolveu o frame já convertido para TypeScript, o filtro atual da ponte omitiu esse frame da prévia; o link do evento permite consultar a stack.
- A instância temporária foi encerrada. Os arquivos `.env` locais foram configurados e permanecem ignorados pelo Git, sem gravar o token de API. O checkout saudável que já estava rodando foi preservado; carregará a configuração ao ser iniciado novamente com `npm start`.

## Ainda depende do ensaio completo

- Secret `OPENAI_API_KEY`, execução da Action e PR efetivamente produzido pelo agente.
- Revisão humana, execução do commit aprovado e repetição da compra.
- Escolha de hospedagem, se houver deploy remoto durante a apresentação.

## Sentry → GitHub → Actions — 21/10/2026

- [Issue #1](https://github.com/bbdw-gh-action/bbw-checkout/issues/1), com labels `sentry` e `agent:repair`, criada pela ponte a partir do evento real do CHK-001.
- [Execução automática inicial](https://github.com/bbdw-gh-action/bbw-checkout/actions/runs/39618741278): `prepare` aprovado, incluindo ator, metadados e SHA da revisão defeituosa; prompt gerado com sucesso.
- O secret `OPENAI_API_KEY` não estava configurado. A Action não iniciou o proxy e falhou esperando seu arquivo de informações; não houve sessão do agente nem PR. Foi acrescentada uma checagem explícita da credencial no início de `repair`.
- A abertura com dois labels gerava múltiplos eventos. O gatilho agora aceita apenas `issues:labeled` com `agent:repair`; `workflow_dispatch` permanece disponível. A execução redundante pendente foi cancelada.
- A ponte de validação foi encerrada após confirmar deduplicação. Para novas capturas automáticas durante o ensaio, iniciar `npm run sentry:publish`; não há processo persistente deixado em segundo plano.

## Nova organização — 21/10/2026

Migração para `bbdw-workshop-jj` validada: [CHK-001](https://bbdw-workshop-jj.sentry.io/issues/7804862919/), evento `c79b759b54dd4df9a6b09d2ebedb4862`, execução `migration-jj-20261021-122004`. A compra de retirada retornou 500 na cópia da revisão defeituosa, e o Sentry resolveu o frame para `src/orders.ts:155`. Um evento; sem erros de processamento. Repositório conectado e source maps reenviados. Os registros anteriores desta página continuam sendo evidências históricas da organização antiga. Nenhuma nova issue GitHub nem execução do agente foi gerada nesta validação.
