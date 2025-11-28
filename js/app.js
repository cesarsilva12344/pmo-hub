// js/app.js

// CONFIGURAÇÃO INICIAL E HELPERS
const supabaseClient = window.supabaseClient || window.supabase.createClient(window.PMO_CONFIG.SUPABASE_URL, window.PMO_CONFIG.SUPABASE_KEY);

const phases = {
    's2d': ['Check-in Comercial', 'Repositório Criado', 'Riscos Iniciais'],
    'init': ['Kick-off', 'Stakeholders Mapeados', 'TAP Assinado'],
    'plan': ['Cronograma', 'WBS', 'Plano Financeiro'],
    'exec': ['Desenvolvimento', 'Testes', 'Homologação'],
    'mon': ['Status Report', 'Controle Horas', 'Change Log'],
    'close': ['Aceite Final', 'Lições Aprendidas', 'Encerramento Admin']
};
const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// --- CORREÇÃO: FormatCurrency definido no topo ---
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
window.formatCurrency = function(v) {
    return BRL.format(v || 0);
}

// ESTADO GLOBAL
let projects = [];
let currentProjId = null;
let activeLogoFilter = 'all';
let chartInstance = null;
let adminChart1 = null;
let adminChart2 = null;
let timerInterval = null;

// FUNÇÃO DE INICIALIZAÇÃO
window.init = async function() {
    try {
        const { data, error } = await supabaseClient.from('projects').select('*');
        if(error) throw error;
        projects = data && data.length > 0 ? data.map(row => row.content) : [];
        
        if (window.Auth && window.Auth.isAdmin()) {
            const btnAdmin = document.getElementById('nav-admin');
            if(btnAdmin) btnAdmin.classList.remove('hidden');
            const profileSelector = document.getElementById('admin-profile-selector');
            if(profileSelector) profileSelector.classList.remove('hidden');
        }
    } catch (err) { 
        console.error("Erro na inicialização:", err); 
    }
    window.renderPortfolio();
    window.renderFilters();
}

// FUNÇÕES DE CRUD
window.save = async function() {
    try {
        if (currentProjId) {
            const p = projects.find(x => x.id === currentProjId);
            // Salva apenas o projeto atual
            await supabaseClient.from('projects').upsert({ id: p.id, content: p });
        } else {
            // Fallback: Salva todos (use com cautela)
            for(const p of projects) {
                await supabaseClient.from('projects').upsert({ id: p.id, content: p });
            }
        }
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("Erro ao salvar dados. Verifique a conexão.");
    }
}

window.createProject = async function() {
    const nameInput = document.getElementById('np-name');
    const pmInput = document.getElementById('np-pm');
    const clientInput = document.getElementById('np-client');

    const name = nameInput.value;
    if (!name) { alert("Por favor, digite o nome do projeto."); return; }

    const btn = document.querySelector("button[onclick='window.createProject()']");
    if(btn) { btn.innerText = "Salvando..."; btn.disabled = true; }

    const model = document.getElementById('np-model').value;
    const client = clientInput.value || 'Geral';
    let icon = "fas fa-building"; 
    if (client.toLowerCase().includes("banco")) icon = "fas fa-university";
    
    // Gera ID baseado em tempo (inteiro)
    const newId = Date.now(); 
    
    const newP = {
        id: newId, name, pm: pmInput.value || 'Gerente', 
        client, logo: icon, model: model, 
        fin: { setup: 0, sustain: 0 }, 
        info: { hours_plan: 0, hours_real: 0, costmode: 'CAPEX' }, 
        sCurve: Array(12).fill(0).map((_, i) => ({ month: months[i], plan: 0, real: 0 })),
        gantt: [], kanban: { todo: [], doing: [], done: [] }, 
        risks: [], canvas: { pain: '', obj: '' }, stakeholders: [], raci: [], checks: {}
    };

    try {
        // Tenta salvar no Supabase PRIMEIRO
        const { error } = await supabaseClient.from('projects').upsert({ id: newId, content: newP });
        if (error) throw error;

        // Se deu certo, atualiza localmente
        projects.push(newP);
        window.closeModal('modal-project');
        window.goToPortfolio();
        window.renderFilters();
        
        nameInput.value = "";
        pmInput.value = "";
        clientInput.value = "";

    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("Erro ao criar projeto no banco: " + err.message);
    } finally {
        if(btn) { btn.innerText = "Criar"; btn.disabled = false; }
    }
}

