# Cenários de falha

CHK-001 está implementado em `demo/chk-001`, com captura do SDK validada por coletor local. A conexão e o evento na conta Sentry ficam para o ensaio conectado. CHK-002 continua apenas especificado. Consultar [operação da demo](DEMO.md).

## CHK-001 — Retirada sem endereço

**Prioridade na apresentação:** Principal — único cenário obrigatório.

**Abertura ao vivo:** deixar a revisão defeituosa implantada antes do início. Nos primeiros 5 minutos, finalizar a compra pela interface e mostrar Sentry → issue → início do workflow. Continuar a explicação enquanto o agente trabalha; retornar ao PR por volta do minuto 30.

**Preparação:** executar a revisão correspondente a `demo/chk-001` com as fixtures sintéticas e as demais dependências em versões saudáveis.

**Reprodução:** `POST /orders com {"customerId":"customer-pickup","fulfillment":"pickup","items":[{"productId":"product-standard","quantity":2}]}`

**Comportamento defeituoso esperado:** HTTP 500 e TypeError, apesar de a retirada ser válida.

**Comportamento correto:** HTTP 201, totalCents=8000 e deliveryAddress=null.

**Telemetria:** registrar serviço `bbdw-checkout`, cenário `CHK-001`, release, request ID e stack trace. A mensagem exata da exceção pode variar conforme o runtime.

**Aceitação:** conferir os testes e casos vizinhos em [Soluções de referência](SOLUCOES.md), repetir a requisição e registrar as evidências em [Avaliação](AVALIACAO.md).


## CHK-002 — Carrinho vazio

**Prioridade na apresentação:** Complementar — fora da implementação obrigatória e da agenda de 50 minutos.


**Preparação:** executar a revisão correspondente a `demo/chk-002` com as fixtures sintéticas e as demais dependências em versões saudáveis.

**Reprodução:** `POST /orders com {"customerId":"customer-delivery","fulfillment":"delivery","items":[]}`

**Comportamento defeituoso esperado:** HTTP 500 e TypeError de redução de array vazio.

**Comportamento correto:** HTTP 422 com error.code=EMPTY_CART; nenhum pedido é criado.

**Telemetria:** registrar serviço `bbdw-checkout`, cenário `CHK-002`, release, request ID e stack trace. A mensagem exata da exceção pode variar conforme o runtime.

**Aceitação:** conferir os testes e casos vizinhos em [Soluções de referência](SOLUCOES.md), repetir a requisição e registrar as evidências em [Avaliação](AVALIACAO.md).
