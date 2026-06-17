(function () {
    const phrases = [
        'Iniciar processo',
        'Buscar documento',
        'Buscar processo em execução',
        'Comece digitando um código ou nome',
        'Abrir plano de ação',
        'Localizar requisito ISO',
        'Encontrar auditoria ou NC'
    ];

    const modules = [
        ['Controle de Documentos', 'GED, revisões, aprovações e registros', 'Módulo', 'fa-file-lines', 'var(--primary)', 'documentos.html', 'documento documentos ged revisão aprovacao registro pq it fq'],
        ['BPM & Modelagem de Processos', 'Fluxos, formulários e processos em execução', 'Módulo', 'fa-diagram-project', 'var(--accent)', 'bpm.html', 'processo processos bpm workflow fluxo formulario iniciar'],
        ['Projeto e Desenvolvimento', 'ISO 9001 requisito 8.3', 'Módulo', 'fa-pen-ruler', 'var(--purple)', 'projeto-desenvolvimento.html', 'projeto desenvolvimento 8.3 validacao verificacao'],
        ['NCs + Planos de Ação', 'Não conformidades, planos 5W2H e eficácia', 'Módulo', 'fa-list-check', 'var(--warning)', 'nao-conformidades.html', 'nc nao conformidade plano ação acao 5w2h eficacia'],
        ['Planos de Ação', 'Abrir guia filtrada de planos', 'Ação', 'fa-list-check', 'var(--warning)', 'nao-conformidades.html?tipo=plano', 'plano planos ação acao tarefas responsáveis prazos'],
        ['Melhoria Contínua', 'Abrir guia de melhorias', 'Ação', 'fa-lightbulb', 'var(--accent)', 'nao-conformidades.html?tipo=melhoria', 'melhoria continua melhoria contínua oportunidade'],
        ['Gestão de Riscos', 'Matriz de riscos e oportunidades', 'Módulo', 'fa-shield-halved', 'var(--danger)', 'riscos.html', 'risco riscos oportunidades matriz 6.1'],
        ['Organização', 'Contexto, SWOT, partes interessadas e diagnóstico ISO', 'Módulo', 'fa-building-shield', 'var(--primary)', 'organizacao.html', 'organizacao organização swot contexto partes interessadas escopo'],
        ['Diagnóstico ISO', 'Cobertura automática e IA simulada', 'Ação', 'fa-brain', 'var(--primary)', 'organizacao.html?view=diagnostico', 'diagnostico diagnóstico iso ia cobertura requisitos'],
        ['Auditorias Internas', 'Planejamento e resultados de auditoria', 'Módulo', 'fa-magnifying-glass-chart', 'var(--danger)', 'auditorias.html', 'auditoria auditorias checklist 9.2'],
        ['Indicadores / KPIs', 'Metas, resultados e análise de dados', 'Módulo', 'fa-chart-line', 'var(--accent)', 'indicadores.html', 'indicador indicadores kpi meta metas dados'],
        ['Satisfação do Cliente', 'NPS, reclamações e feedback', 'Módulo', 'fa-face-smile', 'var(--orange)', 'satisfacao.html', 'satisfacao satisfação cliente reclamacao reclamação nps'],
        ['Fornecedores', 'Avaliação e qualificação de provedores externos', 'Módulo', 'fa-handshake', 'var(--purple)', 'fornecedores.html', 'fornecedor fornecedores compra provedor 8.4'],
        ['Calibração de Instrumentos', 'Instrumentos, certificados e vencimentos', 'Módulo', 'fa-ruler-combined', 'var(--primary)', 'calibracao.html', 'calibracao calibração instrumento medicao medição certificado'],
        ['Pessoas e Treinamentos', 'Competência, treinamento e conscientização', 'Módulo', 'fa-user-graduate', 'var(--accent)', 'pessoas.html', 'pessoas treinamento competência competencia colaboradores'],
        ['Inspeções e Liberação', 'Checklists, liberação e produto bloqueado', 'Módulo', 'fa-clipboard-check', 'var(--accent)', 'inspecoes.html', 'inspecao inspeção liberação liberacao checklist produto bloqueado'],
        ['Processo Produtivo', 'Ordens de produção e apontamentos', 'Módulo', 'fa-industry', 'var(--primary)', 'producao.html', 'produção producao ordem op apontamento'],
        ['Setup SGQ', 'Diagnóstico inicial e evidências ISO', 'Módulo', 'fa-gears', 'var(--primary)', 'setup-sgq.html', 'setup diagnostico diagnóstico evidencias evidências iso']
    ].map(toItem);

    const docs = [
        ['PQ-001 - Controle de Documentos e Registros', 'Procedimento controlado', 'Documento', 'fa-file-lines', 'var(--primary)', 'documentos.html', 'pq-001 controle documentos registros procedimento'],
        ['PQ-002 - Auditorias Internas', 'Procedimento de auditoria', 'Documento', 'fa-file-lines', 'var(--primary)', 'documentos.html', 'pq-002 auditorias internas procedimento'],
        ['PQ-003 - Controle de Produto Não Conforme', 'Procedimento de NC e saídas não conformes', 'Documento', 'fa-file-lines', 'var(--primary)', 'documentos.html', 'pq-003 produto nao não conforme nc'],
        ['FQ-001 - Registro de Não Conformidade', 'Formulário de RNC', 'Documento', 'fa-file-signature', 'var(--warning)', 'documentos.html', 'fq-001 registro nao não conformidade rnc formulario formulário'],
        ['FQ-002 - Checklist de Auditoria', 'Formulário de auditoria interna', 'Documento', 'fa-file-signature', 'var(--warning)', 'documentos.html', 'fq-002 checklist auditoria formulario formulário'],
        ['MQ-001 - Manual da Qualidade', 'Manual e política da qualidade', 'Documento', 'fa-book', 'var(--purple)', 'documentos.html', 'mq-001 manual qualidade politica política escopo']
    ].map(toItem);

    function toItem(row) {
        return { title: row[0], meta: row[1], type: row[2], icon: row[3], color: row[4], url: row[5], keywords: row[6] };
    }

    function readFlows() {
        try {
            const raw = localStorage.getItem('sgq_flows');
            const flows = raw ? JSON.parse(raw) : [];
            return Array.isArray(flows) ? flows.filter(f => f.status === 'active') : [];
        } catch (e) {
            return [];
        }
    }

    function buildItems() {
        const flows = readFlows();
        const running = flows.map(f => ({
            title: f.name || 'Processo sem nome',
            meta: `${f.steps ? f.steps.length : 0} etapas configuradas`,
            type: 'Processo em execução',
            icon: 'fa-diagram-project',
            color: 'var(--primary)',
            url: 'bpm.html',
            keywords: `${f.name || ''} execução execucao andamento bpm processo`
        }));
        const starters = flows.map(f => ({
            title: `Iniciar processo: ${f.name || 'Processo sem nome'}`,
            meta: `BPM - ${f.steps ? f.steps.length : 0} etapas`,
            type: 'Iniciar processo',
            icon: 'fa-play',
            color: 'var(--accent)',
            url: `bpm.html?startFlow=${encodeURIComponent(f.id)}`,
            keywords: `${f.name || ''} iniciar processo fluxo bpm`
        }));
        return modules.concat(docs, running, starters);
    }

    function normalize(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function scoreItem(item, query) {
        if (!query) return 1;
        const hay = normalize([item.title, item.meta, item.type, item.keywords].join(' '));
        const title = normalize(item.title);
        return query.split(/\s+/).filter(Boolean).reduce((score, term) => {
            if (title.startsWith(term)) return score + 8;
            if (title.includes(term)) return score + 5;
            if (hay.includes(term)) return score + 2;
            return score;
        }, 0);
    }

    function getResults(query) {
        const q = normalize(query.trim());
        const items = buildItems();
        if (!q) {
            return items.filter(i => ['Iniciar processo', 'Documento', 'Processo em execução', 'Ação'].includes(i.type)).slice(0, 8);
        }
        return items
            .map(item => Object.assign({}, item, { score: scoreItem(item, q) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
            .slice(0, 10);
    }

    function createResult(item) {
        const row = document.createElement('div');
        row.className = 'global-result';
        row.addEventListener('click', () => { window.location.href = item.url; });

        const icon = document.createElement('div');
        icon.className = 'global-result-icon';
        icon.style.color = item.color;
        icon.style.background = 'rgba(255,255,255,.06)';
        icon.innerHTML = `<i class="fas ${item.icon}"></i>`;

        const text = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'global-result-title';
        title.textContent = item.title;
        const meta = document.createElement('div');
        meta.className = 'global-result-meta';
        meta.textContent = item.meta;
        text.append(title, meta);

        const type = document.createElement('span');
        type.className = 'global-result-type';
        type.textContent = item.type;

        row.append(icon, text, type);
        return row;
    }

    function render(box, input, results) {
        const found = getResults(input.value);
        results.innerHTML = '';
        box.classList.add('open');
        if (!found.length) {
            const empty = document.createElement('div');
            empty.className = 'global-search-empty';
            empty.textContent = 'Nenhum resultado encontrado. Tente um código, nome de documento, processo ou módulo.';
            results.appendChild(empty);
            return;
        }
        const groups = [];
        found.forEach(item => {
            let group = groups.find(g => g.type === item.type);
            if (!group) {
                group = { type: item.type, items: [] };
                groups.push(group);
            }
            group.items.push(item);
        });
        groups.forEach(group => {
            const section = document.createElement('div');
            section.className = 'global-search-section';
            section.textContent = group.type;
            results.appendChild(section);
            group.items.forEach(item => results.appendChild(createResult(item)));
        });
        const first = results.querySelector('.global-result');
        if (first) first.classList.add('active');
    }

    function animate(input) {
        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;
        function tick() {
            if (document.activeElement === input || input.value) {
                setTimeout(tick, 400);
                return;
            }
            const phrase = phrases[phraseIdx];
            if (!deleting) {
                charIdx += 1;
                input.placeholder = phrase.slice(0, charIdx);
                if (charIdx >= phrase.length) {
                    deleting = true;
                    setTimeout(tick, 1300);
                    return;
                }
            } else {
                charIdx -= 1;
                input.placeholder = phrase.slice(0, charIdx);
                if (charIdx <= 0) {
                    deleting = false;
                    phraseIdx = (phraseIdx + 1) % phrases.length;
                }
            }
            setTimeout(tick, deleting ? 28 : 58);
        }
        tick();
    }

    function enhance(box) {
        if (!box || box.dataset.globalSearchEnhanced === '1') return;
        const input = box.querySelector('input');
        if (!input) return;
        box.dataset.globalSearchEnhanced = '1';
        box.classList.add('global-search');
        input.autocomplete = 'off';

        let button = box.querySelector('.global-search-btn');
        if (!button) {
            button = document.createElement('button');
            button.className = 'global-search-btn';
            button.type = 'button';
            button.title = 'Buscar';
            button.innerHTML = '<i class="fas fa-arrow-right"></i>';
            box.appendChild(button);
        }

        let results = box.querySelector('.global-search-results');
        if (!results) {
            results = document.createElement('div');
            results.className = 'global-search-results';
            box.appendChild(results);
        }

        input.addEventListener('focus', () => render(box, input, results));
        input.addEventListener('input', () => render(box, input, results));
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const first = getResults(input.value)[0];
                if (first) window.location.href = first.url;
            }
            if (e.key === 'Escape') box.classList.remove('open');
        });
        button.addEventListener('click', () => {
            const first = getResults(input.value)[0];
            if (first) window.location.href = first.url;
        });
        document.addEventListener('click', e => {
            if (!box.contains(e.target)) box.classList.remove('open');
        });
        animate(input);
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.topbar-search').forEach(enhance);
    });
})();