window.deleteProject = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este projeto permanentemente?")) return;
    try {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) throw error;
        projects = projects.filter(p => p.id !== id);
        window.renderPortfolio();
        window.renderFilters();
        if(currentProjId === id) window.goToPortfolio();
    } catch (err) {
        console.error("Erro ao excluir:", err);
        alert("Erro ao excluir. Verifique sua conexão.");
    }
}

// UI HELPERS & NAVEGAÇÃO
window.goToPortfolio = function() {
    document.getElementById('view-portfolio').classList.remove('hidden');
    document.getElementById('view-project-hub').classList.add('hidden');
    const viewAdmin = document.getElementById('view-admin');
    if(viewAdmin) viewAdmin.classList.add('hidden');
    document.getElementById('project-nav').classList.add('hidden');
    window.renderPortfolio();
}

window.openProject = function(id) {
    currentProjId = id; const p = projects.find(x=>x.id===id);
    document.getElementById('view-portfolio').classList.add('hidden');
    const viewAdmin = document.getElementById('view-admin'); if(viewAdmin) viewAdmin.classList.add('hidden');
    
    document.getElementById('view-project-hub').classList.remove('hidden');
    document.getElementById('project-nav').classList.remove('hidden');
    document.getElementById('sb-proj-name').innerText = p.name;
    
    const model = p.model || 'tradicional';
    const typeLabel = document.getElementById('sb-proj-type');
    if(typeLabel) typeLabel.innerText = model.toUpperCase();
    
    const navGantt = document.getElementById('nav-gantt');
    const navKanban = document.getElementById('nav-kanban');

    if (model === 'agil') {
        if(navGantt) navGantt.classList.add('hidden');
        if(navKanban) navKanban.classList.remove('hidden');
    } else {
        if(navGantt) navGantt.classList.remove('hidden');
        if(navKanban) navKanban.classList.add('hidden');
    }

    window.showTab('dashboard');
}

window.showTab = function(id) {
    document.querySelectorAll('#view-project-hub > div').forEach(d => d.classList.add('hidden'));
    const viewAdmin = document.getElementById('view-admin');
    if(viewAdmin) viewAdmin.classList.add('hidden');
    
    document.querySelectorAll('#project-nav .nav-item').forEach(b => b.classList.remove('active'));
    
    if(id === 'admin') {
        document.getElementById('view-portfolio').classList.add('hidden');
        document.getElementById('view-project-hub').classList.add('hidden');
        document.getElementById('view-admin').classList.remove('hidden');
        window.renderAdminView();
        return;
    }

    const tab = document.getElementById('tab-'+id);
    if(tab) tab.classList.remove('hidden');
    
    const nav = document.getElementById('nav-'+id);
    if(nav) nav.classList.add('active');
    
    if(id === 'dashboard') window.renderDashboard();
    if(id === 'info') window.loadInfoForm();
    if(id === 'financial') window.renderSCurveInput();
    if(id === 'lifecycle') window.renderPhase('s2d');
    if(id === 'gantt') window.renderGantt();
    if(id === 'kanban') window.renderKanban();
    if(id === 'governance') window.renderGov();
    if(id === 'canvas') window.loadCanvas();
    if(id === 'risks') window.renderRiskMatrix();
}

