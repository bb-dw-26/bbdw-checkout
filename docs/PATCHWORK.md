# Patchwork v2 — bbdw-checkout

Este repositório chama a automação compartilhada em `bbdw-gh-action/patchwork`, fixada por SHA em `.github/workflows/repair.yml`. A lógica comum é mantida no Patchwork; este projeto declara suas regras em `.github/patchwork.json`.

- Branch de destino: `demo/chk-001`. A release do evento Sentry deve ser o SHA completo do HEAD dessa branch e o serviço/projeto deve ser `bbdw-checkout`.
- Arquivos de produção autorizados: src/orders.ts. Somente novos testes no padrão `^test/patchwork-[a-z0-9-]+\.test\.ts$` são aceitos.
- Runtime de validação: `node`. Um teste novo precisa falhar antes e passar depois, seguido das verificações completas.
- Skills próprias: `.agents/skills/`. A skill compartilhada `patchwork-investigation` vem da mesma revisão do motor. O workflow copia ambas da revisão confiável, inclusive quando o código afetado é uma branch antiga.
- MCP: servidor oficial `@sentry/mcp-server`, instalado pelo lockfile do Patchwork e iniciado via stdio, limitado à organização e ao projeto deste arquivo. Somente ferramentas de consulta ficam disponíveis. O token é passado por variável de ambiente, nunca gravado no TOML, prompt ou artifact.

Gatilhos: issue aberta pelo App oficial Sentry com labels `sentry` e `agent:repair`, ou `workflow_dispatch` por colaborador com escrita. O motor confere novamente autor, labels, projeto, release e duplicidade. Uma issue de teste ou evento de revisão antiga não inicia um reparo válido. A regra nativa Sentry → GitHub está configurada no projeto; ela só se aplica a eventos futuros elegíveis.

Secrets necessários: `SENTRY_AUTH_TOKEN` (leitura de organização, projeto e eventos, usado em prepare e no MCP) e `OPENAI_API_KEY` (geração da proposta). Configure a chave OpenAI diretamente nos Actions secrets, sem colocá-la em arquivos ou conversas. O repositório deve permitir criação de PRs pelo Actions.

```sh
gh workflow run repair.yml --repo bbdw-gh-action/bbdw-checkout --ref main -f issue_number=NUMERO
```

O job de validação não recebe secrets; somente a publicação recebe escrita no GitHub. O PR é draft, sem merge ou deploy automáticos. `agent-context.json` registra as skills e ferramentas MCP disponibilizadas; o relatório do agente deve indicar quais foram de fato lidas/consultadas. Disponibilidade não prova uso.

Essa integração habilita reparos neste serviço, mas não cria branches defeituosas nem novos cenários de demonstração. O ensaio completo ainda depende de um incidente elegível e da credencial do agente.

Os scripts locais da automação v1 permanecem para os ensaios históricos; o workflow v2 executa o motor central, não `scripts/agent-workflow.mjs`.
