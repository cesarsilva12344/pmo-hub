import { Auth } from './auth.js';
import { Metrics } from './metrics.js';

console.log('PMO Hub v15.1 Loaded');

// --- Project Factory Pattern ---
const ProjectFactory = {
    createProject: (type, name, client, budget) => {
        const baseProject = {
            id: crypto.randomUUID(),
            name,
            client,
            budget,
            spent: 0,
            startDate: new Date().toISOString().split('T')[0],
            status: 'Em Planejamento',
            risks: [],
            team: [],
            allocations: [] // Array of { resourceId, role, hours }
        };

        switch (type) {
            case 'traditional':
                return { ...baseProject, methodology: 'Cascata', tools: ['Gantt', 'EAP', 'EVM'] };
            case 'agile':
                return { ...baseProject, methodology: 'Agile', tools: ['Kanban', 'Backlog', 'Burndown'] };
            case 'quick':
                return { ...baseProject, methodology: 'Ganho Rápido', tools: ['Checklist', 'Kanban Lite'] };
            default:
                return baseProject;
        }
    }
};

// --- State Management ---
const AppState = {
    projects: [],
    demands: [], // Pipeline Items
    reports: [], // Status Reports
    resources: [], // Team Members

    loadProjects: async () => {
        // Mock Data
        if (AppState.projects.length === 0) {
            AppState.projects = [
                ProjectFactory.createProject('traditional', 'Implantação ERP', 'Acme Corp', 500000),
                ProjectFactory.createProject('agile', 'App Mobile V2', 'Tech Solutions', 150000),
                ProjectFactory.createProject('quick', 'Campanha Marketing', 'Retail SA', 20000)
            ];

            // Mock Stats
            AppState.projects[0].spent = 120000;
            AppState.projects[0].status = 'Em Execução';
            AppState.projects[0].risks = [
                { title: 'Atraso Fornecedor', prob: 4, impact: 5 }, // Critical
                { title: 'Mudança Escopo', prob: 3, impact: 3 }    // Med
            ];
            AppState.projects[0].allocations = [
                { resourceId: 1, role: 'GP', hours: 40 },
                { resourceId: 2, role: 'Dev', hours: 80 }
            ];

            AppState.projects[1].spent = 145000;
            AppState.projects[1].status = 'Em Risco';
            AppState.projects[1].risks = [
                { title: 'Bug Crítico', prob: 5, impact: 5 } // Critical
            ];
            AppState.projects[1].allocations = [
                { resourceId: 2, role: 'Dev', hours: 120 }, // Overload (80+120=200)
                { resourceId: 3, role: 'QA', hours: 40 }
            ];

            // Mock Demands
            AppState.demands = [
                { id: 1, title: 'Upgrade Servidores', status: 'ideia', score: 8 },
                { id: 2, title: 'Nova Intranet', status: 'analise', score: 5 },
                { id: 3, title: 'Migração Cloud', status: 'aprovado', score: 9 }
            ];

            // Mock Reports
            AppState.reports = [
                { date: '2025-12-01', projectName: 'Implantação ERP', health: 'green', author: 'Ana Silva', link: '#' },
                { date: '2025-12-01', projectName: 'App Mobile V2', health: 'yellow', author: 'Carlos Manager', link: '#' }
            ];

            // Mock Resources
            AppState.resources = [
                { id: 1, name: 'Ana Silva', role: 'Gerente de Projetos', capacity: 160, avatar: 'AS' },
                { id: 2, name: 'Carlos Dev', role: 'Desenvolvedor Fullstack', capacity: 160, avatar: 'CD' },
                { id: 3, name: 'Julia QA', role: 'Analista de Qualidade', capacity: 160, avatar: 'JQ' }
            ];
        }
        AppState.renderDashboard();
    },

    addProject: (type, name, client, budget) => {
        const newProject = ProjectFactory.createProject(type, name, client, budget);
        AppState.projects.push(newProject);
        AppState.renderDashboard();
        return newProject;
    },

    renderDashboard: () => {
        const totalProjects = AppState.projects.length;
        const totalBudget = AppState.projects.reduce((sum, p) => sum + p.budget, 0);

        // Update KPIs
        const totalEl = document.getElementById('kpi-total-projects');
        if (totalEl) totalEl.innerText = totalProjects;

        const riskCount = AppState.projects.filter(p => Metrics.calculateWeightedHealth(p).status === 'Crítico').length;
        const riskEl = document.getElementById('kpi-risk-projects');
        if (riskEl) riskEl.innerText = riskCount;

        const budgetEl = document.getElementById('kpi-budget');
        if (budgetEl) budgetEl.innerText = `R$ ${(totalBudget / 1000).toFixed(1)}k`;

        updateChartInvestment();
        updateChartHealth();
    }
};

