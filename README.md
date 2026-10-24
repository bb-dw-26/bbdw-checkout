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

## Documentação

- [Configuração Sentry](docs/SENTRY.md)
- [Especificação funcional e técnica](docs/SPEC.md)

## Outros repositórios

- [bbdw-users](https://github.com/bb-dw-26/bbdw-users)
- [bbdw-catalog](https://github.com/bb-dw-26/bbdw-catalog)
- [bbdw-storefront](https://github.com/bb-dw-26/bbdw-storefront)

## Automação compartilhada

Integração com o Patchwork configurada no workflow local. Consulte [operação, skills e MCP](docs/PATCHWORK.md).
