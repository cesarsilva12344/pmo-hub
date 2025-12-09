import { AppState } from '../services/state.js';
import { Kanban } from './kanban.js';
import { GanttChart } from './gantt.js';
import { TaskService } from '../services/task-service.js';
import { Api } from '../services/api.js';
import { AiService } from '../services/ai-service.js';

export const ProjectDetails = {
    // ... (rest of the file until createStatusBadge or renderHeader)

    // We need to target the file content in chunks to avoid replacing too much
    // But since the previous edit failed to add the import, we do it here.
    // And we fix the missing comma.

    // Actually, I cannot replace the whole file.
    // I will do it in 2 steps or careful chunks.

    // Step 1: Add Imports (Lines 1-5 already shown)
    // Step 2: Add Button (renderHeader)
    // Step 3: Fix Comma (openNewTaskModal)

    // Let's try to just fix the comma and add the method properly first? 
    // No, I need the imports for it to work.

    // Let's do imports first.

    currentProjectId: null,

    init() {
        // Tab switching
        const tabs = document.querySelectorAll('.pd-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                // Update UI
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-blue-600', 'border-blue-600');
                    t.classList.add('border-transparent');
                });
                tab.classList.add('active', 'text-blue-600', 'border-blue-600');
                tab.classList.remove('border-transparent');

                document.querySelectorAll('.pd-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(target).classList.remove('hidden');

                // Trigger Gantt render if tab is active
                if (target === 'pd-gantt') {
                    GanttChart.render(ProjectDetails.currentProjectId, 'pd-gantt-chart');
                }
            });
        });

        // Back button
        const btnBack = document.getElementById('btn-back-projects');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                document.getElementById('view-project-details').classList.add('hidden');
                document.getElementById('view-projects').classList.remove('hidden');
            });
        }
    },

    async open(projectId) {
        this.currentProjectId = projectId;

        // Hide all views, show details
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById('view-project-details').classList.remove('hidden');

        // Load project data
        const project = AppState.projects.find(p => p.id === projectId);
        if (project) {
            // Calculate Progress
            const tasks = await TaskService.getTasks(projectId);
            const total = tasks.length;
            const done = tasks.filter(t => t.status === 'done').length;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            this.renderHeader(project, progress);
        }

        // Render Kanban (Default)
        await Kanban.render(projectId);

        // Render List (in background)
        this.renderList(projectId);
    },

    renderHeader(project, progress) {
        const headerContainer = document.querySelector('#view-project-details header');
        if (!headerContainer) return;

        // Date Formatting
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/D';
            return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        headerContainer.innerHTML = `
            <div class="w-full">
                <!-- Top Row: Nav & Status -->
                <div class="flex justify-between items-center mb-6">
                     <div class="flex items-center gap-2">
                        <button id="btn-back-projects" class="text-slate-400 hover:text-slate-600 transition-colors">
                            <span class="text-lg">←</span> Voltar
                        </button>
                    </div>
                     <div class="flex gap-3">
                         <button class="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 font-medium text-sm transition-colors flex items-center gap-2" onclick="ProjectDetails.generateAiReport()">
                            <span>✨</span> Gerar Status Report
                         </button>
                         <button class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2" onclick="ProjectDetails.openNewTaskModal()">
                            <span>+</span> Nova Tarefa
                         </button>
                    </div>
                </div>

                <!-- Main Info Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    
                    <!-- Area 1: Project Identity (5 cols) -->
                    <div class="lg:col-span-5 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">${project.client || 'CLIENTE'}</span>
                                <span class="font-mono text-xs text-slate-400">${project.pep || 'SEM PEP'}</span>
                            </div>
                            <h1 class="text-3xl font-bold text-slate-800 leading-tight mb-2">${project.title || project.name}</h1>
                            <p class="text-sm text-slate-500 line-clamp-2">${project.description || 'Sem descrição definida.'}</p>
                        </div>
                    </div>

                    <!-- Area 2: Health Checks (Faróis) (4 cols) -->
                    <div class="lg:col-span-4 flex items-center justify-around gap-2 bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        ${this.createStatusBadge(project.health_scope, 'Escopo')}
                        <div class="w-px h-8 bg-slate-100"></div>
                        ${this.createStatusBadge(project.health_cost, 'Custo')}
                        <div class="w-px h-8 bg-slate-100"></div>
                        ${this.createStatusBadge(project.health_time, 'Prazo')}
                    </div>

                    <!-- Area 3: KPIs & Dates (3 cols) -->
                    <div class="lg:col-span-3 flex flex-col justify-center space-y-4 pl-4">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-400 uppercase font-bold">Go-Live</span>
                            <span class="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-sm">
                                🚀 ${formatDate(project.go_live_date)}
                            </span>
                        </div>
                         <div class="flex justify-between items-center">
                            <span class="text-xs text-slate-400 uppercase font-bold">Estimado</span>
                            <span class="text-sm font-medium text-slate-600">${project.total_estimated_hours || 0}h</span>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span class="font-bold text-slate-500">Progresso</span>
                                <span class="font-bold text-blue-600">${progress}%</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Re-bind Back Button
        document.getElementById('btn-back-projects').addEventListener('click', () => {
            document.getElementById('view-project-details').classList.add('hidden');
            document.getElementById('view-projects').classList.remove('hidden');
        });
    },

    createStatusBadge(status = 'green', label) {
        const styles = {
            green: { css: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'bg-emerald-500', ping: 'bg-emerald-400' },
            yellow: { css: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'bg-amber-500', ping: 'bg-amber-400' },
            red: { css: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'bg-rose-500', ping: 'bg-rose-400' }
        };

        const current = styles[status] || styles.green;

        return `
            <div class="flex flex-col items-center gap-1 min-w-[80px]">
                <span class="text-[10px] lowercase text-slate-400 font-medium">${label}</span>
                <span class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${current.css} shadow-sm transition-all hover:scale-105 select-none cursor-help" title="Status: ${status}">
                     <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.ping}"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 ${current.icon}"></span>
                    </span>
                    <span class="capitalize">${status === 'green' ? 'OK' : (status === 'red' ? 'Crítico' : 'Atenção')}</span>
                </span>
            </div>
        `;
    },

    async renderList(projectId) {
        const tasks = await TaskService.getTasks(projectId);
        const tbody = document.getElementById('pd-task-list-body');
        if (!tbody) return;

        tbody.innerHTML = tasks.map(t => `
            <tr class="border-b hover:bg-slate-50">
                <td class="py-3 px-4 font-medium">${t.title}</td>
                <td class="py-3 px-4">
                    <span class="text-xs font-bold uppercase ${this.getPriorityColor(t.priority)} px-2 py-1 rounded">
                        ${t.priority}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-slate-500">${t.status}</td>
                <td class="py-3 px-4 text-right">
                    <button class="text-red-500 hover:text-red-700" onclick="Kanban.delete('${t.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    },

    getPriorityColor(priority) {
        const map = {
            'low': 'bg-slate-100 text-slate-600',
            'medium': 'bg-blue-100 text-blue-600',
            'high': 'bg-orange-100 text-orange-600',
            'critical': 'bg-red-100 text-red-600'
        };
        return map[priority] || 'bg-slate-100';
    },

    openNewTaskModal() {
        const title = prompt("Título da nova tarefa:");
        if (title) {
            TaskService.createTask({
                project_id: this.currentProjectId,
                title: title,
                status: 'todo',
                priority: 'medium'
            }).then(() => {
                this.open(this.currentProjectId); // Reload
            });
        }
    },

    async generateAiReport() {
        const project = AppState.projects.find(p => p.id === this.currentProjectId);
        if (!project) return;

        const tasks = await TaskService.getTasks(this.currentProjectId);

        // Show Modal Loading
        const modal = document.getElementById('ai-modal');
        const loading = document.getElementById('ai-loading');
        const result = document.getElementById('ai-result');

        modal.classList.remove('hidden');
        loading.classList.remove('hidden');
        result.classList.add('hidden');

        // Call AI
        const insights = await AiService.generateStatusReport(project, tasks);

        loading.classList.add('hidden');
        if (insights) {
            result.classList.remove('hidden');
            document.getElementById('ai-summary').innerText = insights.summary;
            document.getElementById('ai-risks').innerText = insights.risks;
            document.getElementById('ai-recommendation').innerText = insights.recommendation;
        } else {
            modal.classList.add('hidden'); // Close if failed/cancelled
        }
    }
};

window.ProjectDetails = ProjectDetails;