// --- Chart Functions ---
function updateChartInvestment() {
    const clients = {};
    AppState.projects.forEach(p => {
        if (!clients[p.client]) clients[p.client] = 0;
        clients[p.client] += p.budget;
    });

    const options = {
        series: [{ name: 'Investimento', data: Object.values(clients) }],
        chart: { type: 'bar', height: 250, toolbar: { show: false } },
        xaxis: { categories: Object.keys(clients) }
    };

    const chartEl = document.querySelector("#chart-investment");
    if (chartEl) {
        chartEl.innerHTML = "";
        const chart = new ApexCharts(chartEl, options);
        chart.render();
    }
}

function updateChartHealth() {
    let healthCounts = { green: 0, yellow: 0, red: 0 };
    AppState.projects.forEach(p => {
        const health = Metrics.calculateHealth(p); // Legacy check for chart default
        const wHealth = Metrics.calculateWeightedHealth(p);

        if (wHealth.status === 'Otimizado') healthCounts.green++;
        else if (wHealth.status === 'Atenção') healthCounts.yellow++;
        else healthCounts.red++;
    });

    const options = {
        series: [healthCounts.green, healthCounts.yellow, healthCounts.red],
        labels: ['Otimizado', 'Atenção', 'Crítico'],
        colors: ['#10B981', '#F59E0B', '#EF4444'],
        chart: { type: 'donut', height: 250 },
        legend: { position: 'bottom' }
    };

    const chartEl = document.querySelector("#chart-health");
    if (chartEl) {
        chartEl.innerHTML = "";
        const chart = new ApexCharts(chartEl, options);
        chart.render();
    }
}

// --- View Logic ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('nav a').forEach(el => {
        el.classList.remove('bg-slate-800', 'text-white');
        el.classList.add('text-slate-300');
    });

    const activeSection = document.getElementById(`view-${viewId}`);
    if (activeSection) activeSection.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) {
        activeNav.classList.add('bg-slate-800', 'text-white');
        activeNav.classList.remove('text-slate-300');
    }

    if (viewId === 'risks') renderRiskMatrix();
    if (viewId === 'projects') renderPipeline();
    if (viewId === 'financial') renderFinancial();
    if (viewId === 'resources') renderResources();
}

// --- Feature: Risk Matrix ---
function renderRiskMatrix() {
    const matrixEl = document.getElementById('risk-matrix');
    const listEl = document.getElementById('risk-list');
    if (!matrixEl) return;

    matrixEl.innerHTML = '';
    if (listEl) listEl.innerHTML = '';

    // 5x5 Grid
    for (let y = 5; y >= 1; y--) {
        for (let x = 1; x <= 5; x++) {
            const cell = document.createElement('div');
            cell.className = 'risk-cell w-full h-full';

            const score = x * y;
            if (score >= 15) cell.classList.add('bg-risk-crit');
            else if (score >= 10) cell.classList.add('bg-risk-high');
            else if (score >= 5) cell.classList.add('bg-risk-med');
            else cell.classList.add('bg-risk-low');

            AppState.projects.forEach(p => {
                if (p.risks) {
                    p.risks.forEach(r => {
                        if (r.prob === y && r.impact === x) {
                            const dot = document.createElement('div');
                            dot.className = 'risk-dot';
                            dot.title = `${p.name}: ${r.title}`;
                            cell.appendChild(dot);

                            // Add to list if critical
                            if (score >= 15 && listEl) {
                                const item = document.createElement('div');
                                item.className = 'p-2 border-l-4 border-red-800 bg-red-50 text-sm';
                                item.innerHTML = `<strong>${p.name}</strong>: ${r.title}`;
                                listEl.appendChild(item);
                            }
                        }
                    });
                }
            });
            matrixEl.appendChild(cell);
        }
    }
}

