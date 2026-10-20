# Especificação de bbw-checkout

## Escopo da apresentação de 50 minutos

A apresentação tem **50 minutos** e começa com a aplicação já executando a revisão defeituosa de **CHK-001**. A primeira compra revela a falha; a meta é iniciar Sentry → issue no checkout → workflow nos primeiros **5 minutos**.

Enquanto o agente trabalha em segundo plano, apresentar a arquitetura, o YAML do workflow, o contexto do incidente e os critérios de validação. Retomar os resultados por volta do minuto 30, sem acompanhar logs continuamente. Os cerca de 25 minutos disponíveis não são garantia de conclusão.

**Prioridades:** CHK-001 é o único cenário obrigatório; CAT-001 é reserva opcional, preparada apenas depois do fluxo principal; USR-001, USR-002, CAT-002, CHK-002, WEB-001 e WEB-002 são material complementar. Nenhum cenário adicional bloqueia a entrega.

Manter quatro aplicações pequenas, dados fictícios em memória, HTTP/JSON e CI/CD próprio por repositório. Autenticação real, banco de dados, pagamentos, mensageria, reparos entre repositórios e múltiplos agentes ficam fora desta entrega.

**Papel deste repositório:** Único serviço com defeito na abertura: CHK-001, retirada sem endereço. Implementar o fluxo completo Sentry → issue → agente → PR → revisão → deploy independente. CHK-002 fica como material complementar.

[Roteiro completo e contingência](https://github.com/bbdw-gh-action/bbw-storefront/blob/main/docs/ROTEIRO.md).

## Objetivo e responsabilidade

Consultar clientes e produtos por HTTP, validar o carrinho e criar pedidos fictícios.

É dono dos pedidos. Usa os contratos públicos de users e catalog; não acessa diretamente os dados desses serviços. Não processa pagamentos reais.

Tecnologia: NestJS e TypeScript. Porta local proposta: `3003`. O armazenamento inicial, quando necessário, é em memória, recriado a partir de fixtures em cada inicialização. Persistência durável fica fora desta primeira entrega.

## Interface e regras de negócio

| Método e rota | Resposta esperada |
| --- | --- |
| `GET /health` | 200, `{"status":"ok"}` |
| `POST /orders` | 201, pedido; 422, entrada inválida; 503, dependência indisponível |
| `GET /orders/:id` | Complementar, fora da entrega: 200, pedido; 404, `ORDER_NOT_FOUND` |

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

As fixtures em `specs/fixtures.json` são dados de entrada para implementação e testes, não endpoints já disponíveis.

## Contratos comuns

- HTTP/JSON, IDs como strings, valores monetários em centavos inteiros e moeda BRL.
- Envelope de erro: `{"error":{"code":"CODIGO_ESTAVEL","message":"Mensagem legível"},"requestId":"identificador"}`.
- Propagar `X-Request-ID` nas chamadas e respostas; gerar um identificador quando ausente.
- Dados exclusivamente fictícios. Não incluir tokens, cabeçalhos de autenticação ou dados pessoais reais nos eventos.
- O checkout deve ter projeto Sentry próprio e identificar ambiente, release, serviço e cenário. A instrumentação dos demais serviços é posterior; se adicionada, usar projetos próprios.
- Contratos de erro esperados (4xx) não são falhas inesperadas por padrão. Os defeitos descritos devem gerar exceções reais, instrumentadas explicitamente.
- A implementação deve evitar captura duplicada da mesma exceção.

## Observabilidade

Para CHK-001, instrumentar o checkout, publicar source maps associados à release e comprovar o envio de uma exceção real ao Sentry. Propagar o request ID pelos serviços e evitar eventos duplicados. Testes automatizados usam clientes simulados, sem credenciais reais.

Users e catalog devem permanecer saudáveis; a interface mostra o erro retornado pelo checkout e permite repetir a mesma compra após o reparo. A instrumentação Sentry própria desses três repositórios não é requisito desta apresentação.

Se CAT-001 for preparado como reserva, instrumentar a recuperação do panic HTTP no Go para capturar stack e retornar 500 sem derrubar o serviço. Essa preparação é opcional e ocorre depois da conclusão do cenário principal.

## CI/CD independente

**CI previsto:** Instalação pelo lockfile, lint, tipos, testes unitários e HTTP, testes de contrato com dependências simuladas e build NestJS.

**CD previsto:** Imagem própria, URLs de users e catalog configuráveis, deploy apenas do checkout, release e rollback próprios.

O destino de hospedagem será escolhido posteriormente. O workflow de reparo do checkout recebe o incidente CHK-001 e abre um PR no checkout. Workflows equivalentes nos outros repositórios ficam para uma etapa posterior. Os comandos de instalação e verificação serão adicionados junto à implementação; não há workflow de deploy executável nesta etapa.

## Critérios de entrega para os 50 minutos

- Único serviço com defeito na abertura: CHK-001, retirada sem endereço. Implementar o fluxo completo Sentry → issue → agente → PR → revisão → deploy independente. CHK-002 fica como material complementar.
- Validar os contratos usados pela compra principal e os casos vizinhos necessários à correção.
- Manter build, testes e deploy independentes deste repositório.
- Ensaiar a compra com as quatro versões fixadas e registrar request ID e releases.
- Preparar um resultado anterior de CHK-001, identificado como ensaio, para a contingência.
- Documentar execução local e encerramento dos processos.

Para checkout, a entrega exige CHK-001 reproduzível, evento Sentry, issue, execução do agente, PR com teste falhando antes e passando depois e repetição da compra corrigida. Para os demais repositórios, a entrega exige suportar essa jornada de forma saudável. As soluções e falhas complementares continuam públicas para exploração posterior, sem obrigação de implementação nesta etapa.