// RENDERING
window.renderPortfolio = function() {
    const tb = document.getElementById('portfolio-body'); tb.innerHTML = '';
    if (projects.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Nenhum projeto encontrado. Clique em "Novo Projeto" para começar.</td></tr>';
        return;
    }
    const filtered = activeLogoFilter === 'all' ? projects : projects.filter(p => p.client === activeLogoFilter);
    
    filtered.forEach(p => {
        const lastReal = p.sCurve?.[p.sCurve.length-1]?.real || 0;
        const info = p.info || {};
        // CORREÇÃO: window.formatCurrency
        tb.innerHTML += `<tr class="border-b hover:bg-slate-50"><td><div class="flex items-center gap-2"><i class="${p.logo}"></i> <span class="font-bold">${p.client}</span></div></td><td><div class="font-bold">${p.name}</div></td><td><span class="text-xs bg-slate-200 px-2 rounded">${p.model || 'Trad'}</span></td><td><span class="bg-blue-100 text-blue-700 px-2 font-bold text-xs">Ativo</span></td><td><div class="flex gap-1"><div class="traffic-light tl-${info.time||'verde'}"></div><div class="traffic-light tl-${info.cost||'verde'}"></div></div></td><td><div class="text-xs font-bold text-blue-600">${window.formatCurrency(lastReal)}</div></td><td class="text-right"><button onclick="window.openProject(${p.id})" class="text-xs border px-2 py-1 rounded hover:bg-slate-100 mr-2">Abrir</button><button onclick="window.deleteProject(${p.id})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    
    // Atualiza KPIs simples
    document.getElementById('kpi-total').innerText = filtered.length;
}

window.renderDashboard = function() {
    const p = projects.find(x=>x.id===currentProjId); const info = p.info || {};
    document.getElementById('dash-name').innerText = p.name; document.getElementById('dash-pm').innerText = p.pm; document.getElementById('dash-client').innerText = p.client;
    
    const last = p.sCurve.filter(m => m.real > 0).pop() || { plan: 0, real: 0 };
    const cfCusto = window.PMO_Metrics.calcularFarolCusto(last.plan, last.real);
    const cfPrazo = window.PMO_Metrics.calcularFarolPrazo(p.gantt);
    const cfHoras = window.PMO_Metrics.calcularFarolHoras(info.hours_plan, info.hours_real);

    document.getElementById('light-time').className = `traffic-light tl-${cfPrazo} mt-1`;
    document.getElementById('light-cost').className = `traffic-light tl-${cfCusto} mt-1`;
    document.getElementById('light-hours').className = `traffic-light tl-${cfHoras} mt-1`;

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('sCurveChart').getContext('2d');
    chartInstance = new Chart(ctx, { type: 'line', data: { labels: p.sCurve.map(d=>d.month), datasets: [{ label: 'Realizado', data: p.sCurve.map(d=>d.real), borderColor: '#2563eb' }] }, options: { maintainAspectRatio: false } });
}

window.renderAdminView = function() {
    const ctx1 = document.getElementById('adminChart1').getContext('2d');
    const ctx2 = document.getElementById('adminChart2').getContext('2d');
    
    const clients = {};
    const models = { 'tradicional': 0, 'agil': 0, 'quick': 0 };
    
    projects.forEach(p => {
        const total = p.sCurve?.[p.sCurve.length-1]?.real || 0;
        if(!clients[p.client]) clients[p.client] = 0;
        clients[p.client] += total;
        
        const m = p.model || 'tradicional';
        if(models[m] !== undefined) models[m]++;
        else models['tradicional']++;
    });

    if(adminChart1) adminChart1.destroy();
    if(adminChart2) adminChart2.destroy();

    adminChart1 = new Chart(ctx1, { type: 'bar', data: { labels: Object.keys(clients), datasets: [{ label: 'Investimento (R$)', data: Object.values(clients), backgroundColor: '#3b82f6' }] } });
    adminChart2 = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(models), datasets: [{ data: Object.values(models), backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'] }] } });
}

// MATRIZ DE RISCO
window.renderRiskMatrix = function() {
    const p = projects.find(x => x.id === currentProjId);
    const list = document.getElementById('risk-list');
    list.innerHTML = '';
    
    document.querySelectorAll('.risk-cell').forEach(c => c.innerHTML = '');

    if(!p.risks) p.risks = [];

    p.risks.forEach((r, idx) => {
        if(r.type === 'issue') return; 

        const score = window.PMO_Metrics.calcularScoreRisco(r.prob, r.imp);
        const color = score >= 6 ? 'text-red-600' : (score >= 3 ? 'text-amber-600' : 'text-green-600');
        
        list.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-slate-50 border rounded text-xs">
                <div>
                    <span class="font-bold ${color}">[${score}]</span> ${r.desc}
                </div>
                <button onclick="window.turnIssue(${idx})" class="text-[10px] bg-white border px-2 py-1 hover:bg-red-50 text-red-500">Virar Issue</button>
            </div>`;

        const cellId = `cell-${r.prob}-${r.imp}`;
        const cell = document.getElementById(cellId);
        if(cell) {
            cell.innerHTML += `<div class="risk-dot" title="${r.desc}">${idx+1}</div>`;
        }
    });
}

