# Guia de casos de uso e validação do SGQ Online

Versão: 0.1  
Status: base para desenvolvimento, homologação e regressão  
Fontes: `AGENTS.md`, `prompt-desenvolvimento-sgqonline.txt`, `perguntas-cobertura-iso9001.txt` e protótipo HTML/CSS/JavaScript.

## 1. Objetivo

Este documento transforma as regras do produto em comportamentos verificáveis. Ele deve ser usado para:

- orientar frontend, API, serviços, banco e integrações;
- definir critérios de aceite antes da implementação;
- criar testes automatizados e roteiros de homologação;
- validar segurança, isolamento entre empresas e rastreabilidade;
- validar se os fluxos são compreensíveis e utilizáveis;
- impedir que uma tela visual seja considerada pronta sem executar o processo correspondente.

O protótipo em `localStorage` demonstra regras e interação, mas não comprova segurança. Autenticação, autorização, isolamento multi-tenant, 2FA, upload seguro, concorrência, integridade e auditoria imutável só poderão ser aprovados no backend oficial.

## 2. Convenções

### 2.1 Identificadores

- `UC-SYS`: caso de uso geral do sistema.
- `UC-<MOD>`: caso de uso de módulo.
- `TF`: teste funcional.
- `TS`: teste de segurança.
- `TU`: teste de usabilidade e acessibilidade.
- `TI`: teste de integração.
- `TNF`: teste não funcional.

### 2.2 Estado de implementação

- `Mock parcial`: existe interação no protótipo, mas faltam persistência real ou regras completas.
- `Backend obrigatório`: depende de API, banco, e-mail, arquivos, 2FA ou isolamento real.
- `Gap`: requisito ainda sem execução suficiente no protótipo.

### 2.3 Critério mínimo de conclusão

Um caso de uso só estará concluído quando:

1. o fluxo principal e os fluxos de erro estiverem implementados;
2. o backend validar dados, tenant, plano e permissões;
3. alterações críticas gerarem histórico e auditoria;
4. anexos e evidências permanecerem rastreáveis;
5. os testes funcionais, de segurança e de usabilidade vinculados passarem;
6. textos, estados vazios, mensagens de erro e ajuda contextual estiverem revisados;
7. houver evidência do teste em CI ou na homologação.

## 3. Atores e escopos

| Ator | Escopo esperado |
|---|---|
| Visitante | Landing page, blog, cadastro e pesquisas públicas válidas. |
| Usuário | Módulos e ações liberados; por padrão, somente os próprios registros. |
| Aprovador | Aprova registros nos quais foi configurado, inclusive próprios registros quando explicitamente autorizado. |
| Administrador da Qualidade | Administra processos, configurações e registros do SGQ, sem usuários, cobrança ou configurações globais da empresa. |
| Administrador da Empresa | Usuários, setores, permissões, módulos, contratos e configurações administrativas do tenant. |
| Admin Master | Administração global; 2FA obrigatório; dados internos de tenant somente após aprovação válida por uma hora. |
| Respondente externo | Responde pesquisa pública por token válido, sem acessar o sistema interno. |
| Sistema | Executa prazos, notificações, expirações, cálculos, versionamento e integrações automáticas. |

## 4. Casos de uso gerais

### UC-SYS-01 — Cadastrar empresa e iniciar trial

**Atores:** visitante e Administrador da Empresa.  
**Pré-condições:** e-mail ainda não vinculado a uma empresa ativa.  
**Fluxo:** informar responsável e empresa; escolher Essencial ou Profissional; aceitar termos versionados; confirmar cadastro; criar tenant e administrador; iniciar 30 dias; encaminhar ao onboarding.  
**Alternativas:** alertar e-mail pessoal na primeira tentativa e permitir continuidade consciente na segunda; rejeitar e-mail duplicado; impedir planos consultivos no autosserviço.  
**Critérios de aceite:** início e término do trial persistidos; versão dos termos, usuário, e-mail, data, hora e IP registrados; limites do plano ativos; senha não armazenada em texto puro.  
**Testes:** `TF-SYS-01`, `TS-AUTH-01`, `TS-TENANT-01`, `TU-ONB-01`.  
**Estado:** Mock parcial; backend obrigatório.

### UC-SYS-02 — Autenticar e encerrar sessão

**Atores:** todos os usuários internos.  
**Fluxo:** informar credenciais; validar conta, tenant e status; aplicar 2FA quando obrigatório; criar sessão segura; abrir página permitida; permitir logout e revogação.  
**Alternativas:** credencial inválida; usuário desativado; empresa suspensa; excesso de tentativas; 2FA inválido ou expirado.  
**Critérios de aceite:** mensagem não revela se o e-mail existe; sessão rotacionada após login; logout invalida token; Admin Master nunca acessa sem 2FA.  
**Testes:** `TS-AUTH-01` a `TS-AUTH-06`.  
**Estado:** Mock parcial; backend obrigatório.

### UC-SYS-03 — Concluir onboarding da empresa

**Atores:** Administrador da Empresa e Administrador da Qualidade.  
**Fluxo:** dados da empresa; plano e trial; módulos; setores; pessoas e permissões; cadastros base; documentos; fluxos padrão; organização; diagnóstico ISO; conclusão.  
**Critérios de aceite:** progresso persistente por usuário/empresa; etapas reabertas sem perda; dicas contextuais disponíveis em cada tela; nenhuma etapa marcada apenas por visitar a página quando exigir cadastro.  
**Testes:** `TF-ONB-01` a `TF-ONB-04`, `TU-ONB-01` a `TU-ONB-03`.  
**Estado:** Mock parcial.

### UC-SYS-04 — Administrar usuários, setores e permissões

**Atores:** Administrador da Empresa.  
**Fluxo:** criar usuário; vincular setor; definir perfil; configurar ações por módulo e escopo; enviar convite; editar ou desativar; delegar temporariamente.  
**Critérios de aceite:** limite de usuários respeitado; permissões verificadas na API; desativação preserva histórico; delegação expira automaticamente; alteração do administrador principal gera processo formal e notificação.  
**Testes:** `TF-PERM-01` a `TF-PERM-07`, `TS-AUTHZ-01` a `TS-AUTHZ-06`.  
**Estado:** Mock parcial; backend obrigatório.

