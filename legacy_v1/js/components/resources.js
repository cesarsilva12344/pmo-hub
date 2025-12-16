
import { AppState } from '../services/state.js';

export const Resources = {
    render() {
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
};
