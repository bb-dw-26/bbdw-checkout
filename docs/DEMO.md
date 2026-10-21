# Preparar CHK-001 e o fluxo de reparo

## Estado da implementação

`main` é saudável. `demo/chk-001` preserva o acesso indevido a `customer.address.postalCode` antes da validação de modalidade. O defeito é real, sem um botão de erro artificial ou flag que o agente possa simplesmente desligar. Os testes de contrato existentes permanecem iguais e falham nessa revisão.

O checkout tem captura explícita de erros HTTP 5xx pelo SDK Sentry, source maps, ponte local Sentry → issue e workflow Codex → validação independente → PR draft. A conexão Sentry, a publicação da issue real e o disparo automático do Actions foram validados. A sessão do agente continua pendente da credencial; consulte VERIFICACAO.md para as evidências.

## Configuração a concluir

1. Usar a organização Sentry `bbdw-workshop` e o projeto exclusivo `bbw-checkout`, já criado e vinculado ao repositório. O DSN fica no `.env` local.
2. Configurar `SENTRY_ENVIRONMENT=bbw-demo`, `DEMO_SCENARIO=CHK-001`, `DEMO_RUN_ID` novo por ensaio e `SENTRY_RELEASE` com o SHA completo de `demo/chk-001`. Não usar `main` ou um nome de branch como release.
3. Para upload de source maps, configurar localmente `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT=bbw-checkout`, com permissão para upload. O runtime só precisa do DSN; nenhum token de administração Sentry deve entrar na imagem ou no agente.
4. No GitHub, configurar o secret `OPENAI_API_KEY` do checkout e permitir a criação de PRs pelo Actions na organização e no repositório. A política do GitHub agrupa criação e aprovação na mesma opção; este workflow não aprova, faz merge ou deploy.
5. A ponte usa `gh` autenticado como colaborador com escrita no checkout. Os labels `sentry` e `agent:repair` devem existir. O token que cria a issue precisa disparar workflows; não usar o `GITHUB_TOKEN` de outro workflow para criá-la.

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

O comando usa `dist/src`, fontes embutidas nos mapas e prefixo `app:///src`; o SDK normaliza os frames para o mesmo prefixo. Usar `npm start` na demonstração, para executar o build associado à release, em vez do servidor de desenvolvimento. Confirmar a resolução TypeScript no Sentry no ensaio conectado.

No storefront, `docker compose up --build` inicia os quatro serviços, usando a revisão local de cada repositório. Definir as mesmas variáveis Sentry no `.env` do storefront para o Compose repassá-las ao checkout. Elas não usam prefixo `VITE_` nem entram no código do navegador. Também é possível executar sem Docker, conforme `EXECUCAO.md` do storefront.

Antes do início, verificar `/health`, deixar a UI pronta e iniciar a ponte em um terminal separado:

```sh
npm run sentry:bridge -- --org ORGANIZACAO --release SHA_COMPLETO --run ensaio-001 --publish --watch
```

Substituir os três valores pelos da execução. Sem `--publish`, o comando só mostra a issue que seria criada. Sem `--watch`, consulta uma vez. Com `--watch`, consulta a cada 5 segundos por até 60 minutos; Ctrl+C encerra. Manter apenas uma instância por ensaio. Falhas de autenticação/rede são explícitas: corrigir e reiniciar com a mesma identidade, sem criar outra issue manualmente.

A ponte consulta somente o projeto `bbw-checkout` escolhido, confere release, cenário e `demo_run` no evento mais recente do grupo e deduplica por grupo + release + ensaio entre até 1.000 issues recentes. Como usa o evento mais recente, não executar dois ensaios concorrentes no mesmo projeto. Ela copia apenas IDs, link e frames permitidos; não copia payloads, headers ou dados pessoais. A requisição da issue é a fixture pública. Esse adaptador é local, sem um quinto serviço ou uma integração nativa obrigatória.

## O que acontece durante a compra

