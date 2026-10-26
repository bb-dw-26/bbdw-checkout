---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-checkout usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e investigue o incidente recebido. O escopo autorizado de produção está listado em `sourceFiles` de `.github/patchwork.json`; acrescente casos de regressão nos arquivos permitidos por `testPattern` da mesma configuração. Prefira acrescentar à suíte existente, preservando suas linhas. Arquivos novos, quando necessários, devem ter nomes do comportamento testado, sem prefixo do agente ou ID de cenário. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use doubles locais para catalog e ViaCEP. Derive a reprodução das evidências do incidente e preserve os contratos HTTP. Não reconfigure serviços reais.

Comandos de verificação: npm run build; node --test dist/<caminho-do-teste-novo>.test.js; npm run check. Execute primeiro o teste novo contra o código original e registre a falha funcional. Depois aplique a correção e execute as verificações completas. Não substitua testes por alterações em fixtures ou na telemetria.

Use o MCP `sentry` para o projeto `bbdw-checkout` da organização `bbdw-workshop-jj`; consulte o evento e a release informados no prompt. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow junto com esta pasta.

Corrija somente o incidente recebido e encerre processos de teste iniciados.
