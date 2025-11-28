// js/app.js

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
    } catch (err) {
        console.error("Erro Supabase:", err);
    }
    renderPortfolio();
    renderFilters();
}

async function save() {
    if (currentProjId) {
        const p = projects.find(x => x.id === currentProjId);
        await supabaseClient.from('projects').upsert({ id: p.id, content: p });
    } else {
        for(const p of projects) {
            await supabaseClient.from('projects').upsert({ id: p.id, content: p });
        }
    }
}

async function deleteProject(id) {
    if(!confirm("Excluir projeto permanentemente?")) return;
    try {
        await supabaseClient.from('projects').delete().eq('id', id);
        projects = projects.filter(p => p.id !== id);
        renderPortfolio();
        if(currentProjId === id) goToPortfolio();
    } catch (err) { alert("Erro ao excluir."); }
}

function formatCurrency(v) { return BRL.format(v || 0); }

function goToPortfolio() {
    document.getElementById('view-portfolio').classList.remove('hidden');
    document.getElementById('view-project-hub').classList.add('hidden');
    document.getElementById('project-nav').classList.add('hidden');
    activeLogoFilter = 'all'; renderPortfolio();
}
function openProject(id) {
    currentProjId = id; const p = projects.find(x=>x.id===id);
    document.getElementById('view-portfolio').classList.add('hidden');
    document.getElementById('view-project-hub').classList.remove('hidden');
    document.getElementById('project-nav').classList.remove('hidden');
    document.getElementById('sb-proj-name').innerText = p.name;
    showTab('dashboard');
}
function showTab(id) {
    document.querySelectorAll('#view-project-hub > div').forEach(d => d.classList.add('hidden'));
    document.getElementById('tab-'+id).classList.remove('hidden');
    document.querySelectorAll('#project-nav .nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('nav-'+id).classList.add('active');
    
    if(id === 'dashboard') renderDashboard();
    if(id === 'info') loadInfoForm();
    if(id === 'financial') renderSCurveInput();
    if(id === 'lifecycle') renderPhase('s2d');
    if(id === 'gantt') renderGantt();
    if(id === 'governance') renderGov();
    if(id === 'canvas') loadCanvas();
    if(id === 'risks') renderRisks();
}

function renderFilters() {
    const cont = document.getElementById('logo-filters');
    const clients = [...new Set(projects.map(p=>p.client))];
    let html = `<button onclick="filterLogo('all')" class="logo-filter-btn active bg-white p-2 rounded shadow-sm w-20 text-center mr-2"><i class="fas fa-globe text-xl text-slate-400"></i><div class="text-[10px] mt-1 font-bold">Todos</div></button>`;
    clients.forEach(c => {
        const p = projects.find(x=>x.client===c);
        html += `<button onclick="filterLogo('${c}')" class="logo-filter-btn bg-white p-2 rounded shadow-sm w-20 text-center mr-2"><i class="${p.logo} text-xl text-slate-600"></i><div class="text-[10px] mt-1 font-bold truncate">${c}</div></button>`;
    });
    cont.innerHTML = html;
}
function filterLogo(c) { activeLogoFilter = c; renderPortfolio(); }

function renderPortfolio() {
    const tb = document.getElementById('portfolio-body'); tb.innerHTML = '';
    if (projects.length === 0) { tb.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">Sem projetos. Crie um novo.</td></tr>'; return; }

    const filtered = activeLogoFilter === 'all' ? projects : projects.filter(p => p.client === activeLogoFilter);
    let totalRev = 0, critRisk = 0, alerts = 0;

    filtered.forEach(p => {
        const lastReal = p.sCurve?.[p.sCurve.length-1]?.real || 0; totalRev += lastReal;
        if(p.risks.length > 0) critRisk++;
        
        // Verifica status para KPIs gerais
        const info = p.info || {};
        const hoursStatus = PMO_Metrics.calcularFarolHoras(info.hours_plan, info.hours_real);
        if(info.time==='vermelho' || hoursStatus==='vermelho') alerts++;

        tb.innerHTML += `<tr class="border-b hover:bg-slate-50">
            <td><div class="flex items-center gap-2"><i class="${p.logo} text-slate-400"></i> <span class="font-bold">${p.client}</span></div></td>
            <td><div class="font-bold text-slate-800">${p.name}</div><div class="text-xs text-slate-400">${info.pep||'-'}</div></td>
            <td><span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Ativo</span></td>
            <td><div class="flex gap-1">
                <div class="traffic-light tl-${info.time||'verde'}" title="Prazo"></div>
                <div class="traffic-light tl-${info.cost||'verde'}" title="Custo"></div>
                <div class="traffic-light tl-${hoursStatus}" title="Esforço (Horas)"></div>
            </div></td>
            <td><div class="text-xs font-bold text-blue-600">${formatCurrency(lastReal)}</div></td>
            <td class="text-right">
                <button onclick="openProject(${p.id})" class="text-xs border px-2 py-1 rounded hover:bg-slate-100 font-bold text-slate-600">Abrir</button>
                <button onclick="deleteProject(${p.id})" class="ml-2 text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    document.getElementById('kpi-total').innerText = filtered.length;
    document.getElementById('kpi-rev').innerText = formatCurrency(totalRev);
    document.getElementById('kpi-risk').innerText = critRisk;
    document.getElementById('kpi-alerts').innerText = alerts;
}

// --- DASHBOARD ATUALIZADO (AGORA COM HORAS) ---
function renderDashboard() {
    const p = projects.find(x=>x.id===currentProjId);
    const info = p.info || {};
    
    // Cálculos Automáticos
    const ultimoMesComDados = p.sCurve.filter(m => m.real > 0).pop() || { plan: 0, real: 0 };
    const corFarolCusto = PMO_Metrics.calcularFarolCusto(ultimoMesComDados.plan, ultimoMesComDados.real);
    const corFarolPrazo = PMO_Metrics.calcularFarolPrazo(p.gantt);
    const corFarolHoras = PMO_Metrics.calcularFarolHoras(info.hours_plan, info.hours_real); // NOVO

    document.getElementById('dash-name').innerText = p.name;
    document.getElementById('dash-pm').innerText = p.pm;
    document.getElementById('dash-client').innerText = p.client;
    document.getElementById('dash-logo').innerHTML = `<i class="${p.logo}"></i>`;

    // Aplica Cores
    document.getElementById('light-time').className = `traffic-light tl-${corFarolPrazo} mt-1`;
    document.getElementById('light-cost').className = `traffic-light tl-${corFarolCusto} mt-1`;
    document.getElementById('light-hours').className = `traffic-light tl-${corFarolHoras} mt-1`; // NOVO

    // Tooltips
    document.getElementById('tip-time').innerText = "Baseado no Cronograma Gantt";
    document.getElementById('tip-cost').innerText = `Realizado: ${formatCurrency(ultimoMesComDados.real)}`;
    document.getElementById('tip-hours').innerText = `Horas: ${info.hours_real || 0} de ${info.hours_plan || 0}`;

    // Gráfico
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('sCurveChart').getContext('2d');
    chartInstance = new Chart(ctx, { type: 'line', data: { labels: p.sCurve.map(d=>d.month), datasets: [{ label: 'Previsto', data: p.sCurve.map(d=>d.plan), borderColor: '#94a3b8', tension: 0.3 }, { label: 'Realizado', data: p.sCurve.map(d=>d.real), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3 }] }, options: { maintainAspectRatio: false } });
    
    // KPI Macro
    const acumuladoPlan = p.sCurve[p.sCurve.length - 1].plan;
    const acumuladoReal = p.sCurve[p.sCurve.length - 1].real;
    document.getElementById('dash-fin-plan').innerText = formatCurrency(acumuladoPlan);
    document.getElementById('dash-fin-real').innerText = formatCurrency(acumuladoReal);
    const desvio = acumuladoPlan - acumuladoReal;
    const elVar = document.getElementById('dash-fin-var');
    elVar.innerText = formatCurrency(desvio);
    elVar.className = desvio < 0 ? "font-bold text-red-600" : "font-bold text-green-600";
}

// --- INFO FORM ATUALIZADO (CAMPOS DE HORAS) ---
function loadInfoForm() {
    const p = projects.find(x=>x.id===currentProjId); if(!p.info) p.info = {};
    // Carrega campos de texto
    ['client','product','pep','assignee','reporter','costmode'].forEach(f => { 
        document.getElementById('info-'+f).value = p.info[f] || ''; 
    });
    // Carrega campos de horas
    document.getElementById('info-hours-plan').value = p.info.hours_plan || 0;
    document.getElementById('info-hours-real').value = p.info.hours_real || 0;
}

function saveProjectInfo() {
    const p = projects.find(x=>x.id===currentProjId);
    if(!p.info) p.info = {};
    
    ['client','product','pep','assignee','reporter','costmode'].forEach(f => { 
        p.info[f] = document.getElementById('info-'+f).value; 
    });
    
    // Salva horas como número
    p.info.hours_plan = parseFloat(document.getElementById('info-hours-plan').value) || 0;
    p.info.hours_real = parseFloat(document.getElementById('info-hours-real').value) || 0;

    p.client = document.getElementById('info-client').value;
    save(); alert('Dados Salvos!'); renderDashboard();
}

// Funções padrão (mantidas iguais)
function renderGantt() {
    const p = projects.find(x=>x.id===currentProjId);
    const container = document.getElementById('gantt-rows'); container.innerHTML = '';
    container.innerHTML = `<div class="absolute inset-0 grid grid-cols-12 pointer-events-none h-full"><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div><div class="border-r border-slate-100 h-full"></div></div>`;
    p.gantt.forEach(task => {
        const width = (task.end - task.start) * (100/12); const left = task.start * (100/12);
        container.innerHTML += `<div class="relative h-10 flex items-center z-10 mb-2 group"><div class="gantt-bar bg-amber-500 hover:bg-amber-600 text-white shadow-md text-xs font-bold pl-2" style="left: ${left}%; width: ${width}%">${task.name}</div></div>`;
    });
}
function addTaskGantt() { const name = prompt("Nome:"); const start = parseInt(prompt("Mês Início (0-11):")); const end = parseInt(prompt("Mês Fim (0-11):")); if(name) { projects.find(x=>x.id===currentProjId).gantt.push({name, start, end}); save(); renderGantt(); }}
function renderPhase(ph) {
    const p = projects.find(x=>x.id===currentProjId);
    const checklist = phases[ph];
    const titleMap = {'s2d':'S2D', 'init':'Iniciação', 'plan':'Planejamento', 'exec':'Execução', 'mon':'Monitoramento', 'close':'Encerramento'};
    document.getElementById('ph-title').innerText = titleMap[ph];
    document.querySelectorAll('#tab-lifecycle button').forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
    document.getElementById('ph-'+ph).classList.add('bg-indigo-600', 'text-white');
    const div = document.getElementById('ph-checklist'); div.innerHTML = '';
    checklist.forEach((item, i) => {
        const key = ph + '_' + i; const checked = p.checks && p.checks[key] ? 'checked' : '';
        div.innerHTML += `<label class="flex items-center p-3 border rounded bg-white hover:bg-slate-50 cursor-pointer"><input type="checkbox" onchange="toggleCheck('${key}', '${ph}')" ${checked} class="mr-3"> <span class="${checked?'line-through text-slate-400':''}">${item}</span></label>`;
    });
}
function toggleCheck(key, ph) { const p = projects.find(x=>x.id===currentProjId); if(!p.checks) p.checks = {}; p.checks[key] = !p.checks[key]; save(); renderPhase(ph); }
function renderSCurveInput() {
    const p = projects.find(x=>x.id===currentProjId);
    const tbody = document.getElementById('scurve-input-body'); tbody.innerHTML = '';
    p.sCurve.forEach((row, i) => {
        tbody.innerHTML += `<tr class="border-b"><td class="py-2 px-4">${row.month}</td><td class="py-2 px-4"><input type="number" onchange="updateSCurve(${i}, 'plan', this.value)" value="${row.plan}" class="form-input w-32 py-1"></td><td class="py-2 px-4"><input type="number" onchange="updateSCurve(${i}, 'real', this.value)" value="${row.real}" class="form-input w-32 py-1"></td></tr>`;
    });
    document.getElementById('fin-setup').value = p.fin.setup; document.getElementById('fin-sustain').value = p.fin.sustain;
}
function updateSCurve(idx, field, val) { projects.find(x=>x.id===currentProjId).sCurve[idx][field] = parseFloat(val); save(); }
function saveSCurveData() { save(); alert('Gráfico Atualizado!'); }
function saveMacroFin() { const p = projects.find(x=>x.id===currentProjId); p.fin.setup = parseFloat(document.getElementById('fin-setup').value); p.fin.sustain = parseFloat(document.getElementById('fin-sustain').value); save(); alert('Salvo!'); }
function renderGov() {
    const p = projects.find(x=>x.id===currentProjId);
    document.getElementById('stake-body').innerHTML = p.stakeholders.map((s,i)=>`<tr><td>${s.n}</td><td>${s.r}</td><td><button onclick="delStake(${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    document.getElementById('raci-body').innerHTML = p.raci.map((r,i)=>`<tr><td>${r.a}</td><td>${r.r}</td><td>${r.ac}</td><td>${r.c}</td><td>${r.i}</td><td><button onclick="delRaci(${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function addStake() { const n=prompt("Nome:"); if(n) { projects.find(x=>x.id===currentProjId).stakeholders.push({n, r:'-'}); save(); renderGov(); }}
function delStake(i) { projects.find(x=>x.id===currentProjId).stakeholders.splice(i,1); save(); renderGov(); }
function addRaci() { const a=prompt("Atividade:"); if(a) { projects.find(x=>x.id===currentProjId).raci.push({a,r:'X',ac:'',c:'',i:''}); save(); renderGov(); }}
function delRaci(i) { projects.find(x=>x.id===currentProjId).raci.splice(i,1); save(); renderGov(); }
function renderRisks() { const p = projects.find(x=>x.id===currentProjId); document.getElementById('risk-body').innerHTML = p.risks.map((r,i)=>`<tr><td>${r.d}</td><td>${r.i}</td><td><button onclick="delRisk(${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join(''); }
function addRisk() { const d = document.getElementById('risk-in').value; const i = document.getElementById('risk-impact').value; if(d){ projects.find(x=>x.id===currentProjId).risks.push({d,i}); save(); renderRisks(); document.getElementById('risk-in').value=''; }}
function delRisk(i) { projects.find(x=>x.id===currentProjId).risks.splice(i,1); save(); renderRisks(); }
function loadCanvas() {
    const p = projects.find(x=>x.id===currentProjId);
    document.getElementById('cv-pain').value = p.canvas.pain; document.getElementById('cv-obj').value = p.canvas.obj;
    document.getElementById('cv-out-name').innerText = p.name; document.getElementById('cv-out-pain').innerText = p.canvas.pain; document.getElementById('cv-out-obj').innerText = p.canvas.obj;
    const last = p.sCurve[p.sCurve.length-1];
    document.getElementById('cv-out-fin').innerText = formatCurrency(last.plan); document.getElementById('cv-out-dev').innerText = formatCurrency(last.plan - last.real);
}
function saveCanvas() { const p = projects.find(x=>x.id===currentProjId); p.canvas.pain = document.getElementById('cv-pain').value; p.canvas.obj = document.getElementById('cv-obj').value; save(); loadCanvas(); }
function openProjectModal() { document.getElementById('modal-project').classList.remove('hidden'); }
function openDailyModal() { document.getElementById('modal-daily').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function startTimer() { let sec = 900; if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { sec--; document.getElementById('timer').innerText = `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`; if(sec<=0) clearInterval(timerInterval); }, 1000); }

async function createProject() {
    const nameInput = document.getElementById('np-name');
    const pmInput = document.getElementById('np-pm');
    const clientInput = document.getElementById('np-client');
    const name = nameInput.value;
    if (!name) { alert("Nome obrigatório"); return; }

    const btn = document.querySelector("button[onclick='createProject()']");
    btn.innerText = "Salvando..."; btn.disabled = true;

    const client = clientInput.value || 'Geral';
    let icon = "fas fa-building"; 
    if (client.toLowerCase().includes("banco")) icon = "fas fa-university";
    
    const newId = Date.now(); 
    const newP = {
        id: newId, name: name, pm: pmInput.value || 'Gerente', client: client, logo: icon,
        fin: { setup: 0, sustain: 0 }, 
        info: { pep: '', product: '', hours_plan: 0, hours_real: 0, costmode: 'CAPEX' }, // Novos campos aqui
        sCurve: Array(12).fill(0).map((_, i) => ({ month: months[i], plan: 0, real: 0 })),
        gantt: [], risks: [], canvas: { pain: '', obj: '' }, stakeholders: [], raci: [], checks: {}
    };

    projects.push(newP);
    try {
        await supabaseClient.from('projects').upsert({ id: newId, content: newP });
        closeModal('modal-project');
        goToPortfolio();
        renderFilters();
        nameInput.value = ""; pmInput.value = ""; clientInput.value = "";
    } catch (err) { alert("Erro ao salvar."); } 
    finally { btn.innerText = "Criar"; btn.disabled = false; }
}

window.onload = init;
