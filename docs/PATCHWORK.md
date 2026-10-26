# Integração com o Patchwork

Este aplicativo chama o workflow compartilhado por SHA em [repair.yml](../.github/workflows/repair.yml).

- [Configuração local](../.github/patchwork.json): repositório, branch, projeto Sentry, arquivos autorizados e padrão de testes.
- [Skill do serviço](../.agents/skills/service-regression/SKILL.md): comandos e abordagem de validação deste app.
- [Operação do Patchwork](https://github.com/bb-dw-26/patchwork/blob/main/README.md): gatilhos, permissões, autenticação, MCP, validação e publicação de PRs.

A publicação usa o GitHub App privado `bbdw-patchwork-publisher`, instalado somente nos três aplicativos. Configure a variável `PATCHWORK_PUBLISH_APP_CLIENT_ID` e o secret `PATCHWORK_PUBLISH_APP_PRIVATE_KEY` conforme o [guia do publicador](https://github.com/bb-dw-26/patchwork/blob/main/docs/PUBLISHER.md). O token temporário é emitido somente após a validação e revogado ao terminar; o Copilot continua usando `GITHUB_TOKEN`.