// --- Feature: Pipeline (Simple Kanban) ---
function renderPipeline() {
    const cols = {
        'ideia': document.getElementById('col-ideia'),
        'analise': document.getElementById('col-analise'),
        'aprovado': document.getElementById('col-aprovado')
    };

    Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

    AppState.demands.forEach(d => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
            <div class="font-bold text-gray-800">${d.title}</div>
            <div class="text-xs text-gray-400 mt-1">Score: ${d.score}</div>
        `;

        if (cols[d.status]) cols[d.status].appendChild(card);
    });
}

// --- Feature: Financial Module (Phase 2 + AI) ---
function renderFinancial() {
    const listEl = document.getElementById('financial-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    AppState.projects.forEach(p => {
        const forecast = Metrics.calculateForecast(p);
        const tr = document.createElement('tr');
        tr.className = 'border-b';

        const statusColor = forecast.variance >= 0 ? 'text-green-600' : 'text-red-600';

        tr.innerHTML = `
            <td class="py-3 font-medium">${p.name}</td>
            <td class="py-3">R$ ${p.budget.toLocaleString()}</td>
            <td class="py-3">R$ ${p.spent.toLocaleString()}</td>
            <td class="py-3 font-bold">R$ ${Math.round(forecast.eac).toLocaleString()}</td>
            <td class="py-3 ${statusColor}">${forecast.status} (CPI: ${forecast.cpi})</td>
            <td class="py-3">
                <button class="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 btn-ai-analyze" data-id="${p.id}">
                    ✨ AI
                </button>
            </td>
        `;
        listEl.appendChild(tr);
    });

    // Bind AI Buttons
    document.querySelectorAll('.btn-ai-analyze').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pid = e.currentTarget.dataset.id;
            const project = AppState.projects.find(p => p.id == pid || p.id === pid);
            if (project) openAIModal(project);
        });
    });
}

// --- Feature: Resource Management (Phase 2) ---
function renderResources() {
    const gridEl = document.getElementById('resource-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    AppState.resources.forEach(res => {
        let totalHours = 0;
        let projects = [];

        AppState.projects.forEach(p => {
            const alloc = p.allocations?.find(a => a.resourceId === res.id);
            if (alloc) {
                totalHours += alloc.hours;
                projects.push(`${p.name} (${alloc.hours}h)`);
            }
        });

        const loadPct = Math.round((totalHours / res.capacity) * 100);
        let barColor = 'bg-green-500';
        if (loadPct > 100) barColor = 'bg-red-500';
        else if (loadPct > 80) barColor = 'bg-yellow-500';

        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow border border-slate-200';
        card.innerHTML = `
            <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    ${res.avatar}
                </div>
                <div>
                    <h4 class="font-bold text-lg">${res.name}</h4>
                    <p class="text-xs text-slate-500">${res.role}</p>
                </div>
            </div>
            
            <div class="mb-2 flex justify-between text-sm">
                <span>Carga: ${loadPct}%</span>
                <span class="text-slate-500">${totalHours}/${res.capacity}h</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 mb-4">
                <div class="${barColor} h-2.5 rounded-full" style="width: ${Math.min(loadPct, 100)}%"></div>
            </div>

            <h5 class="text-xs font-bold text-slate-400 uppercase mb-2">Alocações</h5>
            <div class="space-y-1 text-sm text-slate-600">
                ${projects.map(p => `<div>• ${p}</div>`).join('') || '<div class="italic">Disponível</div>'}
            </div>
        `;
        gridEl.appendChild(card);
    });
}

// --- Feature: Status Reports (Updated with Weighted Health) ---
function generateStatusReport() {
    const today = new Date().toISOString().split('T')[0];
    const newReports = AppState.projects.map(p => {
        const h = Metrics.calculateWeightedHealth(p);
        return {
            date: today,
            projectName: p.name,
            health: h.status,
            color: h.color,
            author: 'Sistema (Auto)',
            link: '#'
        };
    });

    if (!AppState.reports) AppState.reports = [];
    AppState.reports.unshift(...newReports);

    renderReports();
    alert(`Gerados ${newReports.length} reports com sucesso!`);
}

function renderReports() {
    const listEl = document.getElementById('report-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    AppState.reports.forEach(r => {
        const healthClass = r.color || (r.health === 'Crítico' ? 'text-red-600' : (r.health === 'Atenção' ? 'text-yellow-600' : 'text-green-600'));

        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="py-3">${r.date}</td>
            <td class="py-3 font-medium">${r.projectName}</td>
            <td class="py-3 ${healthClass} font-bold uppercase text-xs">${r.health}</td>
            <td class="py-3">${r.author}</td>
            <td class="py-3"><a href="#" class="text-blue-600 hover:underline">Baixar PDF</a></td>
        `;
        listEl.appendChild(tr);
    });
}