window.addRiskMatrix = function() {
    const desc = document.getElementById('risk-desc').value;
    const prob = parseInt(document.getElementById('risk-prob').value);
    const imp = parseInt(document.getElementById('risk-imp').value);
    
    if(desc) {
        const p = projects.find(x => x.id === currentProjId);
        if(!p.risks) p.risks = [];
        p.risks.push({ desc, prob, imp, type: 'risk' }); 
        window.save();
        window.renderRiskMatrix();
        document.getElementById('risk-desc').value = '';
    }
}

window.turnIssue = function(idx) {
    if(!confirm("Transformar este Risco em Issue (Problema Real)?")) return;
    const p = projects.find(x => x.id === currentProjId);
    p.risks[idx].type = 'issue';
    p.risks[idx].desc = "[ISSUE] " + p.risks[idx].desc;
    window.save(); 
    window.renderRiskMatrix();
}

// KANBAN
window.renderKanban = function() {
    const p = projects.find(x => x.id === currentProjId);
    if(!p.kanban) p.kanban = { todo: [], doing: [], done: [] };
    
    ['todo', 'doing', 'done'].forEach(col => {
        const div = document.getElementById('kb-'+col);
        div.innerHTML = '';
        p.kanban[col].forEach((item, idx) => {
            div.innerHTML += `
                <div class="kanban-card" draggable="true" ondragstart="window.drag(event, '${col}', ${idx})">
                    ${item}
                    <button onclick="window.delKanban('${col}', ${idx})" class="float-right text-red-300 hover:text-red-500">×</button>
                </div>`;
        });
    });
}
window.drag = function(ev, col, idx) { ev.dataTransfer.setData("text", JSON.stringify({col, idx})); }
window.addKanban = function(col) { const t = prompt("Nova Tarefa:"); if(t) { projects.find(x => x.id === currentProjId).kanban[col].push(t); window.save(); window.renderKanban(); }}
window.delKanban = function(col, idx) { projects.find(x => x.id === currentProjId).kanban[col].splice(idx, 1); window.save(); window.renderKanban(); }