### UC-SYS-05 — Admin Master solicitar acesso a uma empresa

**Atores:** Admin Master e qualquer Administrador da Empresa.  
**Fluxo:** Admin Master informa empresa e motivo; sistema notifica administradores; um administrador aprova ou nega; se aprovado, abre sessão de uma hora; registra todas as ações; expira ou é revogada.  
**Critérios de aceite:** sem aprovação não há leitura de dados; aprovação de um tenant nunca libera outro; prazo calculado no servidor; nova aprovação após expiração; trilha registra solicitação, decisão, entrada, ações e encerramento.  
**Testes:** `TS-MASTER-01` a `TS-MASTER-08`.  
**Estado:** Mock parcial; backend obrigatório.

### UC-SYS-06 — Aplicar plano, limites e trial

**Atores:** Administrador da Empresa e sistema.  
**Fluxo:** carregar plano; liberar módulos; controlar usuários, armazenamento, unidades e análises de IA; avisar proximidade do limite; impedir excesso ou encaminhar solicitação comercial.  
**Regras:** BPM disponível em todos os planos; IA mensal = 0/20/40/60; análises adicionais podem ser solicitadas; Essencial e Profissional têm trial de 30 dias.  
**Critérios de aceite:** regra no backend; downgrade não apaga dados; funcionalidades bloqueadas exibem motivo e ação possível; consumo de IA é atômico e auditável.  
**Testes:** `TF-PLAN-01` a `TF-PLAN-08`, `TS-PLAN-01`.  
**Estado:** Mock parcial; medição real de IA é gap.

### UC-SYS-07 — Buscar globalmente

**Atores:** usuário autenticado.  
**Fluxo:** digitar código ou nome; receber resultados categorizados; navegar por teclado; abrir resultado.  
**Critérios de aceite:** pesquisa somente dados permitidos do tenant; Enter abre primeiro resultado; Escape fecha; resultados indicam Documento, Processo, Módulo ou Ação.  
**Testes:** `TF-SEARCH-01` a `TF-SEARCH-04`, `TS-SEARCH-01`, `TU-KEY-01`.  
**Estado:** Mock parcial.

### UC-SYS-08 — Anexar evidência

**Atores:** usuário com permissão de edição.  
**Fluxo:** selecionar registro; informar título/descrição; selecionar arquivo; validar tipo e tamanho; armazenar; vincular ao registro; auditar.  
**Regras:** anexo padrão 5 MB configurável; Anexo Grande padrão 100 MB configurável até 1 GB.  
**Critérios de aceite:** arquivo fora do tenant é inacessível; nome físico não é controlado pelo usuário; malware e MIME são verificados; download exige autorização; exclusão lógica preserva vínculo e histórico.  
**Testes:** `TF-FILE-01` a `TF-FILE-05`, `TS-FILE-01` a `TS-FILE-08`.  
**Estado:** metadados no mock; backend obrigatório.

### UC-SYS-09 — Receber notificações

**Atores:** usuário e sistema.  
**Fluxo:** evento gera notificação interna; preferências definem envio por e-mail; usuário abre, marca como lida ou acessa origem.  
**Critérios de aceite:** destinatário e tenant corretos; reprocessamento não duplica envio; falha de e-mail não desfaz transação principal; conteúdo não expõe informação indevida.  
**Testes:** `TF-NOT-01` a `TF-NOT-04`, `TS-NOT-01`.  
**Estado:** notificação interna parcial; e-mail é backend obrigatório.

### UC-SYS-10 — Consultar histórico e auditoria

**Atores:** usuários autorizados e auditores.  
**Fluxo:** filtrar por módulo, entidade, usuário, ação e período; abrir evento; verificar antes/depois quando aplicável; exportar conforme permissão.  
**Critérios de aceite:** eventos críticos são append-only; horário padronizado; tenant obrigatório; segredos e conteúdo pessoal desnecessário não entram no log.  
**Testes:** `TF-AUDIT-01` a `TF-AUDIT-03`, `TS-LOG-01` a `TS-LOG-05`.  
**Estado:** Mock parcial; imutabilidade depende do backend.

### UC-SYS-11 — Atender solicitação LGPD

**Atores:** titular, responsável de privacidade e Administrador da Empresa.  
**Fluxo:** receber pedido; confirmar identidade; classificar consulta/correção/exportação/anonimização/exclusão; localizar dados; avaliar retenção legal; executar; responder e auditar.  
**Critérios de aceite:** prazo e responsável registrados; exclusão não destrói evidência que deva ser retida; exportação pertence ao titular correto; dados para IA respeitam consentimento/configuração da empresa.  
**Testes:** `TF-LGPD-01` a `TF-LGPD-05`, `TS-PRIV-01` a `TS-PRIV-04`.  
**Estado:** Gap; validação jurídica pendente.

## 5. Casos de uso por módulo

### 5.1 Dashboard — `DASH`

- `UC-DASH-01`: consolidar documentos, NCs, ações, auditorias, riscos, indicadores e treinamentos reais do tenant.
- `UC-DASH-02`: calcular maturidade ISO com a mesma regra do diagnóstico, sem percentuais estáticos.
- `UC-DASH-03`: abrir atalho, alerta ou atividade recente respeitando módulo, plano e permissão.

**Aceite:** totais reconciliam com listagens; filtros de período funcionam; estado vazio orienta a primeira ação; nenhuma consulta agrega dados de outro tenant.  
**Estado:** Mock parcial.

### 5.2 Setup da empresa — `SETUP`

