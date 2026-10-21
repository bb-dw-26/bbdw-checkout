# Preparar CHK-001 e o fluxo de reparo

O workflow foi extraído para o [Patchwork](https://github.com/bbdw-gh-action/patchwork). A chamada local e as condições de ativação estão em [PATCHWORK.md](PATCHWORK.md).

## Estado da implementação

`main` é saudável. `demo/chk-001` preserva o acesso indevido a `customer.address.postalCode` antes da validação de modalidade. O defeito é real, sem um botão de erro artificial ou flag que o agente possa simplesmente desligar. Os testes de contrato existentes permanecem iguais e falham nessa revisão.

O checkout captura erros HTTP 5xx pelo SDK Sentry. A integração nativa Sentry → GitHub cria a issue e inicia o workflow Codex → validação independente → PR draft. A publicação da issue e o Actions não dependem de um processo local. A aplicação pode executar localmente ou em uma hospedagem; o destino remoto ainda está a definir. A sessão do agente depende do secret `OPENAI_API_KEY`; consulte [VERIFICACAO.md](VERIFICACAO.md) para distinguir as etapas efetivamente validadas.

## Configuração a concluir

1. Usar a organização Sentry `bbdw-workshop-jj` e o projeto exclusivo `bbdw-checkout`, criado e vinculado a `bbdw-gh-action/bbdw-checkout`. O DSN fica no `.env` local.
2. Configurar `SENTRY_ENVIRONMENT=bbdw-demo`, `DEMO_SCENARIO=CHK-001`, `DEMO_RUN_ID` novo por ensaio e `SENTRY_RELEASE` com o SHA completo de `demo/chk-001`. Não usar `main` ou um nome de branch como release.
3. Para upload de source maps, configurar localmente `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT=bbdw-checkout`, com permissão para upload. O runtime só precisa do DSN; nenhum token de administração Sentry deve entrar na imagem ou no agente.
4. No GitHub, configurar o secret `OPENAI_API_KEY` do checkout e permitir a criação de PRs pelo Actions na organização e no repositório. A política do GitHub agrupa criação e aprovação na mesma opção; este workflow não aprova, faz merge ou deploy.
5. Configurar `SENTRY_AUTH_TOKEN` nos secrets do checkout, com acesso de leitura a issues/eventos de `bbdw-workshop-jj`. Ele é usado somente pelo job `prepare`; não é passado ao agente, à aplicação nem aos jobs de validação/publicação. Para um token dedicado, usar as permissões de leitura necessárias à API de eventos (`event:read`) e ao projeto (`project:read`).
6. Autorizar o App oficial Sentry nos quatro repos e conectar cada projeto ao respectivo repo. A automação de reparo fica somente no checkout. Os labels `sentry` e `agent:repair` devem existir.

## Regra nativa no Sentry

Organização: `bbdw-workshop-jj`. Alerta: **BBDW CHK-001 - criar issue GitHub** (`6206688`), associado ao monitor de erros do checkout (`10714423`).

- Disparo: primeiro evento de uma issue ou regressão.
- Filtros: `scenario=CHK-001` **e** `service=bbdw-checkout`.
- Ação: GitHub, integração `546121`, repositório `bbdw-gh-action/bbdw-checkout`, labels `sentry` e `agent:repair`, sem responsável fixo.
- Intervalo mínimo configurado: 5 minutos. O agrupamento e os vínculos do Sentry também determinam se haverá nova issue.

A configuração versionada está em [sentry-alert.json](sentry-alert.json). Ela contém identificadores públicos da conta, sem credenciais. A integração usa o GitHub App para publicar, permitindo o evento `issues:opened` no Actions. Não há receptor de webhook hospedado pelo projeto nem ponte local obrigatória.

O plano precisa disponibilizar a ação GitHub nos alertas. A organização está em trial Business; conferir a disponibilidade antes do evento, especialmente depois do fim do trial.

## Preparação fora do palco

Com o checkout limpo, selecionar a revisão defeituosa e compilar:

```sh
git fetch origin
git switch demo/chk-001
git rev-parse HEAD
npm ci
npm run build
```

Copiar o SHA exibido para `SENTRY_RELEASE` no `.env`. Com a conexão configurada, enviar os mapas desse mesmo build:

```sh
npm run sentry:upload
```

O comando usa `dist/src`, fontes embutidas nos mapas e prefixo `app:///src`; o SDK normaliza os frames para o mesmo prefixo. O upload deve terminar antes do ensaio; confirmar a disponibilidade dos mapas no Sentry antes da primeira compra, pois atraso de propagação pode separar o mesmo erro em dois grupos. Usar `npm start` na demonstração, para executar o build associado à release, em vez do servidor de desenvolvimento. Confirmar a resolução TypeScript no Sentry no ensaio conectado.

No storefront, `docker compose up --build` inicia os quatro serviços, usando a revisão local de cada repositório. Definir as mesmas variáveis Sentry no `.env` do storefront para o Compose repassá-las ao checkout. Elas não usam prefixo `VITE_` nem entram no código do navegador. Também é possível executar sem Docker, conforme `EXECUCAO.md` do storefront.

Antes do início, verificar `/health`, deixar a UI pronta e conferir que a regra nativa está habilitada. Não executar `sentry:bridge` ou `sentry:publish`: esses scripts foram mantidos apenas como histórico do adaptador anterior e não fazem parte deste fluxo.

## O que acontece durante a compra

1. O cliente sem endereço tenta retirar duas canecas. CHK-001 causa TypeError/500; a interface preserva o carrinho.
2. O filtro HTTP captura uma vez, marcando serviço, cenário, release, request ID e ensaio. Erros 4xx não geram eventos. `DEMO_SCENARIO` identifica o ensaio; não injeta nem corrige o bug.
3. O Sentry cria a issue pelo App oficial `sentry[bot]`, com os dois labels. `issues:opened` inicia `repair.yml` em `main`; aplicar labels depois não dispara outro reparo.
4. `prepare` confere autor/remetente `sentry[bot]` (ID `39604003`), labels e link da organização permitida. Consulta a API Sentry e exige projeto checkout, cenário CHK-001, serviço, ensaio e release igual ao HEAD de `demo/chk-001`. Rejeita uma issue que já tenha PR. Em disparo manual, exige colaborador com escrita. O corpo original da issue não é repassado ao agente: o contexto é reconstruído com IDs, frames permitidos e a fixture pública de reprodução, sem payloads ou headers.
5. `propose` instala dependências pelo lockfile e usa a Action oficial Codex em sandbox, com permissões GitHub de leitura e sem credenciais de deploy. O agente recebe o contexto validado do incidente, os contratos e as instruções em pt-BR. A Action permite explicitamente somente o bot Sentry (`allow-bot-users: sentry[bot]`).
6. `validate`, em outro runner e sem chave do agente, aceita somente alteração de `src/orders.ts` e novos testes. Preserva testes existentes, fixtures, SDK e configuração. Compila e executa os testes novos contra o código defeituoso, exigindo falha; aplica a correção e exige `npm run check` aprovado.
7. `publish`, em outro runner, aplica a proposta sem executar seu código e abre PR draft para `demo/chk-001`. O PR inclui relatório, evidências, consulta ao gabarito e link da execução. O token padrão do Actions não dispara outro CI de PR: o job independente `validate` é a evidência desta automação. Para nova checagem na revisão do PR, disparar CI manualmente.

A Action pode levar mais tempo que o bloco de apresentação, não produzir patch ou falhar. O relatório disponível fica nos artifacts; uma proposta sem teste e validação aprovados não vira PR automaticamente. Ler o diff e as evidências antes de aprovar: testes verdes não substituem revisão humana.

Para retomar uma issue elegível, após corrigir credenciais/configuração:

```sh
gh workflow run repair.yml --repo bbdw-gh-action/bbdw-checkout --ref main -f issue_number=NUMERO
```

Se somente o job `publish` falhar depois do push, preferir **Re-run failed jobs** na execução original, enquanto os artifacts estiverem disponíveis (7 dias). O publicador confere a base e o conteúdo da branch remota e retoma a abertura do PR sem adicionar commits ou usar force-push. Se a branch tiver outra proposta ou intervenção posterior, ele interrompe para preservar o trabalho. Relatório e evidência de validação ausentes são detectados antes de publicar a branch.

## Revisão, repetição e preservação

Revisar causa, diff, teste que falhou antes e passou depois, retirada, entrega sem endereço (422) e entrega com endereço. O PR aponta para a revisão defeituosa; `main` não precisa receber o bug. Para apresentar a correção, executar o commit da proposta revisada em checkout separado ou detached HEAD e reconstruir somente o serviço checkout. Registrar os SHAs e manter a branch defeituosa intacta para os próximos ensaios.

No Compose, a atualização independente é `docker compose up -d --build --no-deps checkout`, executada no storefront depois de selecionar a revisão aprovada e ajustar a release/mapas. Repetir a mesma compra: HTTP 201, R$ 80,00 e `deliveryAddress=null`. O destino de hospedagem remota permanece a definir; não há CD remoto configurado nesta etapa.

Para outro ensaio, usar o commit defeituoso preservado e um novo `DEMO_RUN_ID`. Esse identificador serve para correlação e não muda o agrupamento Sentry: outra ocorrência pode continuar na mesma issue e no mesmo vínculo GitHub. Preparar e ensaiar o estado de novo erro/regressão antes do palco; se a issue já tem PR, o workflow não inicia outro reparo nela. Não apagar registros de ensaios sem autorização. O workflow lê o evento mais recente do grupo: não executar ensaios concorrentes no mesmo projeto. Preservar a branch defeituosa.

## Verificação local sem conexões

```sh
# checkout em main: contratos, captura real no transporte local e scripts da automação
npm run check
```

Depois de compilar os quatro serviços, no storefront:

```sh
# checkout compilado em main
npm run smoke
# checkout compilado em demo/chk-001
npm run smoke -- --expect-failure
```

O segundo teste usa o navegador e APIs reais e verifica erro, carrinho preservado, request ID e um envelope do SDK em um coletor HTTP local. Ele não envia dados à conta Sentry. Ambos encerram os processos iniciados. Os testes de contrato comuns continuam falhando na branch defeituosa, como esperado; não enfraquecer o CI para esconder isso.

Ao terminar: Ctrl+C nos terminais da aplicação e `docker compose down` se tiver usado Compose. Preservar issues, PRs e evidências do ensaio.

## Referências

- [Action oficial Codex](https://github.com/openai/codex-action)
- [Configuração do SDK Sentry](https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/)
- [API de eventos Sentry](https://docs.sentry.io/api/events/retrieve-an-issue-event/)

## Migração e limpeza — 21/10/2026

Os quatro projetos e seus vínculos foram migrados para `bbdw-workshop-jj`, com DSNs próprios e source maps reenviados. A validação anterior resolveu CHK-001 para `src/orders.ts:155`, na revisão `977434de2c892d80c332feab965cf1ddc8f1ed0a`.

A pedido do responsável, as quatro issues de teste dessa organização e a antiga issue GitHub #1 foram excluídas antes do ensaio nativo. O histórico da organização antiga foi preservado. As evidências da nova execução são registradas em [VERIFICACAO.md](VERIFICACAO.md).

## Ensaio nativo validado

A [issue #2](https://github.com/bbdw-gh-action/bbdw-checkout/issues/2) foi criada pelo Sentry e iniciou o [Patchwork](https://github.com/bbdw-gh-action/bbdw-checkout/actions/runs/39628026728), com `prepare` aprovado. A repetição entrou no mesmo grupo sem nova issue. Falta configurar `OPENAI_API_KEY` para executar o agente; depois, retomar a issue #2 com `workflow_dispatch`. A revisão defeituosa atual é `458c5fcb9145acff7ecf1b1d826ee9d2d7dd2e79`. [Evidências completas](VERIFICACAO.md).
