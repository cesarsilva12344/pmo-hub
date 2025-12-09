
import { AppState } from '../services/state.js';

export const Dashboard = {
    render() {
        const projects = AppState.projects || [];
        const totalProjects = projects.length;

        // 1. Calculate KPIs
        // Risk: Any project with red health in cost or time
        const riskCount = projects.filter(p =>
            p.health_cost === 'red' || p.health_time === 'red' || p.status === 'risk'
        ).length;

        // Budget (Estimated Hours as proxy for now, or sum custom field)
        // If we had a budget column, we'd sum it. using total_estimated_hours * 150 (mock rate)
        const totalHours = projects.reduce((sum, p) => sum + (Number(p.total_estimated_hours) || 0), 0);
        const estimatedBudget = totalHours * 150;

        // Update DOM
        this.safeSetText('kpi-total-projects', totalProjects);
        this.safeSetText('kpi-risk-projects', riskCount);
        this.safeSetText('kpi-budget', `R$ ${(estimatedBudget / 1000).toFixed(1)}k (Est.)`);

        // 2. Render Charts
        this.renderInvestmentChart(projects);
        this.renderHealthChart(projects);
    },

    safeSetText(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    },

    renderInvestmentChart(projects) {
        // Group by Client
        const clientData = {};
        projects.forEach(p => {
            const client = p.client || 'Interno';
            // Using estimated hours as magnitude
            const value = Number(p.total_estimated_hours) || 0;
            clientData[client] = (clientData[client] || 0) + value;
        });

        const options = {
            series: [{ name: 'Horas Estimadas', data: Object.values(clientData) }],
            chart: { type: 'bar', height: 250, toolbar: { show: false } },
            plotOptions: { bar: { borderRadius: 4, horizontal: true } },
            colors: ['#3B82F6'],
            xaxis: { categories: Object.keys(clientData) },
            title: { text: 'Volume por Cliente (Horas)', align: 'left', style: { fontSize: '14px' } }
        };

        const chartEl = document.querySelector("#chart-investment");
        if (chartEl) {
            chartEl.innerHTML = "";
            const chart = new ApexCharts(chartEl, options);
            chart.render();
        }
    },

    renderHealthChart(projects) {
        // Count by worst health indicator
        let green = 0, yellow = 0, red = 0;

        projects.forEach(p => {
            // Determine global health based on worst indicator
            const statuses = [p.health_scope, p.health_cost, p.health_time];
            if (statuses.includes('red')) red++;
            else if (statuses.includes('yellow')) yellow++;
            else green++;
        });

        const options = {
            series: [green, yellow, red],
            labels: ['Saudável', 'Atenção', 'Crítico'],
            colors: ['#10B981', '#F59E0B', '#EF4444'],
            chart: { type: 'donut', height: 250 },
            legend: { position: 'bottom' },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%'
                    }
                }
            }
        };

        const chartEl = document.querySelector("#chart-health");
        if (chartEl) {
            chartEl.innerHTML = "";
            const chart = new ApexCharts(chartEl, options);
            chart.render();
        }
    }
};
