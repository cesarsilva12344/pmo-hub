import { AppState } from '../services/state.js';
import { ProjectDetails } from './project-details.js';

export const ProjectsList = {
    currentGroup: 'status',

    init() {
        // Bind Filter
        const filter = document.getElementById('project-group-filter');
        if (filter) {
            filter.addEventListener('change', (e) => {
                this.currentGroup = e.target.value;
                this.render();
            });
        }
    },

    render() {
        const projects = AppState.projects;
        const container = document.getElementById('projects-view-container');
        if (!container) return;

        container.innerHTML = '';

        // Grouping Logic
        const groups = this.groupProjects(projects, this.currentGroup);

        // Render Groups
        Object.keys(groups).forEach(groupName => {
            const col = document.createElement('div');
            col.className = 'kanban-col flex flex-col gap-3 min-w-[300px] bg-slate-100 p-4 rounded-lg';

            col.innerHTML = `
                <h3 class="font-bold text-slate-600 uppercase text-xs tracking-wider flex justify-between">
                    ${groupName}
                    <span class="bg-slate-200 text-slate-600 px-2 rounded-full text-[10px]">${groups[groupName].length}</span>
                </h3>
            `;

            groups[groupName].forEach(p => {
                const card = this.createCard(p);
                col.appendChild(card);
            });

            container.appendChild(col);
        });
    },

    groupProjects(projects, key) {
        const groups = {};

        if (key === 'status') {
            // Preseted Order for Status
            groups['Ideia'] = [];
            groups['Em Análise'] = []; // Maps to "Em Planejamento" usually
            groups['Em Andamento'] = [];
            groups['Concluído'] = [];

            projects.forEach(p => {
                let s = (p.status || 'Ideia');
                // Normalize
                if (s.match(/planejamento|análise/i)) s = 'Em Análise';
                else if (s.match(/execução|active|andamento/i)) s = 'Em Andamento';
                else if (s.match(/entregue|done|concluído|sucesso/i)) s = 'Concluído';
                else s = 'Ideia';

                if (!groups[s]) groups[s] = [];
                groups[s].push(p);
            });
            return groups;
        }

        // Generic Grouping (Client, Manager)
        projects.forEach(p => {
            let val = p[key] || 'Não Definido';
            // Handle nested or specific mapping if needed
            if (key === 'manager' && !p.manager) val = 'Sem Gerente';

            if (!groups[val]) groups[val] = [];
            groups[val].push(p);
        });

        return groups;
    },

    createCard(project) {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-all relative group';

        // Health Indicator
        const healthColor = this.getHealthColor(project);

        // Budget Display
        const budget = project.budget_total || project.budget || 0;

        div.innerHTML = `
            <div class="absolute top-2 right-2 w-2 h-2 rounded-full ${healthColor}"></div>
            
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">${project.client || 'Cliente'}</span>
            </div>
            
            <h4 class="font-bold text-sm text-slate-800 leading-tight mb-3">${project.name || project.title}</h4>
            
            <div class="flex justify-between items-center border-t border-gray-50 pt-2 mt-2">
                <div class="text-xs text-slate-500 font-mono">
                    ${Number(budget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                
                <div class="flex -space-x-1">
                     <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                        ${(project.name || project.title || 'NP').substring(0, 2).toUpperCase()}
                     </div>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-100 rounded-full h-1 mt-3">
                <div class="bg-blue-600 h-1 rounded-full" style="width: ${project.progress || 0}%"></div>
            </div>
        `;

        div.addEventListener('click', () => {
            ProjectDetails.open(project.id);
        });

        return div;
    },

    getHealthColor(p) {
        // 1. Try DB Columns (Green/Red/Amber strings)
        if (p.health_time === 'vermelho' || p.health_cost === 'vermelho' || p.health_scope === 'fora_empresa') return 'bg-red-500';
        if (p.health_time === 'amarelo' || p.health_cost === 'amarelo') return 'bg-yellow-500';
        if (p.health_time === 'verde') return 'bg-green-500';

        // 2. Legacy fallback
        if (!p.risks || p.risks.length === 0) return 'bg-green-500';
        const critical = p.risks.some(r => (r.prob * r.impact) > 15);
        return critical ? 'bg-red-500' : 'bg-yellow-500';
    }
};
