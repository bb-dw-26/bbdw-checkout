# Instruções para agentes

- Escreva documentação, diagnósticos e descrições de PR em português do Brasil.
- Leia `docs/SPEC.md` e o README para compreender contratos, comandos e limites do serviço.
- Investigue o incidente recebido com base no código, nos testes e nas evidências de execução. Não amplie o escopo sem uma tarefa específica.
- Investigue a falha, acrescente uma regressão pertinente e aplique uma correção mínima. No Patchwork, o workflow executa a verificação completa uma vez após o Copilot; não gere relatórios ou prova automatizada antes/depois.
- Não desative o Sentry, não esconda exceções, não enfraqueça testes e não altere fixtures para evitar o caso.
- Relate apenas comandos e verificações realmente executados.
- Não publique credenciais ou dados reais. Não faça merge nem deploy como parte de uma tarefa de diagnóstico ou abertura de PR.
- Preserve branches e histórico existentes.
- Ao concluir a tarefa, encerre todos os processos que você iniciou.

## Patchwork, skills e Sentry

- Em uma execução do Patchwork, leia `.agents/skills/service-regression/SKILL.md` e use a skill `patchwork-investigation`, disponibilizada no diretório de skills do Copilot pelo workflow.
- Consulte o MCP `sentry` para o incidente e a release relevante ao diagnóstico. O servidor é limitado ao projeto Sentry de origem indicado no contexto e a ferramentas de leitura.
- O escopo de arquivos, o padrão de testes e a branch autorizada estão em `.github/patchwork.json`.

- Se a investigação apontar responsabilidade de outro repositório, consulte a skill `patchwork-handoff`, quando disponibilizada pelo workflow. Encaminhe somente para um destino autorizado, sem alterações ou testes locais na origem. Um incidente recebido não pode ser encaminhado novamente.
