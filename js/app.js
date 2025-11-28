const supabaseClient = window.supabase.createClient(PMO_CONFIG.SUPABASE_URL, PMO_CONFIG.SUPABASE_KEY);

let projects = [];
let currentProjId = null;
let activeLogoFilter = 'all';
let chartInstance = null;
let timerInterval = null;

const phases = {
    's2d': ['Check-in Comercial', 'Repositório Criado', 'Riscos Iniciais'],
    'init': ['Kick-off', 'Stakeholders Mapeados', 'TAP Assinado'],
    'plan': ['Cronograma', 'WBS', 'Plano Financeiro'],
    'exec': ['Desenvolvimento', 'Testes', 'Homologação'],
    'mon': ['Status Report', 'Controle Horas', 'Change Log'],
    'close': ['Aceite Final', 'Lições Aprendidas', 'Encerramento Admin']
};
const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

async function init() {
    try {
        const { data, error } = await supabaseClient.from('projects').select('*');
        if(error) throw error;
        projects = data && data.length > 0 ? data.map(row => row.content) : [];
        
        if (Auth.isAdmin()) {
            document.getElementById('nav-admin').classList.remove('hidden');
        }
    } catch (err) { console.error(err); }
    renderPortfolio();
    renderFilters();
}

async function save() {
    if (currentProjId) {
        const p = projects.find(x => x.id === currentProjId);
        await supabaseClient.from('projects').upsert({ id: p.id, content: p });
    } else {
        for(const p of projects) await supabaseClient.from('projects').upsert({ id: p.id, content: p });
    }
}

