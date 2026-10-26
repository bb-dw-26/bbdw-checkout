# bbdw-checkout

Serviço de checkout em NestJS e TypeScript. Consulta clientes e produtos por HTTP, valida o carrinho e cria pedidos fictícios.

## Executar localmente

Pré-requisito: Node.js 24 e npm. Instale as dependências e inicie o modo de desenvolvimento:

```sh
npm ci
npm run dev
```

Porta padrão: **3003**. Os valores locais já funcionam por padrão. Para personalizar, copie `.env.example` para `.env` e ajuste as URLs/porta.

```sh
npm run check
```

`npm run build` compila o projeto; `npm start` executa a versão compilada. Os testes HTTP usam portas efêmeras e encerram os servidores automaticamente.

Encerre o processo com **Ctrl+C** ao terminar. Cada aplicação tem seu próprio lockfile ou módulo Go, testes e workflow em `.github/workflows/ci.yml`. O CI também constrói a imagem; a publicação e o deploy serão configurados quando a hospedagem for escolhida.

Para iniciar as quatro aplicações juntas, consulte [execução integrada](https://github.com/bb-dw-26/bbdw-storefront/blob/main/docs/EXECUCAO.md).

## Arquitetura

O código é organizado por módulo de negócio, com classes separadas por responsabilidade:

```text
src/
  main.ts                     # inicialização do processo e da instrumentação
  app.ts                      # criação e configuração da aplicação
  app.module.ts               # composição dos módulos
  common/
    http/
      exceptions/             # erros da API
      filters/                # envelope de erro e captura de falhas
      middleware/             # request ID antes do parser JSON e do CORS
    telemetry/                # Sentry e encerramento da telemetria
  modules/
    health/                   # endpoint de saúde
    orders/
      controllers/            # rotas e contratos HTTP
      services/               # regras de negócio
      dto/                    # contrato de entrada
      pipes/                  # validação de entrada
      stores/                 # reserva e replay de intenções de compra
  integrations/
    clients/                  # clientes HTTP de users e catalog
```

Testes `*.test.ts` ficam em `src`, junto do componente ou módulo verificado. Cada módulo declara seus controllers, providers e dependências; controllers delegam as regras aos services. O filtro global é registrado pelo `HttpModule`. O request ID usa middleware para cobrir também JSON inválido, rotas inexistentes e preflight; interceptors devem ser adicionados quando houver uma responsabilidade específica no ciclo do controller.

`npm run check` executa lint, tipos e todos os testes recursivamente. `npm run build` inclui os testes compilados usados pelo Patchwork. `npm run build:production` gera somente código de produção e é usado pelo Docker. Ambos limpam `dist` antes de compilar. A configuração do Patchwork acompanha os caminhos dos módulos e exige regressões dentro de `src`.

## Documentação

- [Configuração Sentry](docs/SENTRY.md)
- [Especificação funcional e técnica](docs/SPEC.md)

## Outros repositórios

- [bbdw-users](https://github.com/bb-dw-26/bbdw-users)
- [bbdw-catalog](https://github.com/bb-dw-26/bbdw-catalog)
- [bbdw-storefront](https://github.com/bb-dw-26/bbdw-storefront)

## Automação compartilhada

Integração com o Patchwork configurada no workflow local. Consulte [operação, skills e MCP](docs/PATCHWORK.md).