- `UC-SETUP-01`: cadastrar dados básicos da empresa e admin inicial.
- `UC-SETUP-02`: cadastrar setores e vincular responsáveis.
- `UC-SETUP-03`: cadastrar usuários e associar perfil/setor.
- `UC-SETUP-04`: cadastrar máquinas/recursos críticos ou marcar etapa como não aplicável.
- `UC-SETUP-05`: definir módulos ativos da empresa.
- `UC-SETUP-06`: definir permissões por usuário, módulo e ação.
- `UC-SETUP-07`: revisar checklist e marcar setup como concluído.

**Aceite:** setup não exige documentos existentes; diagnóstico ISO fica em Organização; percentual mede conclusão da implantação; BPM fica sempre disponível; permissões e responsáveis são persistidos para orientar segurança e pendências do backend oficial.  
**Testes:** cadastro mínimo, busca, etapa de máquinas não aplicável, módulos ativos, matriz de permissões, responsáveis por setor e checklist final.  
**Estado:** Mock parcial.

### 5.3 Organização — `ORG`

- `UC-ORG-01`: cadastrar contexto, escopo e partes interessadas.
- `UC-ORG-02`: preencher SWOT e calcular `impacto + urgência + controle`.
- `UC-ORG-03`: converter item relevante da SWOT em risco, melhoria ou plano.
- `UC-ORG-04`: controlar recursos, infraestrutura e ambiente.
- `UC-ORG-05`: solicitar, avaliar risco, aprovar e acompanhar mudança.
- `UC-ORG-06`: conduzir análise crítica pela direção com pauta, participantes, decisões, ações e ata.
- `UC-ORG-07`: consolidar análise de dados e diagnóstico ISO.

**Aceite:** corte da SWOT configurável; toda mudança exige avaliação de risco, aprovação e ação quando aplicável; ações são criadas no módulo central; análise crítica preserva ata e aprovação.  
**Estado:** Mock parcial; matriz RACI/organograma sistêmico permanecem para fase posterior.

### 5.4 Documentos — `DOC`

- `UC-DOC-01`: configurar categoria, campos, validade, aprovadores e fluxo.
- `UC-DOC-02`: criar documento com código único, autor, categoria e anexo.
- `UC-DOC-03`: revisar, aprovar, publicar e versionar documento.
- `UC-DOC-04`: manter versão anterior válida para processos já iniciados quando aplicável.
- `UC-DOC-05`: emitir, destacar e rastrear cópia controlada.
- `UC-DOC-06`: solicitar edição; dono aprova; solicitante recebe arquivo autorizado.
- `UC-DOC-07`: assinar por 2FA e verificar autoria, integridade, data e código público.
- `UC-DOC-08`: acessar `Minhas pendências`, reunir documentos de todas as pastas atribuídos ao usuário, revisar e registrar sua aprovação.

**Aceite:** documento publicado não é sobrescrito; código/versão são consistentes; acesso a arquivo respeita permissão; cópias e downloads têm histórico; assinatura inválida não publica; pendências já aprovadas pelo usuário desaparecem; fluxo sequencial só apresenta a tarefa no momento correto; contador acompanha a lista.  
**Estado:** Mock parcial; arquivo real, 2FA e verificação são backend obrigatório.

### 5.5 BPM, processos e formulários — `BPM`

- `UC-BPM-01`: criar processo com nome, código, responsáveis, SLA e permissões.
- `UC-BPM-02`: modelar início, tarefa, decisão, aprovação, notificação e fim.
- `UC-BPM-03`: criar formulário com texto, número, data, lista, usuário, setor, anexo e Anexo Grande.
- `UC-BPM-04`: validar o desenho antes da publicação.
- `UC-BPM-05`: publicar nova versão sem alterar instâncias em andamento.
- `UC-BPM-06`: iniciar instância e atribuir tarefas.
- `UC-BPM-07`: executar tarefa, decisão e aprovação até o encerramento.
- `UC-BPM-08`: acompanhar instâncias, atrasos, histórico e evidências.

**Aceite:** todo módulo processual possui modelo padrão; versão fica congelada por instância; transição inválida é rejeitada no servidor; aprovadores e permissões são aplicados; tour explica modelagem e versionamento.  
**Testes:** fluxo linear, decisão com dois caminhos, rejeição e retorno, SLA, delegação, versão nova com instância antiga, anexo grande e concorrência de duas aprovações.  
**Estado:** Mock parcial; motor transacional completo é backend obrigatório.

### 5.6 Processo produtivo — `PROD`

- `UC-PROD-01`: cadastrar/importar pedido e itens.
- `UC-PROD-02`: criar ordem de produção e etapas.
- `UC-PROD-03`: apontar início, pausa, quantidade, operador e término.
- `UC-PROD-04`: vincular documentos e critérios vigentes.
- `UC-PROD-05`: encaminhar item para inspeção/liberação.

**Aceite:** rastreabilidade pedido → OP → etapa → operador → inspeção; quantidades não ficam negativas; alteração de cadastro preserva o snapshot usado; operação em tablet é utilizável.  
**Estado:** Mock parcial; escopo Industrial/Enterprise.

### 5.7 Inspeções e liberação — `INSP`

- `UC-INSP-01`: criar plano/checklist de inspeção.
- `UC-INSP-02`: registrar medições, defeitos e evidências.
- `UC-INSP-03`: aprovar, rejeitar ou colocar produto em quarentena.
- `UC-INSP-04`: gerar saída não conforme, NC e plano de ação.
- `UC-INSP-05`: liberar com responsável, data e evidência.

**Aceite:** somente autorizado libera; item reprovado não avança; defeito mantém vínculo com OP/pedido; decisão é auditada.  
**Estado:** Mock parcial; escopo Industrial/Enterprise.

### 5.8 Não conformidades, CAPA, planos e melhorias — `NC`

- `UC-NC-01`: registrar NC com origem, descrição, requisito, responsável e evidência.
- `UC-NC-02`: aplicar correção/contenção e análise de causa.
- `UC-NC-03`: criar CAPA e tarefas 5W2H por responsável.
- `UC-NC-04`: verificar eficácia e encerrar.
- `UC-NC-05`: registrar melhoria contínua independente de NC.
- `UC-NC-06`: receber ação originada em auditoria, risco, mudança, reclamação, SWOT, indicador ou diagnóstico.