// ADMIN VIEW
function renderAdminView() {
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

    new Chart(ctx1, { type: 'bar', data: { labels: Object.keys(clients), datasets: [{ label: 'Investimento (R$)', data: Object.values(clients), backgroundColor: '#3b82f6' }] } });
    new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(models), datasets: [{ data: Object.values(models), backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'] }] } });
}

// MATRIZ DE RISCO
function renderRiskMatrix() {
    const p = projects.find(x => x.id === currentProjId);
    const list = document.getElementById('risk-list');
    list.innerHTML = '';
    document.querySelectorAll('.risk-cell').forEach(c => c.innerHTML = '');

    if(!p.risks) p.risks = [];

    p.risks.forEach((r, idx) => {
        if(r.type === 'issue') return; // Pula se já virou issue

        const score = PMO_Metrics.calcularScoreRisco(r.prob, r.imp);
        const color = score >= 6 ? 'text-red-600' : (score >= 3 ? 'text-amber-600' : 'text-green-600');
        
        list.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-slate-50 border rounded text-xs">
                <div><span class="font-bold ${color}">[${score}]</span> ${r.desc}</div>
                <button onclick="turnIssue(${idx})" class="text-[10px] bg-white border px-2 py-1 hover:bg-red-50 text-red-500">Virar Issue</button>
            </div>`;

        const cellId = `cell-${r.prob}-${r.imp}`;
        const cell = document.getElementById(cellId);
        if(cell) cell.innerHTML += `<div class="risk-dot" title="${r.desc}">${idx+1}</div>`;
    });
}

function addRiskMatrix() {
    const desc = document.getElementById('risk-desc').value;
    const prob = parseInt(document.getElementById('risk-prob').value);
    const imp = parseInt(document.getElementById('risk-imp').value);
    
    if(desc) {
        const p = projects.find(x => x.id === currentProjId);
        if(!p.risks) p.risks = [];
        p.risks.push({ desc, prob, imp, type: 'risk' });
        save();
        renderRiskMatrix();
        document.getElementById('risk-desc').value = '';
    }
}

function turnIssue(idx) {
    if(!confirm("Transformar este Risco em Issue (Problema Real)?")) return;
    const p = projects.find(x => x.id === currentProjId);
    p.risks[idx].type = 'issue';
    p.risks[idx].desc = "[ISSUE] " + p.risks[idx].desc;
    save(); renderRiskMatrix();
}

// KANBAN
function renderKanban() {
    const p = projects.find(x => x.id === currentProjId);
    if(!p.kanban) p.kanban = { todo: [], doing: [], done: [] };
    
    ['todo', 'doing', 'done'].forEach(col => {
        const div = document.getElementById('kb-'+col);
        div.innerHTML = '';
        p.kanban[col].forEach((item, idx) => {
            div.innerHTML += `
                <div class="kanban-card" draggable="true" ondragstart="drag(event, '${col}', ${idx})">
                    ${item}
                    <button onclick="delKanban('${col}', ${idx})" class="float-right text-red-300 hover:text-red-500">×</button>
                </div>`;
        });
    });
}
function addKanban(col) {
    const t = prompt("Nova Tarefa:");
    if(t) {
        const p = projects.find(x => x.id === currentProjId);
        if(!p.kanban) p.kanban = { todo: [], doing: [], done: [] };
        p.kanban[col].push(t);
        save(); renderKanban();
    }
}
function delKanban(col, idx) {
    const p = projects.find(x => x.id === currentProjId);
    p.kanban[col].splice(idx, 1);
    save(); renderKanban();
}

// CORE ADAPTADO
function showTab(id) {
    document.querySelectorAll('#view-project-hub > div').forEach(d => d.classList.add('hidden'));
    document.getElementById('view-admin').classList.add('hidden');
    document.querySelectorAll('#project-nav .nav-item').forEach(b => b.classList.remove('active'));
    
    if(id === 'admin') {
        document.getElementById('view-portfolio').classList.add('hidden');
        document.getElementById('view-project-hub').classList.add('hidden');
        document.getElementById('view-admin').classList.remove('hidden');
        renderAdminView();
        return;
    }

    document.getElementById('tab-'+id).classList.remove('hidden');
    document.getElementById('nav-'+id).classList.add('active');
    
    if(id === 'dashboard') renderDashboard();
    if(id === 'info') loadInfoForm();
    if(id === 'financial') renderSCurveInput();
    if(id === 'lifecycle') renderPhase('s2d');
    if(id === 'gantt') renderGantt();
    if(id === 'kanban') renderKanban();
    if(id === 'governance') renderGov();
    if(id === 'canvas') loadCanvas();
    if(id === 'risks') renderRiskMatrix();
}

function openProject(id) {
    currentProjId = id; const p = projects.find(x=>x.id===id);
    document.getElementById('view-portfolio').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-project-hub').classList.remove('hidden');
    document.getElementById('project-nav').classList.remove('hidden');
    document.getElementById('sb-proj-name').innerText = p.name;
    
    const model = p.model || 'tradicional';
    document.getElementById('sb-proj-type').innerText = model.toUpperCase();
    
    if (model === 'agil') {
        document.getElementById('nav-gantt').classList.add('hidden');
        document.getElementById('nav-kanban').classList.remove('hidden');
    } else {
        document.getElementById('nav-gantt').classList.remove('hidden');
        document.getElementById('nav-kanban').classList.add('hidden');
    }

    showTab('dashboard');
}

async function createProject() {
    const name = document.getElementById('np-name').value;
    if (!name) return alert("Nome obrigatório");
    const model = document.getElementById('np-model').value;

    const btn = document.querySelector("button[onclick='createProject()']");
    btn.innerText = "Salvando..."; btn.disabled = true;

    const client = document.getElementById('np-client').value || 'Geral';
    let icon = "fas fa-building"; 
    if (client.toLowerCase().includes("banco")) icon = "fas fa-university";
    
    const newId = Date.now(); 
    const newP = {
        id: newId, name, pm: document.getElementById('np-pm').value || 'Gerente', 
        client, logo: icon, model: model, 
        fin: { setup: 0, sustain: 0 }, 
        info: { hours_plan: 0, hours_real: 0, costmode: 'CAPEX' }, 
        sCurve: Array(12).fill(0).map((_, i) => ({ month: months[i], plan: 0, real: 0 })),
        gantt: [], kanban: { todo: [], doing: [], done: [] },
        risks: [], canvas: { pain: '', obj: '' }, stakeholders: [], raci: [], checks: {}
    };

    projects.push(newP);
    try {
        await supabaseClient.from('projects').upsert({ id: newId, content: newP });
        closeModal('modal-project');
        goToPortfolio();
        renderFilters();
        document.getElementById('np-name').value = '';
    } catch (err) { alert("Erro ao salvar."); } 
    finally { btn.innerText = "Criar"; btn.disabled = false; }
}

// Mantendo as outras funções essenciais
function goToPortfolio() {
    document.getElementById('view-portfolio').classList.remove('hidden');
    document.getElementById('view-project-hub').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('project-nav').classList.add('hidden');
    renderPortfolio();
}
function renderPortfolio() {
    const tb = document.getElementById('portfolio-body'); tb.innerHTML = '';
    if (projects.length === 0) return tb.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Sem projetos.</td></tr>';
    const filtered = activeLogoFilter === 'all' ? projects : projects.filter(p => p.client === activeLogoFilter);
    filtered.forEach(p => {
        const lastReal = p.sCurve?.[p.sCurve.length-1]?.real || 0;
        const info = p.info || {};
        tb.innerHTML += `<tr class="border-b hover:bg-slate-50"><td><div class="flex items-center gap-2"><i class="${p.logo}"></i> <span class="font-bold">${p.client}</span></div></td><td><div class="font-bold">${p.name}</div></td><td><span class="text-xs bg-slate-200 px-2 rounded">${p.model || 'Trad'}</span></td><td><span class="bg-blue-100 text-blue-700 px-2 font-bold text-xs">Ativo</span></td><td><div class="flex gap-1"><div class="traffic-light tl-${info.time||'verde'}"></div><div class="traffic-light tl-${info.cost||'verde'}"></div></div></td><td><div class="text-xs font-bold text-blue-600">${formatCurrency(lastReal)}</div></td><td class="text-right"><button onclick="openProject(${p.id})" class="text-xs border px-2 py-1 rounded hover:bg-slate-100 mr-2">Abrir</button><button onclick="deleteProject(${p.id})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`;
    });
}
function renderDashboard() {
    const p = projects.find(x=>x.id===currentProjId);
    const info = p.info || {};
    document.getElementById('dash-name').innerText = p.name;
    document.getElementById('dash-pm').innerText = p.pm;
    document.getElementById('dash-client').innerText = p.client;
    
    // ... resto do dashboard ...
    const ultimoMesComDados = p.sCurve.filter(m => m.real > 0).pop() || { plan: 0, real: 0 };
    const corFarolCusto = PMO_Metrics.calcularFarolCusto(ultimoMesComDados.plan, ultimoMesComDados.real);
    const corFarolPrazo = PMO_Metrics.calcularFarolPrazo(p.gantt);
    const corFarolHoras = PMO_Metrics.calcularFarolHoras(info.hours_plan, info.hours_real);

    document.getElementById('light-time').className = `traffic-light tl-${corFarolPrazo} mt-1`;
    document.getElementById('light-cost').className = `traffic-light tl-${corFarolCusto} mt-1`;
    document.getElementById('light-hours').className = `traffic-light tl-${corFarolHoras} mt-1`;

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('sCurveChart').getContext('2d');
    chartInstance = new Chart(ctx, { type: 'line', data: { labels: p.sCurve.map(d=>d.month), datasets: [{ label: 'Realizado', data: p.sCurve.map(d=>d.real), borderColor: '#2563eb' }] }, options: { maintainAspectRatio: false } });
}

// Funções de CRUD e UI (Info, Gantt, Finanças, etc) mantidas do v14.4 para brevidade
// Certifique-se de incluir: loadInfoForm, saveProjectInfo, renderGantt, addTaskGantt, renderPhase, toggleCheck, renderSCurveInput, updateSCurve, saveSCurveData, saveMacroFin, renderGov, addStake, delStake, addRaci, delRaci, loadCanvas, saveCanvas, openProjectModal, openDailyModal, closeModal, startTimer, deleteProject, formatCurrency, filterLogo, filterByName.