// --- AI Service Mock (Phase 3) ---
const AIService = {
    analyze: async (project) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const health = Metrics.calculateWeightedHealth(project);
                resolve({
                    summary: `O projeto **${project.name}** possui um Health Score de **${health.score}/100** (${health.status}).`,
                    risks: project.risks.length > 0 ? `Identificados ${project.risks.length} risco(s) monitorado(s). Impacto da qualidade de dados é ${health.details.length > 0 ? 'alto' : 'baixo'}.` : "Nenhum risco crítico mapeado.",
                    recommendation: health.score < 60 ? "🚨 Ação Imediata: Revisar baseline de custos e mitigar riscos críticos." :
                        (health.score < 80 ? "⚠️ Atenção: Monitorar tendência de CPI semanalmente." : "✅ Manter ritmo atual e validar entregas com stakeholders.")
                });
            }, 1000); // Simulate Latency
        });
    }
};

// --- AI UI Logic ---
function openAIModal(project) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-modal-content');
    const loading = document.getElementById('ai-loading');
    const result = document.getElementById('ai-result');

    if (!modal || !content) return;

    // Reset State
    modal.classList.remove('hidden');
    // Force reflow for transition
    void modal.offsetWidth;
    content.classList.remove('scale-95', 'opacity-0');

    loading.classList.remove('hidden');
    result.classList.add('hidden');

    // Call Mock AI
    AIService.analyze(project).then(analysis => {
        loading.classList.add('hidden');
        result.classList.remove('hidden');

        document.getElementById('ai-summary').innerHTML = analysis.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        document.getElementById('ai-risks').innerText = analysis.risks;
        document.getElementById('ai-recommendation').innerText = analysis.recommendation;
    });

    // Close Handler
    const btnClose = document.getElementById('btn-close-ai');
    btnClose.onclick = () => {
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    };
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    ['dashboard', 'risks', 'projects', 'admin', 'financial', 'resources'].forEach(view => {
        const link = document.getElementById(`nav-${view}`);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchView(view);
            });
        }
    });

    // Initial Load
    if (window.location.pathname.includes('index.html')) {
        AppState.loadProjects().then(() => {
            renderReports();
        });
    }

    // Bindings
    const btnNew = document.getElementById('btn-new-project');
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            const name = prompt("Nome do Projeto:");
            if (name) AppState.addProject('traditional', name, 'Demo', 10000);
        });
    }

    const btnRep = document.getElementById('btn-gen-report');
    if (btnRep) {
        btnRep.addEventListener('click', () => {
            generateStatusReport();
        });
    }

    // Check for user session
    Auth.requireAuth();

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});