**Aceite:** origem preservada; tarefa tem prazo/status/responsável; encerramento exige evidência e eficácia quando configurada; desativação exige motivo; menu de origem abre o registro relacionado.  
**Estado:** Mock parcial.

### 5.9 Calibração — `CAL`

- `UC-CAL-01`: cadastrar instrumento, faixa, resolução, localização e responsável.
- `UC-CAL-02`: programar calibração e emitir alertas.
- `UC-CAL-03`: registrar certificado, resultado e validade.
- `UC-CAL-04`: tratar instrumento vencido ou reprovado e avaliar medições anteriores.

**Aceite:** instrumento vencido não aparece como válido; certificado é evidência; alteração de periodicidade é auditada; reprovação pode gerar NC/ação.  
**Estado:** Mock parcial; Profissional ou superior.

### 5.10 Fornecedores — `FORN`

- `UC-FORN-01`: cadastrar, classificar e homologar fornecedor.
- `UC-FORN-02`: configurar perguntas e pesos totalizando 100%.
- `UC-FORN-03`: enviar questionário externo com token e prazo.
- `UC-FORN-04`: avaliar qualidade, certificados, prazo, quantidade, rastreabilidade, requisitos, mudanças, NC e atendimento.
- `UC-FORN-05`: calcular score, classificar e manter histórico do modelo respondido.
- `UC-FORN-06`: bloquear, reavaliar ou gerar ação/NC.

**Aceite:** avaliação preserva snapshot; token não revela outros fornecedores; peso inválido impede publicação; score segue regra configurada.  
**Estado:** cadastro/avaliação interna parcial; página pública de fornecedor é gap.

### 5.11 Pessoas, funções e treinamentos — `PES`

- `UC-PES-01`: cadastrar/importar colaborador e vincular setor/função.
- `UC-PES-02`: definir competências e treinamentos requeridos por função.
- `UC-PES-03`: planejar e registrar treinamento com presença/evidência.
- `UC-PES-04`: avaliar eficácia e atualizar matriz requerido versus realizado.
- `UC-PES-05`: comprovar comunicação da política da qualidade.

**Aceite:** importação informa erros por linha; treinamento vencido gera alerta; mudança de função recalcula lacunas sem apagar histórico; dados pessoais têm acesso restrito.  
**Estado:** Mock parcial; importação real é gap.

### 5.12 Satisfação e reclamações — `SAT`

- `UC-SAT-01`: configurar modelo NPS/ISO com perguntas editáveis.
- `UC-SAT-02`: criar pesquisa para cliente específico, token e data limite.
- `UC-SAT-03`: cliente responde sem login; sistema calcula NPS e preserva snapshot.
- `UC-SAT-04`: após envio, oferecer modal opcional para conhecer o SGQ Online.
- `UC-SAT-05`: registrar reclamação e decidir por NC ou plano de ação.
- `UC-SAT-06`: consolidar satisfação em indicadores e análise crítica.

**Aceite:** nome do cliente vem da pesquisa e não é digitado; expirada não aceita resposta; token tem uso controlado; e-mail comercial é opcional e separado; resposta não expõe dados internos.  
**Estado:** Mock parcial.

### 5.13 Auditorias internas — `AUD`

- `UC-AUD-01`: criar programa e plano com escopo, objetivos, critérios, auditor e datas.
- `UC-AUD-02`: montar checklist por cláusula ISO.
- `UC-AUD-03`: executar e registrar conformidade, observação ou NC com evidência.
- `UC-AUD-04`: gerar NC/plano a partir de achado.
- `UC-AUD-05`: emitir relatório, aprovar e alimentar análise crítica/diagnóstico.

**Aceite:** auditor não altera relatório aprovado sem revisão; achado mantém cláusula e origem; ações aparecem no módulo central; conflito de interesse pode ser configurado.  
**Estado:** Mock parcial.

### 5.14 Indicadores e KPIs — `KPI`

- `UC-KPI-01`: cadastrar indicador, unidade, frequência, meta, direção, fonte, responsável e cláusula.
- `UC-KPI-02`: lançar/importar resultado e evidência.
- `UC-KPI-03`: calcular atendimento conforme direção da meta.
- `UC-KPI-04`: analisar tendência e gerar ação quando fora da meta.
- `UC-KPI-05`: consolidar na análise de dados e análise crítica.

**Aceite:** “maior é melhor”, “menor é melhor” e faixa funcionam; períodos duplicados são tratados; alteração de meta não reescreve resultado histórico; cálculos possuem testes unitários.  
**Estado:** Mock parcial.

### 5.15 Gestão de riscos — `RISK`

- `UC-RISK-01`: configurar escalas e matriz.
- `UC-RISK-02`: cadastrar risco/oportunidade por módulo.
- `UC-RISK-03`: calcular nível e priorizar tratamento.
- `UC-RISK-04`: registrar contingência e ocorrência.
- `UC-RISK-05`: criar plano e avaliar risco residual.
- `UC-RISK-06`: filtrar matriz principal por módulo de origem.

**Aceite:** cálculo único no backend; escalas versionadas; risco residual não sobrescreve avaliação inicial; origem e ação vinculadas.  
**Estado:** Mock parcial.

### 5.16 Projeto e desenvolvimento — `PD`

- `UC-PD-01`: criar projeto com escopo, cliente, produto, responsável, prazo e critério de liberação.
- `UC-PD-02`: executar planejamento, entradas, análise crítica, saídas, verificação, validação e liberação.
- `UC-PD-03`: registrar aprovador, evidência e decisão por etapa.
- `UC-PD-04`: tratar mudança de projeto pelo controle de mudanças.
- `UC-PD-05`: customizar e versionar o processo padrão no BPM.

**Aceite:** etapa dependente não avança sem pré-requisito; progresso deriva das etapas; liberação exige verificação/validação; instância preserva versão do fluxo.  
**Estado:** Mock parcial.

### 5.17 Cadastros gerais — `CAD`

