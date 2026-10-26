# Integração com o Patchwork

Este aplicativo chama o workflow compartilhado por `@main` em [repair.yml](../.github/workflows/repair.yml). Publique primeiro o Patchwork e depois os consumidores.

Um único job prepara o contexto, executa o Copilot CLI oficial, verifica a aplicação e abre um PR em rascunho. Há dois checkouts: motor e aplicação. A configuração é lida da branch atual; não se exige igualdade entre a release Sentry e HEAD.

O input `check_command` executa `npm run check` uma vez após a correção. Uma falha impede publicação. O agente acrescenta uma regressão pertinente sem repetir a suíte completa. Sem mudanças, não há PR.

CHK-003 permite encaminhar ao storefront quando a investigação justificar esse destino; CHK-004 usa `.github/patchwork-chk004.json` para reparo local. Encaminhamento cria uma issue vinculada, mantém a origem aberta e dispensa testes na origem. O novo protocolo não migra issues antigas.

O MCP Sentry oferece ferramentas de leitura e o MCP GitHub embutido fica desabilitado. Logs do CLI, saída dos testes e resumo do job permitem acompanhar a execução; não há artefatos ou relatórios de evidência. Prompt, configuração MCP, resposta e estado do CLI são temporários. O smoke em [sentry-smoke.yml](../.github/workflows/sentry-smoke.yml) faz uma consulta curta sem publicar nada.

- [Configuração local](../.github/patchwork.json): repositório, branch, projeto Sentry, arquivos autorizados e padrão de testes.
- [Skill do serviço](../.agents/skills/service-regression/SKILL.md): comandos e abordagem de validação deste app.
- [Operação do Patchwork](https://github.com/bb-dw-26/patchwork/blob/main/README.md): gatilhos, permissões, autenticação, MCP, validação e publicação de PRs.

A publicação usa o GitHub App privado `bbdw-patchwork-publisher`, instalado somente nos três aplicativos. Configure a variável `PATCHWORK_PUBLISH_APP_CLIENT_ID` e o secret `PATCHWORK_PUBLISH_APP_PRIVATE_KEY` conforme o [guia do publicador](https://github.com/bb-dw-26/patchwork/blob/main/docs/PUBLISHER.md). O token temporário é emitido somente após a validação e revogado ao terminar; o Copilot continua usando `GITHUB_TOKEN`.

O App de issues existente publica encaminhamentos conforme o [guia de encaminhamento](https://github.com/bb-dw-26/patchwork/blob/main/docs/HANDOFF.md). Os Apps só recebem tokens nos steps posteriores ao CLI. Agente, testes e publicação compartilham um runner descartável; não há isolamento entre runners. Não há merge ou deploy automático.
