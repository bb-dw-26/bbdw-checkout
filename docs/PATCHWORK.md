# Automação compartilhada: Patchwork

O workflow `.github/workflows/repair.yml` chama o [Patchwork](https://github.com/bbdw-gh-action/patchwork), publicado em um repositório independente. A chamada fixa o SHA da versão `v1.0.0`; o disparo manual continua usando o nome `repair.yml`.

O Patchwork concentra os quatro jobs (`prepare`, `propose`, `validate`, `publish`), instalação, execução do agente, artifacts e permissões. O checkout mantém `scripts/agent-workflow.mjs` como adaptador, junto com `incident.mjs` e `native-sentry.mjs`. As regras de CHK-001 continuam aqui: origem nativa Sentry, branch `demo/chk-001`, alteração somente em `src/orders.ts`, teste novo falhando antes e passando depois e PR draft.

Os secrets `OPENAI_API_KEY` e `SENTRY_AUTH_TOKEN` são configurados no checkout e repassados explicitamente. O chamador concede escrita como teto de permissões; somente `publish` recebe escrita. Agente e validação usam runners separados com leitura no GitHub. Os artifacts e o PR continuam no repositório do checkout.

A chamada foi publicada em `main` junto com a renomeação do consumidor, no commit `bed9f8cc6737cc45d1082e964e0aa4dd33a239e9`. O adaptador nativo está presente nessa revisão. A execução real ainda exige que os secrets e as identidades de serviço e projeto Sentry correspondam a `bbdw-checkout`.

O gatilho é `issues:opened` do App oficial do Sentry, com os labels `sentry` e `agent:repair`. O disparo manual exige colaborador com escrita, conferido pelo adaptador. As descrições antigas de ponte local e gatilho por label são históricas.

```sh
gh workflow run repair.yml --repo bbdw-gh-action/bbdw-checkout --ref main -f issue_number=NUMERO
```

## Verificação da extração — 21/10/2026

- YAMLs do Patchwork, CI, exemplo e chamador validados com actionlint 1.7.12.
- Quatro testes do workflow compartilhado aprovados: entradas, identidade e separação de permissões/credenciais.
- Os 12 testes dos scripts do checkout passaram, incluindo integração nativa e retomada idempotente de publicação.
- Antes da renomeação dos serviços, o verificador local executou o adaptador contra uma cópia da revisão defeituosa `977434de2c892d80c332feab965cf1ddc8f1ed0a`: o teste novo falhou antes da correção e `npm run check` passou depois, com 14 testes aprovados. Evidências em `.verification/pipeline-20261021-123437`, na raiz do workspace.
- [CI inicial do Patchwork aprovado](https://github.com/bbdw-gh-action/patchwork/actions/runs/39627008882).

O ensaio local usou uma proposta sintética, sem chamar o agente ou criar PR real. Uma execução completa no GitHub ainda depende dos secrets e de um incidente elegível com as identidades atuais.
