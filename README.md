# bbw-checkout

Serviço de checkout para a demonstração pública de fluxo agêntico no BBW, apresentação do Banco do Brasil.

Consultar clientes e produtos por HTTP, validar o carrinho e criar pedidos fictícios.

**Tecnologia prevista:** NestJS e TypeScript.

**Estado atual:** especificações iniciais. A aplicação, os defeitos executáveis, a integração Sentry e os workflows de CI/CD e reparo ainda serão implementados.

## Escopo da apresentação de 50 minutos

A apresentação tem **50 minutos** e começa com a aplicação já executando a revisão defeituosa de **CHK-001**. A primeira compra revela a falha; a meta é iniciar Sentry → issue no checkout → workflow nos primeiros **5 minutos**.

Enquanto o agente trabalha em segundo plano, apresentar a arquitetura, o YAML do workflow, o contexto do incidente e os critérios de validação. Retomar os resultados por volta do minuto 30, sem acompanhar logs continuamente. Os cerca de 25 minutos disponíveis não são garantia de conclusão.

**Prioridades:** CHK-001 é o único cenário obrigatório; CAT-001 é reserva opcional, preparada apenas depois do fluxo principal; USR-001, USR-002, CAT-002, CHK-002, WEB-001 e WEB-002 são material complementar. Nenhum cenário adicional bloqueia a entrega.

Manter quatro aplicações pequenas, dados fictícios em memória, HTTP/JSON e CI/CD próprio por repositório. Autenticação real, banco de dados, pagamentos, mensageria, reparos entre repositórios e múltiplos agentes ficam fora desta entrega.

**Papel deste repositório:** Único serviço com defeito na abertura: CHK-001, retirada sem endereço. Implementar o fluxo completo Sentry → issue → agente → PR → revisão → deploy independente. CHK-002 fica como material complementar.

[Roteiro completo e contingência](https://github.com/bbdw-gh-action/bbw-storefront/blob/main/docs/ROTEIRO.md).

## Documentação

- [Especificação funcional e técnica](docs/SPEC.md)
- [Cenários de falha e reprodução](docs/FALHAS.md)
- [Causas e soluções de referência](docs/SOLUCOES.md)
- [Critérios e registro de avaliação](docs/AVALIACAO.md)
- [Fixtures sintéticas](specs/fixtures.json)
- [Catálogo estruturado de cenários](specs/scenarios.json)

## Fluxo da demonstração

Compra com CHK-001 → Sentry → issue em bbw-checkout → GitHub Actions → Copilot ou Codex → PR com correção e teste → revisão → deploy → repetição da requisição.

Cada repositório terá seu próprio CI/CD. O workflow de reparo obrigatório nesta entrega é o do checkout; a expansão para outros repositórios é posterior. A escolha entre Copilot e Codex permanece aberta. As soluções públicas permitem comparar o reparo com os critérios esperados; este é um exercício guiado.

## Outros repositórios

- [bbw-users](https://github.com/bbdw-gh-action/bbw-users)
- [bbw-catalog](https://github.com/bbdw-gh-action/bbw-catalog)
- [bbw-storefront](https://github.com/bbdw-gh-action/bbw-storefront)
