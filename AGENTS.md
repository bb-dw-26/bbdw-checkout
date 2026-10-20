# Instruções para agentes

- Escreva documentação, diagnósticos e descrições de PR em português do Brasil.
- Leia `docs/SPEC.md` e identifique o cenário de `docs/FALHAS.md` associado à tarefa.
- Priorize o escopo de 50 minutos de `docs/SPEC.md`: somente CHK-001 é obrigatório; CAT-001 é reserva opcional e os demais casos são complementares. Não expanda a implementação para esses casos sem uma tarefa específica.
- Respeite os contratos HTTP e os limites deste repositório.
- As soluções públicas em `docs/SOLUCOES.md` podem ser consultadas; informe no PR se foram usadas.
- Reproduza a falha, acrescente um teste de regressão e aplique uma correção mínima.
- Não desative o Sentry, não esconda exceções, não enfraqueça testes e não altere fixtures para evitar o caso.
- Relate apenas comandos e verificações realmente executados. Nesta etapa, não há aplicação nem comandos de teste implementados.
- Não publique credenciais ou dados reais. Não faça merge nem deploy como parte de uma tarefa de diagnóstico ou abertura de PR.
- Preserve branches e registros dos cenários. Não reescreva o histórico de ensaios.
- Ao concluir a tarefa, encerre todos os processos que você iniciou.
