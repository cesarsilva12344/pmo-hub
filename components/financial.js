
import { AppState } from '../services/state.js';
import { Metrics } from '../metrics.js';

// --- AI Service Mock (Phase 3) ---
// Moved locally here since it's mostly used by Financial but could be shared.
// For now keeping it simple.
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

export const Financial = {
    render() {
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
                if (project) this.openAIModal(project);
            });
        });
    },

    openAIModal(project) {
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
        if (btnClose) {
            btnClose.onclick = () => {
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 200);
            };
        }
    }
};
