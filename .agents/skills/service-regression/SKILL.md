---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-checkout usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e investigue o incidente recebido. O escopo autorizado de produção está listado em `sourceFiles` de `.github/patchwork.json`; adicione testes novos que correspondam a `^src/modules/orders/[^/]+/patchwork-[a-z0-9-]+\.test\.ts$`. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use doubles locais para users e catalog. Derive a reprodução das evidências do incidente e preserve os contratos HTTP. Não reconfigure serviços reais.

Comandos de verificação: npm run build; node --test dist/src/modules/orders/controllers/patchwork-<nome>.test.js; npm run check. Execute primeiro o teste novo contra o código original e registre a falha funcional. Depois aplique a correção e execute as verificações completas. Não substitua testes por alterações em fixtures ou na telemetria.

Use o MCP `sentry` para o projeto `bbdw-checkout` da organização `bbdw-workshop-jj`; consulte o evento e a release informados no prompt. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow junto com esta pasta.

Corrija somente o incidente recebido e encerre processos de teste iniciados.