- `UC-CAD-01`: manter produtos, pedidos, defeitos, setores/unidades, categorias de fornecedor e tipos de documento.
- `UC-CAD-02`: filtrar, editar e desativar sem apagar referências.
- `UC-CAD-03`: importar dados válidos com relatório de erros.

**Aceite:** códigos únicos por tenant; item usado não é excluído fisicamente; dependências são informadas; desativado não aparece em novas seleções, mas permanece no histórico.  
**Estado:** Mock parcial; importação é gap.

### 5.18 Blog e administração — `BLOG`

- `UC-BLOG-01`: criar rascunho com categoria, autor, mídia e SEO.
- `UC-BLOG-02`: revisar, agendar, publicar, editar e despublicar.
- `UC-BLOG-03`: moderar comentários e anúncios.
- `UC-BLOG-04`: consultar artigo público sem compartilhar dados/tabelas do SGQ.
- `UC-BLOG-05`: solicitar auxílio de IA respeitando franquia e política de dados.

**Aceite:** módulo/tabelas independentes; HTML sanitizado; rascunho não é público; mídia validada; falha no blog não compromete módulos SGQ.  
**Estado:** Mock visual/parcial; backend obrigatório.

### 5.19 Configurações gerais — `CFG`

- `UC-CFG-01`: ativar/desativar módulos e tratar dependências.
- `UC-CFG-02`: configurar permissões, aprovadores, notificações e arquivos.
- `UC-CFG-03`: consultar plano, consumo e contratos.
- `UC-CFG-04`: solicitar análises adicionais de IA com quantidade e finalidade.
- `UC-CFG-05`: aprovar acesso temporário do Admin Master.

**Aceite:** somente autorizado configura; módulo dependente gera aviso; desativação é lógica; solicitação de IA registra empresa, plano, quantidade, finalidade, solicitante, data e status.  
**Estado:** Mock parcial.

### 5.20 Administração global — `MASTER`

- `UC-MASTER-01`: consultar empresas, acessos e saúde geral sem abrir dados internos.
- `UC-MASTER-02`: cadastrar primeiro administrador da empresa.
- `UC-MASTER-03`: consultar erros com nível, correlação e tratamento.
- `UC-MASTER-04`: administrar suporte/help desk e estatísticas de uso.
- `UC-MASTER-05`: executar acesso temporário aprovado.

**Aceite:** 2FA obrigatório; painel global não retorna conteúdo interno por padrão; toda ação privilegiada é auditada; logs não contêm segredos.  
**Estado:** Mock parcial; monitoramento, help desk e erros reais são gaps.

## 6. Matriz de testes funcionais e de integração

| ID | Cenário | Resultado esperado |
|---|---|---|
| TF-PERM-01 | Usuário sem `visualizar` chama listagem diretamente | API retorna 403 e frontend não exibe ação. |
| TF-PERM-02 | Usuário com escopo próprio lista registros | Retorna somente registros próprios permitidos. |
| TF-PERM-03 | Aprovador configurado aprova registro próprio | Permitido e auditado. |
| TF-PERM-04 | Usuário não configurado tenta aprovar | Rejeitado mesmo alterando a requisição manualmente. |
| TF-PERM-05 | Delegação dentro da validade | Ação permitida e marcada como delegada. |
| TF-PERM-06 | Delegação expirada | Ação rejeitada automaticamente. |
| TF-PERM-07 | Desativação de usuário | Sessões revogadas; histórico preservado. |
| TF-PLAN-01 | Essencial acessa BPM | Permitido. |
| TF-PLAN-02 | Essencial tenta módulo exclusivo | Bloqueado com explicação do plano. |
| TF-PLAN-03 | Profissional consome 20 análises de IA | Consumos registrados; saldo chega a zero. |
| TF-PLAN-04 | Duas análises simultâneas usam último crédito | Apenas uma reserva o crédito; não há saldo negativo. |
| TF-PLAN-05 | Plano sem franquia solicita análise extra | Solicitação pendente criada. |
| TF-PLAN-06 | Trial completa 30 dias | Estado muda conforme política comercial definida. |
| TF-PLAN-07 | Downgrade com dados de módulo superior | Dados preservados e acesso controlado. |
| TF-PLAN-08 | Limite de usuário atingido | Novo usuário bloqueado; adicionais/upgrade oferecidos. |
| TF-BPM-01 | Publicar fluxo inválido | Publicação rejeitada com erros localizados. |
| TF-BPM-02 | Iniciar processo publicado | Instância recebe versão vigente. |
| TF-BPM-03 | Publicar versão enquanto há instância | Antiga continua na versão anterior; nova usa versão nova. |
| TF-BPM-04 | Rejeitar aprovação | Fluxo segue caminho configurado e registra motivo. |
| TF-BPM-05 | Tarefa vence SLA | Alerta/escalonamento configurado é executado uma vez. |
| TF-DOC-01 | Aprovar nova versão documental | Nova versão publicada; anterior preservada. |
| TF-DOC-02 | Solicitar edição sem ser dono | Solicitação criada; download indisponível até aprovação. |
| TF-DOC-03 | Usuário abre Minhas pendências | Exibe somente documentos atribuídos a ele em qualquer pasta. |
| TF-DOC-04 | Usuário aprova em fluxo com múltiplos aprovadores | Sua pendência é removida; documento só é publicado ao atingir a regra da categoria. |
| TF-DOC-05 | Usuário tenta aprovar documento não atribuído | Backend rejeita, mesmo com chamada direta à API. |
| TF-NC-01 | Auditoria gera NC e plano | Origem e links bidirecionais preservados. |
| TF-RISK-01 | Alterar escala de risco | Avaliações antigas mantêm versão da escala. |
| TF-SAT-01 | Responder pesquisa válida | Resposta e snapshot persistidos; NPS recalculado. |
| TF-SAT-02 | Responder pesquisa expirada | Resposta rejeitada sem revelar dados internos. |
| TF-FORN-01 | Publicar pesos somando 90% | Rejeitado; total deve ser 100%. |
| TF-KPI-01 | Resultado abaixo de meta “maior é melhor” | Marcado fora da meta. |
| TF-KPI-02 | Alterar meta futura | Histórico mantém a meta usada no período anterior. |
| TI-01 | Reclamação gera NC | IDs, tenant, origem e auditoria consistentes. |
| TI-02 | SWOT gera risco | Risco aparece na matriz principal filtrável por Organização. |
| TI-03 | Inspeção reprova produto | Produto bloqueado e NC opcional vinculada. |
| TI-04 | Treinamento comunica política | Evidência aparece na competência e no requisito ISO. |
| TI-05 | Lacuna ISO gera ação | Ação fica no módulo central e vinculada ao diagnóstico. |

