import { TaskService } from '../services/task-service.js';
import { Api } from '../services/api.js';

export const Kanban = {
    currentProjectId: null,

    async render(projectId) {
        this.currentProjectId = projectId;
        const container = document.getElementById('kanban-board-container'); // Need to create this in HTML
        if (!container) return;

        container.innerHTML = '<div class="text-center py-4">Carregando tarefas...</div>';

        const tasks = await TaskService.getTasks(projectId);

        const columns = {
            'todo': { title: 'A Fazer', color: 'border-slate-300' },
            'in_progress': { title: 'Em Andamento', color: 'border-blue-400' },
            'review': { title: 'Revisão', color: 'border-yellow-400' },
            'done': { title: 'Concluído', color: 'border-green-400' }
        };

        let html = '<div class="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">';

        for (const [key, config] of Object.entries(columns)) {
            const colTasks = tasks.filter(t => t.status === key);
            html += `
                <div class="kanban-col flex flex-col h-full bg-slate-50 rounded-xl p-4 border-t-4 ${config.color}" data-status="${key}">
                    <h3 class="font-bold text-slate-700 mb-4 flex justify-between items-center">
                        ${config.title}
                        <span class="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">${colTasks.length}</span>
                    </h3>
                    <div class="kanban-list flex-1 space-y-3 overflow-y-auto min-h-[200px]" id="col-${key}">
                        ${colTasks.map(t => this.createCardHtml(t)).join('')}
                    </div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;

        this.initDragAndDrop();
    },

    createCardHtml(task) {
        const priorityColors = {
            'low': 'border-l-blue-400',
            'medium': 'border-l-gray-400',
            'high': 'border-l-orange-400',
            'critical': 'border-l-red-500'
        };

        const priorityLabels = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta',
            'critical': 'Crítica'
        };

        const borderColor = priorityColors[task.priority] || 'border-l-gray-400';
        const label = priorityLabels[task.priority] || task.priority;

        return `
            <div class="kanban-card bg-white p-4 rounded shadow-sm border border-slate-200 border-l-4 ${borderColor} cursor-grab hover:shadow-md transition-shadow group" data-id="${task.id}">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${label}</span>
                    <button class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500" onclick="Kanban.delete('${task.id}')">×</button>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-2">${task.title}</h4>
                ${task.assignee_id ? '<div class="text-xs text-slate-500 flex items-center gap-1">👤 Alocado</div>' : ''}
                <div class="mt-3 flex justify-between items-center text-xs text-slate-400">
                     <span>${task.estimated_hours ? task.estimated_hours + 'h' : '-'}</span>
                     <span>#${task.order}</span>
                </div>
            </div>
        `;
    },

    initDragAndDrop() {
        const cols = document.querySelectorAll('.kanban-list');
        cols.forEach(col => {
            new Sortable(col, {
                group: 'kanban', // set both lists to same group
                animation: 150,
                ghostClass: 'bg-blue-50',
                onEnd: async (evt) => {
                    const itemEl = evt.item;
                    const newStatus = evt.to.closest('.kanban-col').getAttribute('data-status');
                    const taskId = itemEl.getAttribute('data-id');

                    // Optimistic update already happened in UI by Sortable
                    // Send to backend
                    await TaskService.updateTaskStatus(taskId, newStatus);
                    // could also update order here based on evt.newIndex
                }
            });
        });
    },

    // Global helper exposed to window probably needed if using onclick="Kanban.delete" 
    // or better attach listeners in render
    async delete(id) {
        if (confirm('Deletar tarefa?')) {
            await TaskService.deleteTask(id);
            this.render(this.currentProjectId);
        }
    }
};

// Expose for inline handlers if needed, though event delegation is better
window.Kanban = Kanban;
