# Especificação de bbw-checkout

## Objetivo e responsabilidade

Consultar clientes e produtos por HTTP, validar o carrinho e criar pedidos fictícios.

É dono dos pedidos. Usa os contratos públicos de users e catalog; não acessa diretamente os dados desses serviços. Não processa pagamentos reais.

Tecnologia: NestJS e TypeScript. Porta local proposta: `3003`. O armazenamento inicial, quando necessário, é em memória, recriado a partir de fixtures em cada inicialização. Persistência durável fica fora desta primeira entrega.

## Interface e regras de negócio

| Método e rota | Resposta esperada |
| --- | --- |
| `GET /health` | 200, `{"status":"ok"}` |
| `POST /orders` | 201, pedido; 422, entrada inválida; 503, dependência indisponível |
| `GET /orders/:id` | 200, pedido; 404, `ORDER_NOT_FOUND` |

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

As fixtures em `specs/fixtures.json` são dados de entrada para implementação e testes, não endpoints já disponíveis.

## Contratos comuns

- HTTP/JSON, IDs como strings, valores monetários em centavos inteiros e moeda BRL.
- Envelope de erro: `{"error":{"code":"CODIGO_ESTAVEL","message":"Mensagem legível"},"requestId":"identificador"}`.
- Propagar `X-Request-ID` nas chamadas e respostas; gerar um identificador quando ausente.
- Dados exclusivamente fictícios. Não incluir tokens, cabeçalhos de autenticação ou dados pessoais reais nos eventos.
- Cada aplicação usa seu próprio projeto Sentry e identifica ambiente, release, serviço e cenário de ensaio.
- Contratos de erro esperados (4xx) não são falhas inesperadas por padrão. Os defeitos descritos devem gerar exceções reais, instrumentadas explicitamente.
- A implementação deve evitar captura duplicada da mesma exceção.

## Observabilidade

Inicializar o SDK apropriado antes da aplicação. Em TypeScript, publicar source maps associados à release. Em Go, capturar panics no limite HTTP, registrar a stack e retornar 500 sem derrubar o serviço; não presumir que a recuperação padrão de net/http envia eventos ao Sentry. No React, conectar o limite de erro ao SDK.

Correlacionar a requisição com a release e o cenário. Verificar a entrega do evento em ensaio real, aguardando a ingestão. Testes unitários não devem depender de Sentry ou credenciais reais.


## CI/CD independente

**CI previsto:** Instalação pelo lockfile, lint, tipos, testes unitários e HTTP, testes de contrato com dependências simuladas e build NestJS.

**CD previsto:** Imagem própria, URLs de users e catalog configuráveis, deploy apenas do checkout, release e rollback próprios.

O destino de hospedagem será escolhido posteriormente. O workflow de reparo recebe contexto do incidente, trabalha neste repositório e abre um PR. Os comandos de instalação e verificação serão adicionados junto à implementação; não há workflow de deploy executável nesta etapa.

## Critérios de entrega

- Implementar o caminho saudável de acordo com este contrato.
- Criar testes dos comportamentos esperados, incluindo entradas inválidas.
- Instrumentar falhas inesperadas e comprovar captura em um ambiente de demonstração.
- Implementar cenários isolados conforme `FALHAS.md`, preservando revisões reproduzíveis.
- Executar CI com ferramentas próprias desta tecnologia.
- Documentar execução local, configuração e encerramento de processos.