## 7. Matriz obrigatória de segurança

### 7.1 Autenticação e sessão

| ID | Teste |
|---|---|
| TS-AUTH-01 | Senhas com hash forte, política definida e nenhuma senha em log/resposta. |
| TS-AUTH-02 | Rate limit e bloqueio progressivo contra força bruta. |
| TS-AUTH-03 | Recuperação de senha com token único, curto e invalidado após uso. |
| TS-AUTH-04 | Cookies `Secure`, `HttpOnly`, `SameSite`; proteção CSRF quando aplicável. |
| TS-AUTH-05 | Rotação de sessão no login, elevação de privilégio e troca de senha. |
| TS-AUTH-06 | Logout, desativação e expiração revogam sessões. |

### 7.2 Autorização e multi-tenant

| ID | Teste |
|---|---|
| TS-TENANT-01 | Usuário da empresa A não lista, lê, altera ou baixa recurso da empresa B. |
| TS-TENANT-02 | Trocar `tenant_id`, ID sequencial, UUID ou caminho de arquivo não burla isolamento. |
| TS-TENANT-03 | Jobs, exportações, busca, dashboard e notificações também filtram tenant. |
| TS-AUTHZ-01 | Cada endpoint valida módulo, ação e escopo, independentemente do frontend. |
| TS-AUTHZ-02 | Mass assignment não permite alterar tenant, autor, status ou aprovação. |
| TS-AUTHZ-03 | Usuário comum não altera a própria permissão/perfil. |
| TS-AUTHZ-04 | Admin da Qualidade não administra usuários, cobrança ou contrato. |
| TS-AUTHZ-05 | Registro desativado não pode ser alterado sem operação formal de reativação. |
| TS-AUTHZ-06 | Exportações respeitam exatamente os mesmos filtros de autorização. |

### 7.3 Admin Master

| ID | Teste |
|---|---|
| TS-MASTER-01 | Login sem segundo fator é rejeitado. |
| TS-MASTER-02 | Código 2FA é curto, de uso único, expira e tem rate limit. |
| TS-MASTER-03 | Solicitação pendente não libera dados. |
| TS-MASTER-04 | Qualquer Admin da Empresa correta pode aprovar; usuário comum não pode. |
| TS-MASTER-05 | Aprovação da empresa A não libera empresa B. |
| TS-MASTER-06 | Sessão expira após uma hora calculada pelo servidor. |
| TS-MASTER-07 | Revogação encerra acesso imediatamente. |
| TS-MASTER-08 | Todas as ações são vinculadas à solicitação e ao Admin Master. |

### 7.4 Entrada, arquivos, API e frontend

| ID | Teste |
|---|---|
| TS-INPUT-01 | XSS armazenado/refletido em nomes, comentários, blog, formulários e BPM. |
| TS-INPUT-02 | SQL injection e filtros malformados em todos os parâmetros. |
| TS-INPUT-03 | SSRF em URLs, integrações, importações e mídia remota. |
| TS-INPUT-04 | Campos extras e tipos incorretos são rejeitados pela API. |
| TS-FILE-01 | Extensão dupla, MIME falso e arquivo executável são rejeitados. |
| TS-FILE-02 | Nome de arquivo não permite path traversal. |
| TS-FILE-03 | Download usa autorização e identificador opaco/URL temporária. |
| TS-FILE-04 | Antivírus/quarentena antes de disponibilizar arquivo. |
| TS-FILE-05 | Limites 5 MB, 100 MB e máximo 1 GB validados no servidor. |
| TS-FILE-06 | Upload interrompido não deixa registro inconsistente. |
| TS-FILE-07 | Arquivo de tenant A nunca é acessível por tenant B. |
| TS-FILE-08 | Conteúdo ativo servido com headers seguros e fora da raiz pública. |

### 7.5 Auditoria, privacidade e infraestrutura

| ID | Teste |
|---|---|
| TS-LOG-01 | Logs não armazenam senha, token, 2FA ou segredo. |
| TS-LOG-02 | Trilha crítica não pode ser editada pela interface/API comum. |
| TS-LOG-03 | Eventos têm usuário, tenant, ação, alvo, data e correlação. |
| TS-LOG-04 | Alertas existem para falhas repetidas e ações privilegiadas. |
| TS-LOG-05 | Horários são armazenados em UTC e exibidos no fuso aplicável. |
| TS-PRIV-01 | Dados de teste são sintéticos ou anonimizados. |
| TS-PRIV-02 | Exportação LGPD exige identidade e autorização. |
| TS-PRIV-03 | Dados enviados à IA são minimizados e registrados. |
| TS-PRIV-04 | Empresa pode bloquear envio de dados/documentos à IA. |
| TS-INFRA-01 | TLS obrigatório e secrets fora do código/repositório. |
| TS-INFRA-02 | Backup criptografado, restauração testada e tenant consistente. |
| TS-INFRA-03 | Dependências e imagens passam por análise de vulnerabilidades. |
| TS-INFRA-04 | Erros de produção não retornam stack trace ou credenciais. |

## 8. Usabilidade e acessibilidade

### 8.1 Tarefas críticas de teste moderado

Cada perfil deverá executar sem orientação externa:

