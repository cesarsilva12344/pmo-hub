
import { AppState } from '../services/state.js';
import { Metrics } from '../metrics.js';

export const Reports = {
    generate() {
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

        this.render();
        alert(`Gerados ${newReports.length} reports com sucesso!`);
    },

    render() {
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
}