1. O cliente sem endereço tenta retirar duas canecas. CHK-001 causa TypeError/500; a interface preserva o carrinho.
2. O filtro HTTP captura uma vez, marcando serviço, cenário, release, request ID e ensaio. Erros 4xx não geram eventos. `DEMO_SCENARIO` identifica o ensaio; não injeta nem corrige o bug.
3. A ponte encontra o evento e cria a issue com os dois labels. A aplicação do label `agent:repair` inicia `repair.yml`, presente em `main`. O evento de abertura e outros labels não iniciam reparos adicionais.
4. `prepare` exige ator com escrita, labels e release igual ao HEAD de `demo/chk-001`, e rejeita uma issue que já tenha PR. Não executar código trazido na issue.
5. `repair` instala dependências pelo lockfile e usa a Action oficial Codex em sandbox, com permissões GitHub de leitura e sem credenciais de deploy. O agente recebe a issue, os contratos e as instruções em pt-BR.
6. `validate`, em outro runner e sem chave do agente, aceita somente alteração de `src/orders.ts` e novos testes. Preserva testes existentes, fixtures, SDK e configuração. Compila e executa os testes novos contra o código defeituoso, exigindo falha; aplica a correção e exige `npm run check` aprovado.
7. `publish`, em outro runner, aplica a proposta sem executar seu código e abre PR draft para `demo/chk-001`. O PR inclui relatório, evidências, consulta ao gabarito e link da execução. O token padrão do Actions não dispara outro CI de PR: o job independente `validate` é a evidência desta automação. Para nova checagem na revisão do PR, disparar CI manualmente.

A Action pode levar mais tempo que o bloco de apresentação, não produzir patch ou falhar. O relatório disponível fica nos artifacts; uma proposta sem teste e validação aprovados não vira PR automaticamente. Ler o diff e as evidências antes de aprovar: testes verdes não substituem revisão humana.

Para retomar uma issue elegível, após corrigir credenciais/configuração:

```sh
gh workflow run repair.yml --repo bbdw-gh-action/bbw-checkout --ref main -f issue_number=NUMERO
```

Se somente o job `publish` falhar depois do push, preferir **Re-run failed jobs** na execução original, enquanto os artifacts estiverem disponíveis (7 dias). O publicador confere a base e o conteúdo da branch remota e retoma a abertura do PR sem adicionar commits ou usar force-push. Se a branch tiver outra proposta ou intervenção posterior, ele interrompe para preservar o trabalho. Relatório e evidência de validação ausentes são detectados antes de publicar a branch.

## Revisão, repetição e preservação

Revisar causa, diff, teste que falhou antes e passou depois, retirada, entrega sem endereço (422) e entrega com endereço. O PR aponta para a revisão defeituosa; `main` não precisa receber o bug. Para apresentar a correção, executar o commit da proposta revisada em checkout separado ou detached HEAD e reconstruir somente o serviço checkout. Registrar os SHAs e manter a branch defeituosa intacta para os próximos ensaios.

No Compose, a atualização independente é `docker compose up -d --build --no-deps checkout`, executada no storefront depois de selecionar a revisão aprovada e ajustar a release/mapas. Repetir a mesma compra: HTTP 201, R$ 80,00 e `deliveryAddress=null`. O destino de hospedagem remota permanece a definir; não há CD remoto configurado nesta etapa.

Para outro ensaio, usar o commit defeituoso preservado e um novo `DEMO_RUN_ID`; isso permite outra issue e outro PR sem reescrever o histórico. Se a branch de demonstração tiver sido alterada, preparar conscientemente a revisão antes do evento, preservando os commits anteriores.

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

Ao terminar: Ctrl+C nos terminais da aplicação/ponte e `docker compose down` se tiver usado Compose. Preservar issues, PRs e evidências do ensaio.

## Referências

- [Action oficial Codex](https://github.com/openai/codex-action)
- [Configuração do SDK Sentry](https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/)
- [API de eventos Sentry](https://docs.sentry.io/api/events/retrieve-an-issue-event/)

## Publicação automática configurada

O `.env` local pode definir `SENTRY_BRIDGE_ORG`, `SENTRY_BRIDGE_RELEASE` e `SENTRY_BRIDGE_RUN`. Essas variáveis selecionam o incidente independentemente da release do checkout saudável. Argumentos explícitos da CLI têm precedência.

```sh
npm run sentry:publish
```

Esse comando ativa `--publish --watch`: consulta a cada cinco segundos por até 60 minutos. A publicação é automática enquanto esse processo estiver rodando; não há um serviço permanente nem um agendamento na nuvem. Mantenha apenas uma instância por ensaio e encerre com Ctrl+C ao terminar. Para mudar o ensaio, atualize as três variáveis ou passe `--org`, `--release` e `--run`.

Em 21/10/2026 a ponte criou a [issue #1](https://github.com/bbdw-gh-action/bbw-checkout/issues/1) e reutilizou a mesma issue nas consultas seguintes. O workflow confere a presença de `OPENAI_API_KEY` antes de instalar/iniciar o agente; se ausente, informa a configuração necessária sem alterar o incidente. Após configurar o secret, retome com `workflow_dispatch`, como documentado acima.
