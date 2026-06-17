# Regras do Projeto SGQ Online

## Premissa Principal

O SGQ Online deve ser simples, funcional e fácil de manter. Priorize clareza, rastreabilidade e baixo custo de manutenção acima de arquiteturas sofisticadas.

## Diretrizes Gerais

- Código legível vale mais que abstrações genéricas.
- Evitar dependências pesadas sem necessidade real.
- Preferir fluxos explícitos, fáceis de revisar e testar.
- Cada módulo deve ter cadastro, listagem, edição, filtros, status e evidências quando aplicável.
- Toda regra importante deve estar documentada ou evidente no código.
- Novos textos devem ser gravados em UTF-8 para evitar mojibake.
- Não criar telas apenas demonstrativas quando o requisito exigir execução de processo.

## Backend

- Usar arquitetura simples: rotas/controllers finos, serviços claros e repositórios/queries objetivos.
- Regras de negócio ficam em serviços, não em controllers.
- Validar dados de entrada no backend mesmo que o frontend valide.
- Evitar acoplamento entre módulos; integrações devem ocorrer por IDs, eventos ou serviços pequenos.
- Todo endpoint deve respeitar isolamento por empresa/tenant.
- Toda entidade crítica deve possuir `created_at`, `updated_at` e, quando aplicável, `deleted_at`.
- Preferir paginação, filtros e ordenação simples em listagens.
- Não criar microserviços no início. Começar monolítico modular.

## Banco de Dados

- Preferir modelagem relacional simples.
- Usar migrations versionadas.
- Nomes de tabelas e colunas devem ser explícitos.
- Evitar normalização excessiva quando prejudicar manutenção.
- Evidências, anexos, aprovações e histórico devem ser rastreáveis.
- Campos de status devem usar enums ou tabelas de domínio claras.
- Planejar auditoria/histórico para registros críticos: documentos, NCs, ações, auditorias, mudanças, análise crítica, projetos e diagnóstico ISO.

## Frontend

- Interface deve ser operacional, não apenas visual.
- Manter padrão visual existente: layout lateral, topbar, cards escuros, modais e tabelas.
- Campos de busca nos módulos devem usar a busca global compartilhada quando houver topbar.
- Evitar textos explicativos excessivos dentro da tela; usar rótulos, estados e fluxos claros.
- Se um menu aponta para tela compartilhada com filtro, o filtro deve abrir ativo.
- Cada módulo deve indicar, quando relevante, quais requisitos ISO atende.

## ISO 9001

- Cada requisito ISO coberto deve estar rastreável a um módulo, fluxo, registro ou documento controlado.
- Planos de ação devem ser centralizados no módulo de NCs/Planos, mesmo quando originados em auditorias, riscos, mudanças, reclamações, análises críticas ou melhorias.
- Documentos controlados são evidência preferencial para política, procedimentos, formulários e registros normativos.
- Diagnóstico ISO deve ser automático por regras locais no MVP e preparado para futura API de IA.
- Projeto e Desenvolvimento deve ser executável como processo padrão para atender ISO 9001 requisito 8.3, com opção de customização no BPM.

## Manutenção

- Evitar duplicação de regras críticas entre frontend e backend.
- Funções longas devem ser divididas quando acumularem responsabilidades distintas.
- Comentários devem explicar regra de negócio, não código óbvio.
- Antes de grandes refatores, preservar comportamento existente.
- Manter compatibilidade com dados existentes enquanto o protótipo ainda usa localStorage.

## Desenvolvimento Futuro

- O protótipo atual usa HTML, CSS e JavaScript com localStorage.
- O backend real deve substituir localStorage mantendo a lógica de negócio equivalente.
- Ao migrar, mapear cada chave localStorage atual para entidades/tabelas reais.
- Priorizar um MVP backend funcional: autenticação, empresas/tenants, usuários, permissões, módulos principais e evidências.
