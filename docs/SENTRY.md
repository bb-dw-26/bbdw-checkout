# Sentry — bbdw-checkout

O SDK `@sentry/node` é inicializado antes do NestJS. O filtro HTTP captura respostas 5xx uma vez; respostas 4xx não geram eventos. Cada evento identifica ambiente, release, serviço e request ID.

## Configuração

Copie `.env.example` para `.env` e configure `SENTRY_DSN`, `SENTRY_ENVIRONMENT` e `SENTRY_RELEASE`. `DEMO_SCENARIO` e `DEMO_RUN_ID` são tags opcionais de identificação da execução. `npm start` e `npm run dev` carregam `.env`. Sem DSN, o envio fica desativado.

Use o SHA completo da revisão executada como release. Para source maps, execute `npm run build` e `npm run sentry:upload -- ../bbdw-checkout` no Patchwork com `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT=bbdw-checkout` no ambiente. O upload usa `dist/src` e o prefixo `app:///src`; execute o mesmo build na aplicação.

Nunca grave tokens no repositório ou na imagem da aplicação. O runtime precisa apenas do DSN; o token de upload fica no ambiente de build. Os testes usam um coletor HTTP local e verificam captura e filtragem de dados sem credenciais reais.

O upload é mantido no [Patchwork](https://github.com/bb-dw-26/patchwork/blob/main/docs/SOURCEMAPS.md). Execute o build neste app e o comando de publicação a partir do checkout do Patchwork; ele carrega o `.env` da pasta indicada.