// DEMAIS FUNÇÕES DO PROJETO
window.loadInfoForm = function() { const p = projects.find(x=>x.id===currentProjId); if(!p.info) p.info = {}; ['client','product','pep','assignee','reporter','costmode'].forEach(f => { document.getElementById('info-'+f).value = p.info[f] || ''; }); document.getElementById('info-hours-plan').value = p.info.hours_plan || 0; document.getElementById('info-hours-real').value = p.info.hours_real || 0; }
window.saveProjectInfo = function() { const p = projects.find(x=>x.id===currentProjId); if(!p.info) p.info = {}; ['client','product','pep','assignee','reporter','costmode'].forEach(f => { p.info[f] = document.getElementById('info-'+f).value; }); p.info.hours_plan = parseFloat(document.getElementById('info-hours-plan').value) || 0; p.info.hours_real = parseFloat(document.getElementById('info-hours-real').value) || 0; p.client = document.getElementById('info-client').value; window.save(); alert('Dados Salvos!'); window.renderDashboard(); }
window.renderGantt = function() { const p = projects.find(x=>x.id===currentProjId); const container = document.getElementById('gantt-rows'); container.innerHTML = ''; container.innerHTML = `<div class="absolute inset-0 grid grid-cols-12 pointer-events-none h-full"><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div></div>`; p.gantt.forEach(task => { const width = (task.end - task.start) * (100/12); const left = task.start * (100/12); container.innerHTML += `<div class="relative h-10 flex items-center z-10 mb-2 group"><div class="gantt-bar bg-amber-500 hover:bg-amber-600 text-white shadow-md text-xs font-bold pl-2" style="left: ${left}%; width: ${width}%">${task.name}</div></div>`; }); }
window.addTaskGantt = function() { const name = prompt("Nome da Tarefa:"); const start = parseInt(prompt("Mês Início (0-11):")); const end = parseInt(prompt("Mês Fim (0-11):")); if(name) { projects.find(x=>x.id===currentProjId).gantt.push({name, start, end}); window.save(); window.renderGantt(); } }
window.renderPhase = function(ph) { const p = projects.find(x=>x.id===currentProjId); const checklist = phases[ph]; const titleMap = {'s2d':'S2D', 'init':'Iniciação', 'plan':'Planejamento', 'exec':'Execução', 'mon':'Monitoramento', 'close':'Encerramento'}; document.getElementById('ph-title').innerText = titleMap[ph]; document.querySelectorAll('#tab-lifecycle button').forEach(b => b.classList.remove('bg-indigo-600', 'text-white')); document.getElementById('ph-'+ph).classList.add('bg-indigo-600', 'text-white'); const div = document.getElementById('ph-checklist'); div.innerHTML = ''; checklist.forEach((item, i) => { const key = ph + '_' + i; const checked = p.checks && p.checks[key] ? 'checked' : ''; div.innerHTML += `<label class="flex items-center p-3 border rounded bg-white hover:bg-slate-50 cursor-pointer"><input type="checkbox" onchange="window.toggleCheck('${key}', '${ph}')" ${checked} class="mr-3"> <span class="${checked?'line-through text-slate-400':''}">${item}</span></label>`; }); }
window.toggleCheck = function(key, ph) { const p = projects.find(x=>x.id===currentProjId); if(!p.checks) p.checks = {}; p.checks[key] = !p.checks[key]; window.save(); window.renderPhase(ph); }
window.renderSCurveInput = function() { const p = projects.find(x=>x.id===currentProjId); const tbody = document.getElementById('scurve-input-body'); tbody.innerHTML = ''; p.sCurve.forEach((row, i) => { tbody.innerHTML += `<tr class="border-b"><td class="py-2 px-4">${row.month}</td><td class="py-2 px-4"><input type="number" onchange="window.updateSCurve(${i}, 'plan', this.value)" value="${row.plan}" class="form-input w-32 py-1"></td><td class="py-2 px-4"><input type="number" onchange="window.updateSCurve(${i}, 'real', this.value)" value="${row.real}" class="form-input w-32 py-1"></td></tr>`; }); document.getElementById('fin-setup').value = p.fin.setup; document.getElementById('fin-sustain').value = p.fin.sustain; }
window.updateSCurve = function(idx, field, val) { projects.find(x=>x.id===currentProjId).sCurve[idx][field] = parseFloat(val); window.save(); }
window.saveSCurveData = function() { window.save(); alert('Gráfico Atualizado!'); }
window.saveMacroFin = function() { const p = projects.find(x=>x.id===currentProjId); p.fin.setup = parseFloat(document.getElementById('fin-setup').value); p.fin.sustain = parseFloat(document.getElementById('fin-sustain').value); window.save(); alert('Salvo!'); }
window.renderGov = function() { const p = projects.find(x=>x.id===currentProjId); document.getElementById('stake-body').innerHTML = p.stakeholders.map((s,i)=>`<tr><td>${s.n}</td><td>${s.r}</td><td><button onclick="window.delStake(${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join(''); document.getElementById('raci-body').innerHTML = p.raci.map((r,i)=>`<tr><td>${r.a}</td><td>${r.r}</td><td>${r.ac}</td><td>${r.c}</td><td>${r.i}</td><td><button onclick="window.delRaci(${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join(''); }
window.addStake = function() { const n=prompt("Nome:"); if(n) { projects.find(x=>x.id===currentProjId).stakeholders.push({n, r:'-'}); window.save(); window.renderGov(); }}
window.delStake = function(i) { projects.find(x=>x.id===currentProjId).stakeholders.splice(i,1); window.save(); window.renderGov(); }
window.addRaci = function() { const a=prompt("Atividade:"); if(a) { projects.find(x=>x.id===currentProjId).raci.push({a,r:'X',ac:'',c:'',i:''}); window.save(); window.renderGov(); }}
window.delRaci = function(i) { projects.find(x=>x.id===currentProjId).raci.splice(i,1); window.save(); window.renderGov(); }
window.loadCanvas = function() { const p = projects.find(x=>x.id===currentProjId); document.getElementById('cv-pain').value = p.canvas.pain; document.getElementById('cv-obj').value = p.canvas.obj; document.getElementById('cv-out-name').innerText = p.name; document.getElementById('cv-out-pain').innerText = p.canvas.pain; document.getElementById('cv-out-obj').innerText = p.canvas.obj; const last = p.sCurve[p.sCurve.length-1]; document.getElementById('cv-out-fin').innerText = window.formatCurrency(last.plan); document.getElementById('cv-out-dev').innerText = window.formatCurrency(last.plan - last.real); }
window.saveCanvas = function() { const p = projects.find(x=>x.id===currentProjId); p.canvas.pain = document.getElementById('cv-pain').value; p.canvas.obj = document.getElementById('cv-obj').value; window.save(); window.loadCanvas(); }
window.openProjectModal = function() { document.getElementById('modal-project').classList.remove('hidden'); }
window.openDailyModal = function() { document.getElementById('modal-daily').classList.remove('hidden'); }
window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); }
window.startTimer = function() { let sec = 900; if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { sec--; document.getElementById('timer').innerText = `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`; if(sec<=0) clearInterval(timerInterval); }, 1000); }
window.filterLogo = function(c) { activeLogoFilter = c; window.renderPortfolio(); }
window.filterByName = function() { const val = document.getElementById('text-filter').value; window.filterLogo(val); }

window.renderFilters = function() {
    const cont = document.getElementById('logo-filters');
    const clients = [...new Set(projects.map(p=>p.client))];
    let html = `<button onclick="window.filterLogo('all')" class="logo-filter-btn active bg-white p-2 rounded shadow-sm w-20 text-center mr-2"><i class="fas fa-globe text-xl text-slate-400"></i><div class="text-[10px] mt-1 font-bold">Todos</div></button>`;
    clients.forEach(c => {
        const p = projects.find(x=>x.client===c);
        html += `<button onclick="window.filterLogo('${c}')" class="logo-filter-btn bg-white p-2 rounded shadow-sm w-20 text-center mr-2"><i class="${p.logo} text-xl text-slate-600"></i><div class="text-[10px] mt-1 font-bold truncate">${c}</div></button>`;
    });
    cont.innerHTML = html;

    const sel = document.getElementById('text-filter');
    sel.innerHTML = '<option value="all">Todos os Clientes</option>';
    clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.innerText = c;
        sel.appendChild(opt);
    });
}