1. criar setor, usuário e permissão;
2. cadastrar e aprovar documento;
3. modelar, publicar e iniciar fluxo simples;
4. registrar NC e plano 5W2H;
5. criar pesquisa e localizar resultado;
6. executar auditoria e transformar achado em ação;
7. localizar registro pela busca global;
8. consultar evidência e histórico;
9. aprovar ou negar acesso do Admin Master;
10. compreender limite do plano e solicitar análises adicionais de IA.

### 8.2 Critérios mensuráveis

| ID | Critério |
|---|---|
| TU-01 | Pelo menos 90% dos participantes concluem cada tarefa crítica. |
| TU-02 | Nenhuma tarefa crítica depende de conhecimento técnico ou edição manual de URL. |
| TU-03 | Erro informa o problema, preserva dados e mostra como corrigir. |
| TU-04 | Estado vazio oferece ação principal adequada. |
| TU-05 | Fluxo BPM diferencia claramente rascunho, publicado, versão e instância. |
| TU-06 | Usuário compreende que mudanças de fluxo não alteram instâncias em andamento. |
| TU-07 | Onboarding pode ser pausado, retomado e reaberto pelo botão inferior de ajuda, sem abrir pop-ups automaticamente. |
| TU-08 | Operações destrutivas usam desativação, motivo e confirmação contextual. |
| TU-09 | Interface funciona em desktop, tablet e resolução mínima definida. |
| TU-10 | Navegação por teclado, foco visível, labels e mensagens acessíveis. |
| TU-11 | Contraste atende WCAG 2.2 AA para texto e controles essenciais. |
| TU-12 | Tabelas têm cabeçalhos, filtros compreensíveis e alternativa em telas estreitas. |

### 8.3 Teste específico do modelador BPM

Participantes sem experiência em BPM devem conseguir criar um fluxo de solicitação com início, formulário, aprovação e fim. Validar:

- descoberta dos componentes;
- conexão entre etapas;
- configuração de aprovador;
- entendimento dos erros de validação;
- publicação e início de instância;
- entendimento do versionamento;
- tempo, erros, dúvidas e pontos de abandono.

## 9. Estratégia de automação

### 9.1 Pirâmide de testes

- **Unitários:** regras de score, NPS, KPI, risco, permissões, planos, versionamento, prazos e transições.
- **Serviços/repositórios:** regras de negócio com PostgreSQL de teste e tenant explícito.
- **API:** autenticação, autorização, validação, concorrência, paginação, filtros e contratos OpenAPI.
- **Integração:** e-mail, arquivos, IA, jobs, 2FA e vínculos entre módulos.
- **E2E:** somente jornadas críticas, usando navegador e dados isolados.
- **Segurança:** SAST, análise de dependências, DAST em homologação e testes manuais de autorização.

### 9.2 Dados mínimos de teste

- empresas A e B;
- Admin Master com 2FA;
- um Administrador da Empresa por tenant;
- Administrador da Qualidade;
- usuário com escopo próprio;
- usuário com escopo total em um módulo;
- aprovador e delegado temporário;
- planos Essencial, Profissional, Gestão Integrada e Enterprise;
- registros ativos, desativados, vencidos, aprovados e pendentes;
- arquivos válidos, inválidos, grandes e de tenant diferente;
- processos em duas versões com instâncias simultâneas.

### 9.3 Evidência exigida

Cada execução de homologação deve registrar:

- versão/commit testado;
- ambiente e navegador;
- caso de teste e resultado;
- evidência de tela ou resposta da API quando aplicável;
- defeito vinculado;
- responsável e data;
- reteste e regressão.

## 10. Cobertura atual do protótipo

| Área | Situação atual | Falta principal |
|---|---|---|
| Landing e planos | Parcialmente operacional | Política de adicionais e conversão real. |
| Cadastro/login | Simulação | Autenticação, e-mail, contrato, pagamento e sessão segura. |
| Onboarding/setup | Parcial | Persistência real, critérios completos e telemetria. |
| Usuários/permissões | Parcial | Autorização no servidor, convites e delegação completa. |
| Admin Master | Parcial | 2FA real, sessão server-side e auditoria imutável. |
| Documentos | Parcial | Armazenamento seguro, assinatura, cópias e workflow completo. |
| BPM | Parcial | Motor transacional, validações, SLA, concorrência e execução robusta. |
| Módulos SGQ | Parcial | APIs, banco, integrações, paginação e testes automatizados. |
| Pesquisa de satisfação | Parcial | Token server-side, expiração, envio e proteção antispam. |
| Avaliação pública de fornecedor | Gap | Página externa, token, modelo versionado e resposta. |
| IA | Simulada/configuração | Provedor, consentimento, saldo, reserva, custo e privacidade. |
| LGPD | Requisito documentado | Inventário, fluxo operacional, retenção e validação jurídica. |
| Segurança | Não validável no mock | Todo o conjunto da seção 7 no backend. |
| Usabilidade | Ajuda parcial | Sessões com usuários, métricas e correções comprovadas. |

## 11. Gaps que precisam de decisão

### Bloqueiam regras comerciais ou técnicas

1. Política ao terminar o trial: bloqueio, leitura, carência, exportação e retenção dos dados.
2. Preço, quantidade mínima, validade e aprovação de análises adicionais de IA.
3. Preço e limites de usuários adicionais nos planos diretos.
4. Provedor de IA, modelos permitidos, dados enviados e aceite por empresa.
5. Política definitiva de arquivos após a validação em VPS.
6. Requisitos formais e jurídicos da assinatura eletrônica por 2FA.
7. Bases legais, retenção e descarte por categoria de dado.

### Não bloqueiam o início do backend, mas devem entrar no roadmap

1. Matriz RACI e organograma nativo.
2. Integração ERP e contrato da API pública.
3. SSO e provedor de identidade para Enterprise.
4. Help desk, observabilidade e analytics completos do Admin Master.
5. Integração/monitoramento por VPN, que exige caso de uso e justificativa específicos.
6. Importadores Excel por módulo e política de tratamento de erros.

## 12. Portões de qualidade para lançamento

### MVP interno

