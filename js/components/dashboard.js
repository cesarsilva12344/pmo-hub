
import { Metrics } from '../metrics.js';
import { AppState } from '../services/state.js';

export const Dashboard = {
    render() {
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

        this.updateChartInvestment();
        this.updateChartHealth();
    },

    updateChartInvestment() {
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
    },

    updateChartHealth() {
        let healthCounts = { green: 0, yellow: 0, red: 0 };
        AppState.projects.forEach(p => {
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
};
