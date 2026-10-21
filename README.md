# bbw-checkout

Serviço de checkout para a demonstração pública de fluxo agêntico no BBW, apresentação do Banco do Brasil.

Consultar clientes e produtos por HTTP, validar o carrinho e criar pedidos fictícios.

**Tecnologia:** NestJS e TypeScript.

**Estado atual:** aplicação saudável em `main`, Sentry instrumentado, CHK-001 isolado em `demo/chk-001`, integração nativa Sentry → issue e workflow Codex → validação → PR draft. O ensaio real do agente depende de `OPENAI_API_KEY`. [Preparação e operação da demo](docs/DEMO.md).

## Escopo da apresentação de 50 minutos

A apresentação tem **50 minutos** e começa com a aplicação já executando a revisão defeituosa de **CHK-001**. A primeira compra revela a falha; a meta é iniciar Sentry → issue no checkout → workflow nos primeiros **5 minutos**.

Enquanto o agente trabalha em segundo plano, apresentar a arquitetura, o YAML do workflow, o contexto do incidente e os critérios de validação. Retomar os resultados por volta do minuto 30, sem acompanhar logs continuamente. Os cerca de 25 minutos disponíveis não são garantia de conclusão.

**Prioridades:** CHK-001 é o único cenário obrigatório; CAT-001 é reserva opcional, preparada apenas depois do fluxo principal; USR-001, USR-002, CAT-002, CHK-002, WEB-001 e WEB-002 são material complementar. Nenhum cenário adicional bloqueia a entrega.

Manter quatro aplicações pequenas, dados fictícios em memória, HTTP/JSON e CI/CD próprio por repositório. Autenticação real, banco de dados, pagamentos, mensageria, reparos entre repositórios e múltiplos agentes ficam fora desta entrega.

**Papel deste repositório:** Único serviço com defeito na abertura: CHK-001, retirada sem endereço. Implementar o fluxo completo Sentry → issue → agente → PR → revisão → deploy independente. CHK-002 fica como material complementar.

[Roteiro completo e contingência](https://github.com/bbdw-gh-action/bbw-storefront/blob/main/docs/ROTEIRO.md).

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

Para iniciar as quatro aplicações juntas, consulte [execução integrada](https://github.com/bbdw-gh-action/bbw-storefront/blob/main/docs/EXECUCAO.md).

## Documentação

- [Preparação de Sentry, integração nativa e agente](docs/DEMO.md)
- [Especificação funcional e técnica](docs/SPEC.md)
- [Cenários de falha e reprodução](docs/FALHAS.md)
- [Causas e soluções de referência](docs/SOLUCOES.md)
- [Critérios e registro de avaliação](docs/AVALIACAO.md)
- [Fixtures sintéticas](specs/fixtures.json)
- [Catálogo estruturado de cenários](specs/scenarios.json)

## Fluxo da demonstração

Compra com CHK-001 → Sentry → issue em bbw-checkout → GitHub Actions → Codex → PR com correção e teste → revisão → deploy → repetição da requisição.

Cada repositório terá seu próprio CI/CD. O workflow de reparo obrigatório nesta entrega é o do checkout; a expansão para outros repositórios é posterior. Codex é a opção inicial; uma eventual troca para Copilot será avaliada depois. As soluções públicas permitem comparar o reparo com os critérios esperados; este é um exercício guiado.

## Outros repositórios

- [bbw-users](https://github.com/bbdw-gh-action/bbw-users)
- [bbw-catalog](https://github.com/bbdw-gh-action/bbw-catalog)
- [bbw-storefront](https://github.com/bbdw-gh-action/bbw-storefront)
