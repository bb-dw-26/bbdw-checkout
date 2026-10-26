# Integração com o Patchwork

Este aplicativo chama o workflow compartilhado por SHA em [repair.yml](../.github/workflows/repair.yml).

- [Configuração local](../.github/patchwork.json): repositório, branch, projeto Sentry, arquivos autorizados e padrão de testes.
- [Skill do serviço](../.agents/skills/service-regression/SKILL.md): comandos e abordagem de validação deste app.
- [Operação do Patchwork](https://github.com/bbdw-gh-action/patchwork/blob/main/README.md): gatilhos, permissões, autenticação, MCP, validação e publicação de PRs.
