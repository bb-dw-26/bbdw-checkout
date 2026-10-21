# Verificação local da implementação

Registro de 21/10/2026. Estes resultados são verificações locais da implementação; não são um ensaio conectado nem um reparo produzido pelo Codex.

| Verificação | Resultado |
| --- | --- |
| `npm run check` em `main` | 10 testes passaram, lint e TypeScript aprovados |
| SDK → coletor HTTP local | Duas requisições simultâneas, um evento por requisição, IDs isolados, sem headers/cookies/query/pedido; 422 não gera evento |
| `npm run check` em CHK-001 | Build e lint passam; 3 testes de contrato falham com 500, expondo a regressão |
| Smoke saudável com 4 apps e navegador | Retirada, validação de endereço, entrega e layout mobile passaram |
| Smoke CHK-001 com 4 apps e navegador | 500, carrinho preservado, request ID correlacionado e um envelope com TypeError e frame `app:///src/orders.js` |
| Validação do reparo em cópia descartável | Novo teste de serviço falhou na revisão defeituosa; 11 testes passaram após correção de referência |
| Workflow YAML | `actionlint` aprovado |
| Compose | Configuração validada; containers não executados localmente nesta verificação |

A correção usada para verificar o validador foi montada explicitamente a partir da referência saudável, sem invocar Codex e sem criar PR fictício. Não apresentar essa evidência como uma resolução autônoma.

Os testes existentes não foram removidos ou enfraquecidos. A falha de CI da branch `demo/chk-001` é esperada; `main` precisa continuar saudável. Os smoke tests encerraram os processos iniciados.

## Ainda depende do ensaio conectado

- Projeto/DSN Sentry e upload dos source maps, confirmando resolução TypeScript no evento recebido.
- Ponte autenticada criando a issue real e deduplicando uma repetição.
- Secret `OPENAI_API_KEY`, execução da Action e PR efetivamente produzido pelo agente.
- Revisão humana, execução do commit aprovado e repetição da compra.
- Escolha de hospedagem, se houver deploy remoto durante a apresentação.
