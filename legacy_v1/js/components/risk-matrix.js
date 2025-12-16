
import { AppState } from '../services/state.js';

export const RiskMatrix = {
    render() {
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
};
