# Backend SGQ Online

## Objetivo

Definir uma base simples para desenvolver o backend real do SGQ Online, mantendo fácil manutenção, revisão e evolução.

## Premissas

- Começar com monólito modular.
- Banco relacional.
- APIs REST simples no início.
- Regras de negócio centralizadas em serviços.
- Controllers apenas recebem requisição, validam permissões básicas, chamam serviços e retornam resposta.
- Todo dado pertence a uma empresa/tenant.
- Toda operação crítica deve gerar histórico ou trilha de auditoria.

## Camadas Recomendadas

```text
routes/controllers
services
repositories/queries
database models
```

## Módulos de Backend Esperados

- Autenticação e usuários.
- Empresas/tenants.
- Permissões e perfis.
- Dashboard.
- Organização.
- Documentos.
- BPM/processos.
- Produção.
- Inspeções e liberação.
- Não conformidades, planos de ação e melhorias.
- Calibração.
- Fornecedores.
- Pessoas e treinamentos.
- Satisfação e reclamações.
- Auditorias.
- Indicadores.
- Riscos.
- Projeto e desenvolvimento.
- Setup SGQ e diagnóstico ISO.
- Blog/admin, se for mantido no produto.

## Entidades Transversais

- `empresa_id` em todas as tabelas de dados de negócio.
- `created_by`, `updated_by` quando houver usuário autenticado.
- `created_at`, `updated_at`.
- `deleted_at` quando soft delete fizer sentido.
- Histórico de status para processos críticos.
- Anexos/evidências reutilizáveis por módulos.
- Planos de ação vinculáveis a múltiplas origens.

## Planos de Ação

Planos de ação devem ser centralizados e reutilizados por:

- NC/RNC.
- Auditorias.
- Riscos.
- Mudanças.
- Reclamações.
- Melhorias.
- Análise crítica pela direção.
- Diagnóstico ISO.

Campos mínimos:

- origem_tipo.
- origem_id.
- título.
- descrição.
- responsável.
- prazo.
- status.
- criticidade/prioridade.
- ações 5W2H.
- evidências.
- verificação de eficácia.

## Diagnóstico ISO e IA

No MVP, o diagnóstico pode ser automático por regras locais:

- verifica existência de registros por requisito;
- classifica como atendido, parcial ou lacuna;
- gera recomendações;
- sugere planos de ação.

No futuro, a API de IA poderá:

- analisar documentos e evidências;
- justificar o score;
- sugerir lacunas;
- propor plano de ação;
- gerar resumo executivo.

## Migração do Protótipo

O protótipo usa localStorage. Ao migrar:

- mapear cada chave localStorage para tabela/entidade;
- preservar nomes e fluxos de negócio;
- transformar dados mockados em seed/migrations;
- separar dados por empresa;
- substituir scripts monolíticos por services e components no frontend futuro.

## Critério de Pronto Para Backend

Um módulo só deve ser considerado pronto quando possuir:

- CRUD completo.
- filtros básicos.
- status.
- permissões.
- vínculo com evidências/anexos quando aplicável.
- trilha de auditoria quando aplicável.
- endpoints documentados.
- testes mínimos de serviço.
