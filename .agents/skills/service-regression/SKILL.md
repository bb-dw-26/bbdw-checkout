---
name: service-regression
description: Reproduzir e validar correções de incidentes em bbdw-checkout usando os contratos e testes específicos deste serviço.
---

Leia `docs/SPEC.md` e investigue o incidente recebido. O escopo autorizado de produção está listado em `sourceFiles` de `.github/patchwork.json`; acrescente casos de regressão nos arquivos permitidos por `testPattern` da mesma configuração. Prefira acrescentar à suíte existente, preservando suas linhas. Arquivos novos, quando necessários, devem ter nomes do comportamento testado, sem prefixo do agente ou ID de cenário. A configuração confiável do Patchwork fica em `.github/patchwork.json`.

Use doubles locais para catalog e ViaCEP. Derive a reprodução das evidências do incidente e preserve os contratos HTTP. Não reconfigure serviços reais.

Acrescente uma regressão pertinente e aplique a correção mínima. O workflow executa npm run check uma vez após a resposta do Copilot; não repita a suíte completa durante a investigação nem produza prova automatizada antes/depois. Preserve fixtures, testes e telemetria.

Use o MCP `sentry` para o projeto `bbdw-checkout` da organização `bbdw-workshop-jj`; consulte o incidente e a release relevante ao diagnóstico. A skill compartilhada `patchwork-investigation` é disponibilizada pelo workflow no diretório de skills do Copilot.

Corrija somente o incidente recebido e encerre processos de teste iniciados.
