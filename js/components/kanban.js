
import { AppState } from '../services/state.js';

export const Kanban = {
    render() {
        const cols = {
            'ideia': document.getElementById('col-ideia'),
            'analise': document.getElementById('col-analise'),
            'aprovado': document.getElementById('col-aprovado')
        };

        // Clear content but keep references
        Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

        // Render Cards
        AppState.demands.forEach(d => {
            const card = document.createElement('div');
            card.className = 'kanban-card bg-white p-3 rounded shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow';
            card.dataset.id = d.id;
            card.innerHTML = `
                <div class="font-bold text-gray-800">${d.title}</div>
                <div class="text-xs text-gray-400 mt-1">Score: ${d.score}</div>
            `;

            if (cols[d.status]) cols[d.status].appendChild(card);
        });

        // Initialize Sortable for Drag & Drop
        this.initSortable(cols);
    },

    initSortable(cols) {
        Object.keys(cols).forEach(status => {
            const el = cols[status];
            if (el && !el.sortableInitialized) { // Prevent re-init loop
                new Sortable(el, {
                    group: 'kanban',
                    animation: 150,
                    ghostClass: 'bg-blue-50',
                    onEnd: (evt) => {
                        const itemEl = evt.item;
                        const newStatus = evt.to.id.replace('col-', '');
                        const demandId = itemEl.dataset.id;

                        // Update State
                        const demand = AppState.demands.find(d => d.id == demandId);
                        if (demand && demand.status !== newStatus) {
                            demand.status = newStatus;
                            console.log(`Demand ${demandId} moved to ${newStatus}`);
                            // Here we would sync with backend
                        }
                    }
                });
                el.sortableInitialized = true;
            }
        });
    }
};
