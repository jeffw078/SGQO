(function () {
    'use strict';

    const HISTORY_KEY = 'sgq_audit_history';
    const DRAFT_KEY = 'sgq_linked_action_draft';
    const SETTINGS_KEY = 'sgq_system_settings';
    const USERS_KEY = 'sgq_system_users';
    const SESSION_KEY = 'sgq_user_session';
    const NOTIFICATIONS_KEY = 'sgq_notifications';
    const EVIDENCES_KEY = 'sgq_evidences';
    const DEVELOPMENT_SUPER_EMAIL = 'jefferson@databooster.com.br';
    const PLAN_CATALOG = Object.freeze({
        essencial: Object.freeze({id:'essencial',name:'Essencial',purchase:'direct',monthlyPrice:349,priceLabel:'R$ 349/mês',trial:true,users:5,storageGB:20,units:1,aiAnalysesPerMonth:0,aiExtraRequests:true,summary:'Para empresas que querem sair do Excel e estruturar o SGQ.'}),
        profissional: Object.freeze({id:'profissional',name:'Profissional',purchase:'direct',monthlyPrice:749,priceLabel:'R$ 749/mês',trial:true,users:15,storageGB:100,units:3,aiAnalysesPerMonth:20,aiExtraRequests:true,featured:true,summary:'Para empresas com ISO 9001 ou em implantação que precisam controlar a rotina completa da qualidade.'}),
        gestao_integrada: Object.freeze({id:'gestao_integrada',name:'Gestão Integrada',purchase:'consultant',monthlyPrice:1690,priceLabel:'a partir de R$ 1.690/mês',trial:false,users:40,storageGB:300,units:5,aiAnalysesPerMonth:40,aiExtraRequests:true,summary:'Para empresas com múltiplos processos, áreas e necessidade de implantação assistida.'}),
        industrial_enterprise: Object.freeze({id:'industrial_enterprise',name:'Industrial / Enterprise',purchase:'consultant',monthlyPrice:3490,priceLabel:'a partir de R$ 3.490/mês',trial:false,users:null,storageGB:null,units:null,aiAnalysesPerMonth:60,aiExtraRequests:true,summary:'Para indústrias que precisam conectar SGQ, produção, rastreabilidade, inspeções e integrações.'})
    });
    const MODULE_FILES = {
        documentos:'documentos.html', bpm:'bpm.html', producao:'producao.html', inspecoes:'inspecoes.html',
        nc:'nao-conformidades.html', calibracao:'calibracao.html', organizacao:'organizacao.html',
        fornecedores:'fornecedores.html', pessoas:'pessoas.html', satisfacao:'satisfacao.html', auditorias:'auditorias.html',
        indicadores:'indicadores.html', projetos:'projeto-desenvolvimento.html', riscos:'riscos.html', cadastros:'cadastros.html'
    };
    const PLAN_MODULES = {
        essencial:['documentos','bpm','nc','riscos','auditorias','indicadores','fornecedores','organizacao','cadastros'],
        profissional:['documentos','nc','riscos','auditorias','indicadores','fornecedores','organizacao','cadastros','calibracao','pessoas','satisfacao','bpm','projetos'],
        gestao_integrada:Object.keys(MODULE_FILES).filter(id => !['producao','inspecoes'].includes(id)),
        industrial_enterprise:Object.keys(MODULE_FILES)
    };
    const ACTION_WORDS = {
        create:/\b(nov[oa]|criar|cadastrar|adicionar|iniciar|lançar|registrar|importar)\b/i,
        edit:/\b(editar|alterar|salvar|configurar|ajustar)\b/i,
        deactivate:/\b(excluir|desativar|remover|cancelar)\b/i,
        approve:/\b(aprovar|liberar|publicar|concluir|finalizar)\b/i,
        export:/\b(exportar|relatório|download|imprimir)\b/i
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn('[SGQ] Dado local inválido:', key, error);
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('sgq:data-changed', { detail: { key } }));
        return value;
    }

    function getSettings() {
        return read(SETTINGS_KEY, { trial:{days:30,plans:['Essencial','Profissional']}, files:{attachmentMB:5,largeAttachmentMB:100,largeAttachmentMaxMB:1024}, modules:{} });
    }

    function ensureDevelopmentSuperUser(users) {
        const list = Array.isArray(users) ? users : [];
        let user = list.find(item => String(item.email || '').toLowerCase() === DEVELOPMENT_SUPER_EMAIL);
        if (!user) user = list.find(item => String(item.name || '').toLowerCase().includes('jefferson') && String(item.email || '').toLowerCase() === 'admin@empresa.com.br');
        const profile = {name:'Jefferson Willian',email:DEVELOPMENT_SUPER_EMAIL,role:'super_admin',roleLabel:'Superusuário de Desenvolvimento',sectorId:'',sectorName:'Desenvolvimento',status:'ativo',developmentOnly:true,deletedAt:null};
        if (user) Object.assign(user, profile, {updatedAt:new Date().toISOString()});
        else list.unshift(Object.assign({id:nextId(list),createdAt:new Date().toISOString()}, profile));
        if (!list.some(item => item.role === 'admin_company' && item.status !== 'inativo')) list.push({id:nextId(list),name:'Administrador Demo',email:'admin@empresa.com.br',role:'admin_company',roleLabel:'Administrador da Empresa',sectorId:'',sectorName:'Direção',status:'ativo',createdAt:new Date().toISOString()});
        return list;
    }

    function seedUsers() {
        let users = read(USERS_KEY, null);
        if (!Array.isArray(users) || !users.length) users = [
            {id:1,name:'Administrador Demo',email:'admin@empresa.com.br',role:'admin_company',roleLabel:'Administrador da Empresa',sectorId:'',sectorName:'Direção',status:'ativo',createdAt:new Date().toISOString()},
            {id:2,name:'Ana Carvalho',email:'qualidade@empresa.com.br',role:'admin_quality',roleLabel:'Administrador da Qualidade',sectorId:'1',sectorName:'Qualidade',status:'ativo',createdAt:new Date().toISOString()},
            {id:3,name:'Carlos Ferreira',email:'producao@empresa.com.br',role:'user',roleLabel:'Usuário',sectorId:'2',sectorName:'Produção',status:'ativo',createdAt:new Date().toISOString()}
        ];
        users = ensureDevelopmentSuperUser(users);
        write(USERS_KEY, users);
        return users;
    }

    function getUsers(includeInactive) {
        const users = seedUsers();
        return includeInactive ? users : users.filter(user => user.status !== 'inativo' && !user.deletedAt);
    }

    function currentUser() {
        const users = getUsers(true);
        const session = read(SESSION_KEY, null);
        return users.find(user => String(user.id) === String(session?.userId) && user.status !== 'inativo') || users.find(user => user.role === 'admin_company') || users[0];
    }

    function setCurrentUser(userId) {
        const user = getUsers().find(item => String(item.id) === String(userId));
        if (!user) return false;
        write(SESSION_KEY, {userId:user.id,tenantId:'empresa_demo',startedAt:new Date().toISOString()});
        return true;
    }

    function permission(moduleId, action) {
        const user = currentUser();
        if (!user) return false;
        if (user.role === 'super_admin' && user.developmentOnly) return true;
        if (user.role === 'admin_company') return true;
        if (user.role === 'admin_quality' && !['users','billing','contracts'].includes(moduleId)) return true;
        const permissions = read('sgq_permissions', {});
        const direct = permissions[`user:${user.id}`]?.rules?.[moduleId];
        const sector = permissions[`sector:${user.sectorId}`]?.rules?.[moduleId];
        const rule = direct || sector;
        if (!rule) return action === 'view';
        return rule[action] === true;
    }

    function permissionScope(moduleId) {
        const user = currentUser();
        if (!user || ['super_admin','admin_company','admin_quality'].includes(user.role)) return 'all';
        const permissions = read('sgq_permissions', {});
        return permissions[`user:${user.id}`]?.rules?.[moduleId]?.scope || permissions[`sector:${user.sectorId}`]?.rules?.[moduleId]?.scope || 'own';
    }

    function filterRecords(items, moduleId) {
        if (permissionScope(moduleId) === 'all') return items || [];
        const user=currentUser();if(!user)return [];
        return (items||[]).filter(item => String(item.createdById||item.userId||'')===String(user.id) || [item.nome,item.responsavel,item.auditor,item.inspetor,item.usuario,item.createdBy,item.autor].some(value=>String(value||'').toLowerCase()===user.name.toLowerCase()));
    }

    function currentPlan() {
        const settings = getSettings();
        const setup = read('sgq_company_setup', {});
        return getPlan(settings.currentPlan || setup.trialPlano || 'Profissional') || PLAN_CATALOG.profissional;
    }

    function trialActive() {
        const setup = read('sgq_company_setup', {});
        return setup.trialFim ? new Date(setup.trialFim) >= new Date() : false;
    }

    function trialExpired() {
        const setup=read('sgq_company_setup',{}),settings=getSettings();return Boolean(setup.trialFim&&new Date(setup.trialFim)<new Date()&&settings.subscriptionStatus!=='active');
    }

    function planAllowsModule(moduleId) {
        if (currentUser()?.role === 'super_admin' && currentUser()?.developmentOnly) return true;
        const plan = currentPlan();
        return (PLAN_MODULES[plan.id] || []).includes(moduleId);
    }

    function usage() {
        const plan = currentPlan();
        const setup = read('sgq_company_setup', {});
        let bytes = 0;
        for (let index=0; index<localStorage.length; index++) {
            const key = localStorage.key(index) || '';
            bytes += key.length + (localStorage.getItem(key) || '').length;
        }
        return {plan,users:getUsers().filter(user => !user.developmentOnly).length,userLimit:plan.users,units:Number(setup.units || 1),unitLimit:plan.units,storageBytes:bytes,storageGB:bytes/1073741824,storageLimitGB:plan.storageGB};
    }

    function limitStatus(kind) {
        const data = usage();
        if (kind === 'users') return {used:data.users,limit:data.userLimit,blocked:Boolean(data.userLimit && data.users >= data.userLimit)};
        if (kind === 'units') return {used:data.units,limit:data.unitLimit,blocked:Boolean(data.unitLimit && data.units >= data.unitLimit)};
        return {used:data.storageGB,limit:data.storageLimitGB,blocked:Boolean(data.storageLimitGB && data.storageGB >= data.storageLimitGB)};
    }

    function getPlans() {
        return Object.values(PLAN_CATALOG);
    }

    function getPlan(idOrName) {
        const value = String(idOrName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        return PLAN_CATALOG[value] || getPlans().find(plan => plan.name.toLowerCase() === String(idOrName || '').toLowerCase()) || null;
    }

    function moduleEnabled(moduleId) {
        if (currentUser()?.role === 'super_admin' && currentUser()?.developmentOnly) return true;
        return getSettings().modules?.[moduleId] !== false;
    }

    function applyModuleVisibility() {
        const settings = getSettings();
        const developmentSuper = currentUser()?.role === 'super_admin' && currentUser()?.developmentOnly;
        Object.entries(MODULE_FILES).forEach(([moduleId, file]) => {
            const allowed = developmentSuper || (settings.modules?.[moduleId] !== false && planAllowsModule(moduleId) && permission(moduleId, 'view'));
            if (allowed) return;
            document.querySelectorAll(`.sidebar a[href^="${file}"]`).forEach(link => { link.style.display = 'none'; });
        });
        const currentFile = location.pathname.split('/').pop();
        const currentModule = Object.keys(MODULE_FILES).find(id => MODULE_FILES[id] === currentFile);
        if (!currentModule) return;
        applyActionPermissions(currentModule);
        injectEvidenceAction(currentModule);
        const enabled = developmentSuper || (moduleEnabled(currentModule) && planAllowsModule(currentModule) && permission(currentModule, 'view'));
        if (enabled || document.getElementById('module-disabled-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'module-disabled-banner';
        banner.style.cssText = 'position:fixed;left:260px;right:0;top:0;z-index:10000;padding:12px 20px;background:#7f1d1d;color:#fff;text-align:center;font:600 14px Inter,Arial,sans-serif';
        banner.textContent = !planAllowsModule(currentModule) ? `O módulo não está incluído no plano ${currentPlan().name}. Os dados existentes foram preservados.` : !permission(currentModule,'view') ? 'Seu usuário não possui permissão para visualizar este módulo.' : 'Este módulo está desativado nas configurações da empresa. Os dados foram preservados.';
        document.body.appendChild(banner);
    }

    function currentModuleId() {
        const currentFile = location.pathname.split('/').pop();
        return Object.keys(MODULE_FILES).find(id => MODULE_FILES[id] === currentFile) || 'sistema';
    }

    function actionForElement(element) {
        const explicit = element.dataset.permission;
        if (explicit) return explicit;
        const text = `${element.textContent || ''} ${element.title || ''}`.trim();
        return Object.keys(ACTION_WORDS).find(action => ACTION_WORDS[action].test(text)) || null;
    }

    function applyActionPermissions(moduleId) {
        const developmentSuper=currentUser()?.role==='super_admin'&&currentUser()?.developmentOnly;
        const blockedByTrial=!developmentSuper&&trialExpired()&&location.pathname.split('/').pop()!=='configuracoes.html';
        document.querySelectorAll('button, a.mod-btn, a.btn, .action-btn').forEach(element => {
            const action = actionForElement(element);
            if (!action || (permission(moduleId, action)&&!blockedByTrial)) return;
            element.style.display = 'none';
            element.setAttribute('aria-hidden','true');
        });
        document.documentElement.dataset.permissionScope = permissionScope(moduleId);
    }

    function injectEvidenceAction(moduleId) {
        if (['documentos','bpm','cadastros'].includes(moduleId) || document.getElementById('sgq-evidence-button')) return;
        const header = document.querySelector('.page-header, .mod-header');
        if (!header || !permission(moduleId,'create')) return;
        const button = document.createElement('button');
        button.id = 'sgq-evidence-button';
        button.className = 'mod-btn ghost';
        button.innerHTML = '<i class="fas fa-paperclip"></i> Evidência';
        button.onclick = () => openEvidenceModal({module:moduleId,entityType:'módulo',entityId:'geral'});
        header.appendChild(button);
    }

    function ensureSharedUi() {
        if (document.getElementById('sgq-shared-style')) return;
        const style = document.createElement('style');
        style.id = 'sgq-shared-style';
        style.textContent = '.sgq-notification-panel{position:fixed;right:20px;top:70px;z-index:110000;width:min(390px,calc(100vw - 32px));max-height:70vh;overflow:auto;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#10233d;box-shadow:0 24px 70px rgba(0,0,0,.5);display:none}.sgq-notification-panel.active{display:block}.sgq-notification-head{display:flex;justify-content:space-between;align-items:center;color:#fff;margin-bottom:10px}.sgq-notification-item{display:block;padding:11px;border-radius:9px;background:rgba(255,255,255,.04);color:#fff;text-decoration:none;margin-top:7px}.sgq-notification-item.unread{border-left:3px solid #60a5fa}.sgq-notification-item strong,.sgq-notification-item span{display:block}.sgq-notification-item span{font-size:.74rem;color:rgba(255,255,255,.5);margin-top:3px}.sgq-notification-badge{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#ef4444;color:#fff;font:700 10px/17px Arial;text-align:center}.sgq-evidence-overlay{position:fixed;inset:0;z-index:120000;display:none;place-items:center;background:rgba(2,8,23,.78);padding:18px}.sgq-evidence-overlay.active{display:grid}.sgq-evidence-card{width:min(540px,100%);padding:22px;border-radius:14px;background:#10233d;border:1px solid rgba(255,255,255,.12);color:#fff}.sgq-evidence-card label{display:block;margin-top:12px;font-size:.78rem}.sgq-evidence-card input,.sgq-evidence-card textarea{width:100%;padding:10px;margin-top:5px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#0d2038;color:#fff}.sgq-master-banner{position:fixed;left:260px;right:0;top:0;z-index:99999;padding:9px 16px;background:#7c3aed;color:#fff;text-align:center;font:700 12px Arial}.sgq-limit-warning{padding:10px 14px;margin:0 0 14px;border-radius:9px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:#fbbf24;font-size:.78rem}';
        document.head.appendChild(style);
    }

    function refreshOperationalNotifications() {
        const existing = notifications();
        const keys = new Set(existing.map(item => item.key).filter(Boolean));
        const m = metrics();
        const candidates = [
            m.overdueActions ? {key:'overdue-actions',title:'Planos de ação atrasados',message:`${m.overdueActions} registro(s) exigem acompanhamento.`,type:'warning',module:'NCs',url:'nao-conformidades.html'} : null,
            m.calibrationAlerts ? {key:'calibration-alerts',title:'Calibrações exigem atenção',message:`${m.calibrationAlerts} instrumento(s) vencido(s) ou próximo(s) do vencimento.`,type:'warning',module:'Calibração',url:'calibracao.html'} : null,
            m.trainingsPending ? {key:'training-pending',title:'Treinamentos pendentes',message:`${m.trainingsPending} treinamento(s) aguardam conclusão.`,type:'info',module:'Pessoas',url:'pessoas.html'} : null,
            m.complaintsOpen ? {key:'complaints-open',title:'Reclamações abertas',message:`${m.complaintsOpen} reclamação(ões) aguardam tratamento.`,type:'warning',module:'Satisfação',url:'satisfacao.html'} : null
        ].filter(Boolean);
        candidates.filter(item => !keys.has(item.key)).forEach(notify);
    }

    function renderNotifications() {
        ensureSharedUi();
        if(!document.querySelector('[title="Notificações"]')){const topbar=document.querySelector('.topbar');if(topbar){let right=topbar.querySelector('.topbar-right');if(!right){right=document.createElement('div');right.className='topbar-right';right.style.marginLeft='auto';topbar.appendChild(right);}const bell=document.createElement('button');bell.className='topbar-icon';bell.type='button';bell.title='Notificações';bell.innerHTML='<i class="fas fa-bell"></i>';right.prepend(bell);}}
        let panel = document.getElementById('sgq-notification-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'sgq-notification-panel';
            panel.className = 'sgq-notification-panel';
            document.body.appendChild(panel);
        }
        const items = notifications();
        panel.innerHTML = `<div class="sgq-notification-head"><strong>Notificações</strong><button onclick="SGQCore.markAllNotifications()" style="border:0;background:none;color:#93c5fd;cursor:pointer">Marcar como lidas</button></div>${items.length ? items.map(item => `<a class="sgq-notification-item ${item.read?'':'unread'}" href="${item.url || '#'}" onclick="SGQCore.markNotification('${item.id}')"><strong>${escapeText(item.title)}</strong><span>${escapeText(item.message)} · ${new Date(item.createdAt).toLocaleDateString('pt-BR')}</span></a>`).join('') : '<p style="color:rgba(255,255,255,.5)">Nenhuma notificação.</p>'}`;
        const unread = items.filter(item => !item.read).length;
        document.querySelectorAll('[title="Notificações"]').forEach(button => {
            button.style.position='relative';
            button.onclick = event => { event.stopPropagation(); panel.classList.toggle('active'); };
            button.querySelector('.notif-dot')?.remove();
            let badge=button.querySelector('.sgq-notification-badge');
            if(unread&&!badge){badge=document.createElement('span');badge.className='sgq-notification-badge';button.appendChild(badge);}
            if(badge){badge.textContent=String(unread);badge.style.display=unread?'block':'none';}
        });
    }

    function markAllNotifications() {
        const items=notifications();items.forEach(item=>item.read=true);write(NOTIFICATIONS_KEY,items);renderNotifications();
    }

    function escapeText(value) {
        const div=document.createElement('div');div.textContent=String(value||'');return div.innerHTML;
    }

    function openEvidenceModal(options) {
        ensureSharedUi();
        let overlay=document.getElementById('sgq-evidence-overlay');
        if(!overlay){overlay=document.createElement('div');overlay.id='sgq-evidence-overlay';overlay.className='sgq-evidence-overlay';overlay.innerHTML='<form class="sgq-evidence-card" id="sgq-evidence-form"><h3>Evidências do registro</h3><div id="sgq-evidence-list"></div><p style="color:rgba(255,255,255,.55);font-size:.78rem">O protótipo armazena metadados do arquivo. O conteúdo real será enviado ao servidor no backend.</p><label>Título<input id="sgq-evidence-title" required></label><label>Descrição<textarea id="sgq-evidence-description" rows="3"></textarea></label><label>Arquivo<input id="sgq-evidence-file" type="file" required></label><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="mod-btn ghost" onclick="SGQCore.closeEvidenceModal()">Fechar</button><button class="mod-btn primary" type="submit">Salvar evidência</button></div></form>';document.body.appendChild(overlay);}
        overlay.dataset.options=JSON.stringify(options||{module:currentModuleId(),entityType:'módulo',entityId:'geral'});
        const target=JSON.parse(overlay.dataset.options),existing=getEvidences(target.module,target.entityType,target.entityId);document.getElementById('sgq-evidence-list').innerHTML=existing.length?existing.map(item=>`<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.76rem"><strong>${escapeText(item.title)}</strong><br><span style="color:rgba(255,255,255,.5)">${escapeText(item.files?.[0]?.name||'Sem arquivo')} · ${new Date(item.createdAt).toLocaleString('pt-BR')}</span></div>`).join(''):'<p style="color:rgba(255,255,255,.4);font-size:.76rem">Nenhuma evidência anexada neste registro.</p>';
        overlay.classList.add('active');
        document.getElementById('sgq-evidence-form').onsubmit=function(event){event.preventDefault();const file=document.getElementById('sgq-evidence-file').files[0];const limit=Number(getSettings().files?.attachmentMB||5);if(file.size>limit*1024*1024)return alert(`O arquivo excede o limite de ${limit} MB.`);const target=JSON.parse(overlay.dataset.options);addEvidence(Object.assign(target,{title:document.getElementById('sgq-evidence-title').value.trim(),description:document.getElementById('sgq-evidence-description').value.trim(),files:[{name:file.name,size:file.size,type:file.type}]}));notify({title:'Evidência adicionada',message:file.name,module:target.module,url:MODULE_FILES[target.module]||''});event.target.reset();closeEvidenceModal();alert('Evidência registrada.');};
    }

    function closeEvidenceModal(){document.getElementById('sgq-evidence-overlay')?.classList.remove('active');}

    function applyCurrentUserUi() {
        const user=currentUser();if(!user)return;
        document.querySelectorAll('.user-btn-name,.user-name').forEach(element=>element.textContent=user.name);
        document.querySelectorAll('.user-role').forEach(element=>element.textContent=user.roleLabel||user.role);
        const initials=user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();document.querySelectorAll('.avatar').forEach(element=>element.textContent=initials);
    }

    function applyAdministrativeScope() {
        const user=currentUser();if(location.pathname.split('/').pop()!=='configuracoes.html'||['super_admin','admin_company'].includes(user?.role))return;document.querySelectorAll('.company-admin-only').forEach(element=>element.style.display='none');if(user?.role==='user'){const content=document.querySelector('.page-content');if(content)content.innerHTML='<div class="card"><div class="card-body"><h3 style="color:#fff">Acesso restrito</h3><p>Somente administradores podem acessar as configurações da empresa.</p><a class="mod-btn primary" href="dashboard.html">Voltar ao dashboard</a></div></div>';}
    }

    function applyMasterSessionBanner() {
        const session=read('sgq_master_tenant_session',null);if(!session)return;
        if(new Date(session.expiresAt)<=new Date()){localStorage.removeItem('sgq_master_tenant_session');return;}
        ensureSharedUi();const banner=document.createElement('div');banner.className='sgq-master-banner';banner.textContent=`Acesso temporário do Admin Master · expira às ${new Date(session.expiresAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · todas as ações são auditadas`;document.body.appendChild(banner);document.body.style.paddingTop='34px';
    }

    function injectLimitWarning() {
        const target=document.querySelector('.page-content');if(!target||document.getElementById('sgq-limit-warning'))return;const data=usage(),setup=read('sgq_company_setup',{}),messages=[];
        if(data.userLimit&&data.users/data.userLimit>=.8)messages.push(`${data.users}/${data.userLimit} usuários utilizados`);
        if(data.storageLimitGB&&data.storageGB/data.storageLimitGB>=.8)messages.push(`${data.storageGB.toFixed(2)}/${data.storageLimitGB} GB utilizados`);
        if(setup.trialFim){const days=Math.ceil((new Date(setup.trialFim)-new Date())/86400000);if(days<=7)messages.push(days>=0?`trial termina em ${days} dia(s)`:'trial encerrado');}
        if(!messages.length)return;const note=document.createElement('div');note.id='sgq-limit-warning';note.className='sgq-limit-warning';note.innerHTML=`<i class="fas fa-triangle-exclamation"></i> Plano ${data.plan.name}: ${messages.join(' · ')}`;target.prepend(note);
    }

    function initialize() {
        seedUsers();ensureSharedUi();refreshOperationalNotifications();applyModuleVisibility();applyCurrentUserUi();applyAdministrativeScope();renderNotifications();applyMasterSessionBanner();injectLimitWarning();const moduleId=currentModuleId();let permissionTimer;new MutationObserver(()=>{clearTimeout(permissionTimer);permissionTimer=setTimeout(()=>applyActionPermissions(moduleId),50)}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',event=>{if(!event.target.closest('#sgq-notification-panel')&&!event.target.closest('[title="Notificações"]'))document.getElementById('sgq-notification-panel')?.classList.remove('active');});
    }

    function nextId(items) {
        return (items || []).reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    }

    function audit(module, action, entityType, entityId, details) {
        const history = read(HISTORY_KEY, []);
        history.unshift({
            id: Date.now(), module, action, entityType, entityId,
            details: details || '', user: currentUser()?.name || 'Usuário atual', userId:currentUser()?.id || null, createdAt: new Date().toISOString()
        });
        write(HISTORY_KEY, history.slice(0, 500));
    }

    function notify(options) {
        const notifications = read(NOTIFICATIONS_KEY, []);
        const item = Object.assign({id:Date.now()+Math.random(),title:'Notificação',message:'',type:'info',module:'Sistema',read:false,createdAt:new Date().toISOString(),url:''}, options || {});
        notifications.unshift(item);
        write(NOTIFICATIONS_KEY, notifications.slice(0, 200));
        return item;
    }

    function notifications() {
        return read(NOTIFICATIONS_KEY, []);
    }

    function markNotification(id, readState) {
        const items = notifications();
        const item = items.find(entry => String(entry.id) === String(id));
        if (item) item.read = readState !== false;
        write(NOTIFICATIONS_KEY, items);
    }

    function softDeactivate(list, id, options) {
        const item = (list || []).find(entry => String(entry.id) === String(id));
        if (!item) return false;
        const reason = options?.reason || 'Desativação operacional';
        item.status = options?.status || 'inativo';
        item.ativo = false;
        item.deletedAt = new Date().toISOString();
        item.deletedBy = currentUser()?.name || 'Usuário atual';
        item.deactivationReason = reason;
        audit(options?.module || 'Sistema', 'desativou', options?.entityType || 'Registro', id, reason);
        return item;
    }

    function addEvidence(options) {
        const evidences = read(EVIDENCES_KEY, []);
        const item = Object.assign({id:nextId(evidences),module:'geral',entityType:'registro',entityId:'',title:'Evidência',description:'',files:[],createdAt:new Date().toISOString(),createdBy:currentUser()?.name || 'Usuário atual'}, options || {});
        evidences.unshift(item);
        write(EVIDENCES_KEY, evidences);
        audit(item.module, 'anexou evidência', item.entityType, item.entityId || item.id, item.title);
        return item;
    }

    function getEvidences(moduleId, entityType, entityId) {
        return read(EVIDENCES_KEY, []).filter(item => (!moduleId || item.module === moduleId) && (!entityType || item.entityType === entityType) && (entityId === undefined || String(item.entityId) === String(entityId)));
    }

    function startLinkedAction(options) {
        const draft = Object.assign({
            tipo: 'plano', criticidade: 'media', titulo: '', descricao: '',
            responsavel: '', setor: '', prazo: '', origemTipo: '', origemId: '', origemTitulo: ''
        }, options || {});
        write(DRAFT_KEY, draft);
        const base = location.pathname.includes('/pages/') ? 'nao-conformidades.html' : 'pages/nao-conformidades.html';
        location.href = `${base}?tipo=${encodeURIComponent(draft.tipo)}&novo=1`;
    }

    function consumeLinkedAction() {
        const draft = read(DRAFT_KEY, null);
        if (draft) localStorage.removeItem(DRAFT_KEY);
        return draft;
    }

    function flattenDocuments(folders, parentPath) {
        const docs = [];
        (folders || []).forEach(folder => {
            const path = [parentPath, folder.name].filter(Boolean).join(' / ');
            (folder.documents || []).forEach(doc => docs.push(Object.assign({ _folder:path }, doc)));
            docs.push(...flattenDocuments(folder.children || folder.folders || [], path));
        });
        return docs;
    }

    function metrics() {
        const nc = read('sgq_nc', { items: [] }).items || [];
        const risks = read('sgq_riscos', { riscos: [], ocorrencias: [], contingencias: [] });
        const audits = read('sgq_auditorias', { auditorias: [], checklists: [] });
        const kpis = read('sgq_indicadores', { kpis: [], lancamentos: [] });
        const people = read('sgq_pessoas', { colaboradores: [], funcoes: [], treinamentos: [] });
        const satisfaction = read('sgq_satisfacao', { clientes: [], reclamacoes: [], npsRespostas: [] });
        const suppliers = read('sgq_fornecedores', { fornecedores: [] });
        const calibration = read('sgq_calibracao', { instrumentos: [] });
        const inspections = read('sgq_inspecoes', { inspecoes: [] });
        const production = read('sgq_producao', { ordens: [] });
        const organization = read('sgq_organizacao_iso', { contexto: {}, swot: [], partes: [], recursos: [], mudancas: [], analises: [] });
        const projects = read('sgq_projeto_desenvolvimento', { projetos: [] });
        const flows = read('sgq_flows', []);
        const instances = read('sgq_flowInstances', []);
        const docs = flattenDocuments(read('sgq_docFolders', []));
        const today = new Date();
        const nps = satisfaction.npsRespostas || [];
        const promoters = nps.filter(item => Number(item.nota) >= 9).length;
        const detractors = nps.filter(item => Number(item.nota) <= 6).length;
        const npsScore = nps.length ? Math.round(((promoters - detractors) / nps.length) * 100) : null;
        const openStatuses = item => !['concluida', 'concluido', 'finalizada', 'finalizado', 'cancelada', 'cancelado', 'inativo'].includes(item.status);
        const instruments = calibration.instrumentos || [];

        return {
            nc, risks, audits, kpis, people, satisfaction, suppliers, calibration,
            inspections, production, organization, projects, flows, instances, docs,
            documents: docs.length,
            openRnc: nc.filter(item => item.tipo === 'rnc' && openStatuses(item)).length,
            openPlans: nc.filter(item => item.tipo === 'plano' && openStatuses(item)).length,
            openImprovements: nc.filter(item => item.tipo === 'melhoria' && openStatuses(item)).length,
            overdueActions: nc.filter(item => openStatuses(item) && item.prazo && new Date(item.prazo + 'T23:59:59') < today).length,
            criticalRisks: (risks.riscos || []).filter(item => item.nivel === 'critico' && item.status !== 'inativo').length,
            activeKpis: (kpis.kpis || []).filter(item => item.ativo !== false).length,
            auditsPlanned: (audits.auditorias || []).filter(openStatuses).length,
            trainingsPending: (people.treinamentos || []).filter(openStatuses).length,
            complaintsOpen: (satisfaction.reclamacoes || []).filter(openStatuses).length,
            suppliersCount: (suppliers.fornecedores || []).length,
            supplierAverage: average((suppliers.fornecedores || []).map(item => Number(item.score)).filter(Number.isFinite)),
            npsScore,
            changesOpen: (organization.mudancas || []).filter(openStatuses).length,
            activeFlows: (flows || []).filter(item => item.status === 'active').length,
            runningInstances: (instances || []).filter(item => item.status === 'in-progress').length,
            calibrationAlerts: instruments.filter(item => ['vencido', 'vencendo'].includes(item.status)).length,
            inspectionsDone: (inspections.inspecoes || []).filter(item => ['finalizada', 'concluida', 'liberada'].includes(item.status)).length,
            productionOrders: (production.ordens || production.ops || []).length,
            projectsCount: (projects.projetos || []).length
        };
    }

    function average(values) {
        return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
    }

    function statusFor(count, strong) {
        if (count >= (strong || 1)) return 'ok';
        return count > 0 ? 'partial' : 'gap';
    }

    function coverage() {
        const m = metrics();
        const org = m.organization;
        const context = org.contexto || {};
        const controlledDocs = m.docs.filter(doc => !['rascunho', 'inativo', 'obsoleto'].includes(String(doc.status || 'publicado').toLowerCase()));
        const policy = m.docs.filter(doc => /política.*qualidade|qualidade.*política|manual.*qualidade/i.test(`${doc.title || ''} ${doc.name || ''} ${doc._folder || ''}`));
        const completedTrainings = (m.people.treinamentos || []).filter(item => item.concluido || item.status === 'concluido').length;
        const suppliersEvaluated = (m.suppliers.fornecedores || []).filter(item => (item.avaliacoes || []).length || Number(item.score) > 0).length;
        const completedAudits = (m.audits.auditorias || []).filter(item => item.status === 'concluida').length;
        const completedAnalyses = (org.analises || []).filter(item => ['aprovada', 'concluida'].includes(item.status)).length;
        const rows = [
            ['4.1', 'Contexto da organização', statusFor((org.swot || []).length), 'SWOT e contexto registrados.'],
            ['4.2', 'Partes interessadas', statusFor((org.partes || []).length), 'Necessidades e monitoramento das partes interessadas.'],
            ['4.3', 'Escopo do SGQ', context.escopo ? 'ok' : 'gap', 'Escopo cadastrado na Organização.'],
            ['4.4', 'Processos do SGQ', m.activeFlows && m.runningInstances ? 'ok' : m.activeFlows ? 'partial' : 'gap', 'Fluxos publicados e evidência de execução.'],
            ['5.1', 'Liderança', completedAnalyses ? 'partial' : 'gap', 'Análise crítica evidencia participação da direção; responsabilidades serão ampliadas depois.'],
            ['5.2', 'Política da qualidade', policy.length && completedTrainings ? 'ok' : policy.length || completedTrainings ? 'partial' : 'gap', 'Documento controlado e comunicação por treinamento.'],
            ['5.3', 'Responsabilidades e autoridades', (m.people.funcoes || []).length ? 'partial' : 'gap', 'Funções cadastradas; organograma/RACI permanece futuro.'],
            ['6.1', 'Riscos e oportunidades', statusFor((m.risks.riscos || []).length), 'Riscos registrados e tratados.'],
            ['6.2', 'Objetivos da qualidade', m.activeKpis && (m.kpis.lancamentos || []).length ? 'ok' : m.activeKpis ? 'partial' : 'gap', 'Indicadores com metas e resultados.'],
            ['6.3', 'Planejamento de mudanças', statusFor((org.mudancas || []).length), 'Mudanças com risco, aprovação e plano.'],
            ['7.1', 'Recursos', statusFor((org.recursos || []).length, 2), 'Recursos, infraestrutura e ambiente monitorados.'],
            ['7.2/7.3', 'Competência e conscientização', completedTrainings ? 'ok' : (m.people.treinamentos || []).length ? 'partial' : 'gap', 'Treinamentos planejados e concluídos.'],
            ['7.4', 'Comunicação', controlledDocs.length ? 'partial' : 'gap', 'Comunicação documentada; matriz dedicada não será criada.'],
            ['7.5', 'Informação documentada', controlledDocs.length ? 'ok' : m.documents ? 'partial' : 'gap', 'Documentos publicados e controlados.'],
            ['8.2', 'Requisitos do cliente', m.activeFlows ? 'partial' : 'gap', 'Fluxo comercial deve possuir instâncias e evidências.'],
            ['8.3', 'Projeto e desenvolvimento', m.projectsCount ? 'ok' : 'gap', 'Projetos executados no processo padrão.'],
            ['8.4', 'Provedores externos', suppliersEvaluated ? 'ok' : m.suppliersCount ? 'partial' : 'gap', 'Fornecedores avaliados.'],
            ['8.5/8.6/8.7', 'Operação, liberação e saídas NC', m.productionOrders && m.inspectionsDone ? 'ok' : m.productionOrders || (m.inspections.inspecoes || []).length ? 'partial' : 'gap', 'Produção/serviço, inspeção e tratamento de saídas.'],
            ['9.1.3', 'Análise e avaliação', m.activeKpis && (m.kpis.lancamentos || []).length ? 'ok' : m.activeKpis ? 'partial' : 'gap', 'Dados reais consolidados dos módulos.'],
            ['9.2', 'Auditoria interna', completedAudits ? 'ok' : (m.audits.auditorias || []).length ? 'partial' : 'gap', 'Auditorias planejadas e concluídas.'],
            ['9.3', 'Análise crítica pela direção', completedAnalyses ? 'ok' : (org.analises || []).length ? 'partial' : 'gap', 'Análises críticas preparadas, aprovadas e evidenciadas.'],
            ['10.2', 'Não conformidade e ação corretiva', m.nc.some(item => item.tipo === 'rnc') ? 'ok' : 'gap', 'RNCs, causas, ações e eficácia.'],
            ['10.3', 'Melhoria contínua', m.nc.some(item => item.tipo === 'melhoria') ? 'ok' : 'gap', 'Melhorias registradas e acompanhadas.']
        ];
        return rows;
    }

    window.SGQCore = { read, write, nextId, audit, metrics, coverage, startLinkedAction, consumeLinkedAction, flattenDocuments, getSettings, getPlans, getPlan, getUsers, currentUser, setCurrentUser, permission, permissionScope, filterRecords, currentPlan, planAllowsModule, usage, limitStatus, moduleEnabled, applyModuleVisibility, notify, notifications, markNotification, markAllNotifications, softDeactivate, addEvidence, getEvidences, openEvidenceModal, closeEvidenceModal };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
