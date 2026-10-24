# Especificação de bbdw-checkout

## Escopo técnico

Aplicação com dados fictícios em memória, contratos HTTP/JSON, build e CI próprios. Autenticação real, banco de dados, pagamentos e mensageria ficam fora do escopo.

## Objetivo e responsabilidade

Consultar clientes e produtos por HTTP, validar o carrinho e criar pedidos fictícios.

É dono dos pedidos. Usa os contratos públicos de users e catalog; não acessa diretamente os dados desses serviços. Não processa pagamentos reais.

Tecnologia: NestJS e TypeScript. Porta local padrão: `3003`. Clientes e produtos são consultados nas APIs de users e catalog. Pedidos retornam confirmação sem persistência ou histórico.

## Interface e regras de negócio

| Método e rota | Resposta esperada |
| --- | --- |
| `GET /health` | 200, `{"status":"ok"}` |
| `POST /orders` | 201, pedido; 422, entrada inválida; 503, dependência indisponível |

A confirmação da interface usa diretamente a resposta de POST /orders; consulta posterior e histórico de pedidos não são necessários.

Requisição:

```json
{"customerId":"customer-pickup","fulfillment":"pickup","items":[{"productId":"product-standard","quantity":2}]}
```

Resposta de criação (ID ilustrativo):

```json
{"id":"order-example","customerId":"customer-pickup","fulfillment":"pickup","deliveryAddress":null,"items":[{"productId":"product-standard","quantity":2,"unitPriceCents":4000}],"totalCents":8000,"currency":"BRL","status":"confirmed"}
```

`fulfillment` aceita `pickup` ou `delivery`. Retirada não exige endereço. Entrega exige endereço no perfil e copia esse endereço para `deliveryAddress`. O carrinho deve ter ao menos um item, quantidades inteiras de 1 a 99 e IDs de produto únicos. O preço vem do catálogo; o cliente não informa o total. Não há frete, desconto ou tributo nesta versão.

Validações retornam 422: `EMPTY_CART`, `ADDRESS_REQUIRED`, `INVALID_QUANTITY`, `DUPLICATE_PRODUCT`, `INVALID_FULFILLMENT`, `CUSTOMER_NOT_FOUND`, `PRODUCT_NOT_FOUND` ou `PRODUCT_UNAVAILABLE`, conforme a causa. Falha de rede ou HTTP 5xx de dependência retorna 503, `DEPENDENCY_UNAVAILABLE`. Use timeout configurável, inicialmente 2 segundos, sem repetição automática de criação de pedidos.

## Contratos comuns

- HTTP/JSON, IDs como strings, valores monetários em centavos inteiros e moeda BRL.
- Envelope de erro: `{"error":{"code":"CODIGO_ESTAVEL","message":"Mensagem legível"},"requestId":"identificador"}`.
- Propagar `X-Request-ID` nas chamadas e respostas; gerar um identificador quando ausente.
- Dados exclusivamente fictícios. Não incluir tokens, cabeçalhos de autenticação ou dados pessoais reais nos eventos.
- Cada serviço possui projeto Sentry próprio e identifica ambiente, release e serviço. Consulte [SENTRY.md](SENTRY.md).
- Contratos de erro esperados (4xx) não são falhas inesperadas por padrão. Exceções inesperadas devem ser instrumentadas explicitamente.
- A implementação deve evitar captura duplicada da mesma exceção.

## Observabilidade

Cada serviço usa projeto Sentry próprio. Identificar ambiente, release e serviço; propagar o request ID e evitar eventos duplicados. Publicar source maps associados à mesma release nos projetos TypeScript. Testes de telemetria usam coletores locais, sem credenciais reais.

## Build e CI

`npm ci` e `npm run check` verificam lint, tipos, build e testes HTTP. O workflow [ci.yml](../.github/workflows/ci.yml) também verifica o build da imagem Docker.

Os comandos locais estão no [README](../README.md). A imagem é construída pelo [Dockerfile](../Dockerfile); não há workflow de deploy remoto configurado neste repositório.

## Automação compartilhada

Integração com o Patchwork configurada no workflow local. Consulte [operação, skills e MCP](PATCHWORK.md).
