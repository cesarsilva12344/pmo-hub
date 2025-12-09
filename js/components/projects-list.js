import { AppState } from '../services/state.js';
import { ProjectDetails } from './project-details.js';

export const ProjectsList = {
    render() {
        const projects = AppState.projects;

        // Clear columns
        const cols = ['col-ideia', 'col-analise', 'col-aprovado', 'col-execucao', 'col-entregue'];
        cols.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        projects.forEach(p => {
            const card = this.createCard(p);
            // Simple mapping logic
            let targetId = 'col-ideia'; // default
            const s = (p.status || '').toLowerCase();

            if (s.includes('execução') || s.includes('active') || s.includes('andamento')) targetId = 'col-execucao';
            else if (s.includes('aprovado')) targetId = 'col-aprovado';
            else if (s.includes('entregue') || s.includes('done')) targetId = 'col-entregue';
            else if (s.includes('análise') || s.includes('planning')) targetId = 'col-analise';

            const container = document.getElementById(targetId);
            if (container) container.appendChild(card);
        });
    },

    createCard(project) {
        const div = document.createElement('div');
        div.className = 'bg-white p-3 rounded shadow border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-all';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] uppercase font-bold text-slate-400">${project.client || 'Cliente'}</span>
                <span class="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">${project.type || 'Geral'}</span>
            </div>
            <h4 class="font-bold text-sm text-slate-700 leading-tight mb-2">${project.title || project.name}</h4>
            <div class="flex justify-between items-end">
                <div class="text-xs text-slate-500">
                    <div>💰 ${project.budget ? Number(project.budget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div>
                </div>
                <!-- Avatar placeholder -->
                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                   ${(project.title || project.name).substring(0, 2).toUpperCase()}
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            ProjectDetails.open(project.id);
        });

        return div;
    }
};