- testes unitários das regras críticas;
- migrations e isolamento multi-tenant revisados;
- nenhuma falha crítica/alta conhecida de autorização;
- jornadas principais executáveis sem manipulação manual de banco;
- backup e restauração testados.

### Beta com clientes

- todos os `TS-TENANT`, `TS-AUTHZ` e `TS-MASTER` aprovados;
- documentos, BPM, NC/planos e diagnóstico com testes E2E;
- upload seguro e política de privacidade aplicados;
- onboarding validado com usuários externos;
- monitoramento, erros e suporte operacionais.

### Produção comercial

- contratos, cobrança, assinatura e trial homologados;
- LGPD e retenção validadas juridicamente;
- teste de restauração e resposta a incidente;
- teste de invasão focado em autenticação, autorização, tenant, arquivos e Admin Master;
- critérios de acessibilidade e usabilidade aprovados;
- regressão completa e aceite formal do produto.

## 13. Rastreabilidade para desenvolvimento

### 13.1 Módulos e requisitos ISO 9001

| Módulo/fluxo | Requisitos principais | Evidência esperada |
|---|---|---|
| Setup e diagnóstico | 4.3 a 10.3 conforme questionário | Diagnóstico versionado, respostas, vínculos e planos. |
| Organização | 4.1, 4.2, 4.3, 5.1, 5.2, 6.3, 7.1, 9.1.3, 9.3 | SWOT, partes, escopo, recursos, mudanças e atas. |
| Documentos | 7.5 | Documento, versão, aprovação, revisão e cópia controlada. |
| BPM | 4.4 e requisitos do processo modelado | Modelo, versão, instância, tarefa, decisão e histórico. |
| Produção | 8.5 | OP, etapas, apontamentos, parâmetros e evidências. |
| Inspeções | 8.6 e 8.7 | Resultado, decisão de liberação, bloqueio e NC. |
| NC/CAPA/planos | 10.2 e 10.3 | NC, causa, correção, ação, eficácia e melhoria. |
| Calibração | 7.1.5 | Instrumento, certificado, resultado e validade. |
| Fornecedores | 8.4 | Critérios, avaliação, classificação e reavaliação. |
| Pessoas | 7.2 e 7.3 | Competência, treinamento, eficácia e conscientização. |
| Satisfação/reclamações | 8.2.1 e 9.1.2 | Pesquisa, NPS, reclamação, análise e ação. |
| Auditorias | 9.2 | Programa, plano, checklist, achado, relatório e ação. |
| Indicadores | 6.2 e 9.1 | Definição, meta, resultado, análise e ação. |
| Riscos | 6.1 | Avaliação inicial/residual, tratamento e ocorrência. |
| Projeto e desenvolvimento | 8.3 | Entradas, análises, saídas, verificação, validação e mudanças. |

### 13.2 Migração inicial do `localStorage`

Cada chave deverá ser substituída por entidade ou serviço com `tenant_id`, auditoria e autorização. A chave não define a modelagem final, mas indica dados que precisam ser migrados ou descartados conscientemente.

| Domínio | Chaves atuais principais | Destino esperado |
|---|---|---|
| Sessão e usuários | `sgq_user_session`, `sgq_master_session`, `sgq_system_users` | autenticação, sessões, usuários e credenciais. |
| Permissões | `sgq_permissions`, `sgq_permission_delegations` | perfis, regras por ação/escopo e delegações. |
| Empresa e sistema | `sgq_company_setup`, `sgq_system_settings`, `sgq_onboarding_state` | empresas, configurações, plano, trial e onboarding. |
| Auditoria e notificações | `sgq_audit_history`, `sgq_notifications` | eventos de auditoria e notificações. |
| Admin Master | `sgq_master_admin`, `sgq_master_tenant_session` | solicitações, aprovações e sessões privilegiadas. |
| Documentos | `sgq_docFolders`, `sgq_docCategories`, `sgq_docfile_*`, `sgq_docatt_*` | pastas, categorias, documentos, versões e arquivos. |
| BPM | `sgq_flows`, `sgq_flowVersions`, `sgq_forms`, `sgq_flowInstances` | modelos, versões, formulários, instâncias e tarefas. |
| Organização/diagnóstico | `sgq_organizacao_iso`, `sgq_sgq_questions`, `sgq_sgq_answers`, `sgq_sgq_current_diagnostic`, `sgq_sgq_analysis_history` | organização, diagnóstico, versões e análises. |
| Operação SGQ | `sgq_nc`, `sgq_riscos`, `sgq_auditorias`, `sgq_indicadores` | entidades dos respectivos módulos e vínculos com ações. |
| Pessoas e provedores | `sgq_pessoas`, `sgq_fornecedores`, `sgq_supplier_criteria` | colaboradores, competências, fornecedores e avaliações. |
| Cliente | `sgq_satisfacao`, `sgq_satisfaction_surveys`, `sgq_satisfaction_template` | clientes, pesquisas, modelos, respostas e reclamações. |
| Industrial | `sgq_producao`, `sgq_inspecoes`, `sgq_calibracao`, `sgq_cadastros` | pedidos, OPs, inspeções, instrumentos e cadastros base. |
| Projeto | `sgq_projeto_desenvolvimento` | projetos, etapas, decisões, evidências e mudanças. |
| IA/comercial | `sgq_ai_analysis_requests`, `sgq_commercial_leads` | franquias, consumo, solicitações adicionais e leads. |
| Evidências | `sgq_evidences` | anexos/evidências com armazenamento externo e vínculo polimórfico controlado. |

## 14. Manutenção deste guia

Todo novo requisito deve atualizar, no mesmo trabalho:

1. caso de uso e regra afetada;
2. critério de aceite;
3. testes funcionais e de segurança;
4. entidade/API ou chave legada correspondente;
5. ajuda contextual/onboarding quando houver impacto de uso;
6. matriz ISO quando houver impacto normativo.

Nenhum módulo deve ser marcado como concluído apenas porque possui tela. O aceite exige processo executável, autorização no backend, rastreabilidade e testes aprovados.
