export const Metrics = {
    // Calculate Project Health (Traffic Light)
    calculateHealth: (project) => {
        // Logic: 
        // Spent > Budget = Red
        // Spent > 0.8 * Budget = Yellow
        // Else = Green
        if (!project.budget || project.budget === 0) return { overall: 'gray' };

        const ratio = project.spent / project.budget;
        let costHealth = 'green';
        if (ratio > 1.0) costHealth = 'red';
        else if (ratio > 0.8) costHealth = 'yellow';

        // Time Health (Simple date check)
        // If today > startDate + 30 days (mock duration) -> yellow
        const daysRunning = (new Date() - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
        let timeHealth = 'green';
        if (daysRunning > 60) timeHealth = 'red'; // Mock deadline
        else if (daysRunning > 30) timeHealth = 'yellow';

        return {
            cost: costHealth,
            time: timeHealth,
            overall: (costHealth === 'red' || timeHealth === 'red') ? 'red' : ((costHealth === 'yellow' || timeHealth === 'yellow') ? 'yellow' : 'green')
        };
    },

    // Calculate Forecast (Simplified EAC)
    calculateForecast: (project) => {
        // Mock CPI (Cost Performance Index)
        // If spent > planned * 1.1 -> CPI < 1 (Bad)
        // Simplified logic for demo
        const completion = project.spent / project.budget;
        const cpi = completion > 0 && completion < 1 ? (Math.random() * 0.4 + 0.8) : 1; // Random CPI 0.8-1.2

        const eac = project.budget / cpi; // Estimate at Completion
        const variance = project.budget - eac;

        return {
            cpi: cpi.toFixed(2),
            eac: eac,
            variance: variance,
            status: variance < 0 ? 'Over Budget' : 'Under Budget'
        };
    },

    // Mock Cash Flow Generation
    generateCashFlow: (project) => {
        // Generate 12 months of data
        const cashFlow = [];
        const monthlyBudget = project.budget / 12;
        let cumulative = 0;

        for (let i = 1; i <= 12; i++) {
            const planned = monthlyBudget;
            // Actual only for first 5 months
            const actual = i <= 5 ? (monthlyBudget * (Math.random() * 0.4 + 0.8)) : null;

            cumulative += actual || planned;

            cashFlow.push({
                month: `Mês ${i}`,
                planned,
                actual,
                cumulative
            });
        }
        return cashFlow;
    },

    calculateSCurve: (project) => {
        // Mock S-Curve: Generate 10 points
        // Planned: Linear accumulation
        // Actual: Random accumulating around planned
        const points = [];
        const steps = 10;
        const stepValue = project.budget / steps;

        let currentPlanned = 0;
        let currentActual = 0;

        for (let i = 0; i <= steps; i++) {
            const planned = Math.round(currentPlanned);
            // Simulate actual cost variance
            const variance = Math.random() * 0.2 + 0.9; // 0.9 to 1.1 multiplier
            let actual = 0;

            if (i <= 5) { // Only show actual for half the timeline (mock "today")
                currentActual += stepValue * variance;
                actual = Math.round(currentActual);
            } else {
                actual = null; // Future
            }

            points.push({
                period: `Mês ${i}`,
                planned: planned,
                actual: actual
            });

            currentPlanned += stepValue;
        }
        return points;
    },

    // Calculate Weighted Health Score (0-100)
    calculateWeightedHealth: (project) => {
        let score = 100;
        const details = [];

        // 1. Time (SPI) - 30% Weight
        // Mock SPI based on status
        let spi = 1.0;
        if (project.status === 'Em Risco') spi = 0.8;
        if (project.status === 'Atrasado') spi = 0.6;

        if (spi < 1.0) {
            const deduction = (1.0 - spi) * 100 * 0.3; // Full weight deduction
            score -= deduction;
            details.push(`Prazo impactou -${deduction.toFixed(0)} pts`);
        }

        // 2. Cost (CPI) - 30% Weight
        // Use forecast logic
        const completion = project.spent / project.budget;
        const cpi = completion > 0 && completion < 1 ? (Math.random() * 0.4 + 0.8) : 1;

        if (cpi < 1.0) {
            const deduction = (1.0 - cpi) * 100 * 0.3;
            score -= deduction;
            details.push(`Custo impactou -${deduction.toFixed(0)} pts`);
        }

        // 3. Risks - 20% Weight
        const criticalRisks = project.risks ? project.risks.filter(r => r.prob * r.impact >= 15).length : 0;
        if (criticalRisks > 0) {
            const deduction = Math.min(criticalRisks * 10, 20); // 10 pts per critical risk, max 20
            score -= deduction;
            details.push(`Riscos Críticos impactaram -${deduction} pts`);
        }

        // 4. Team Overload - 20% Weight
        // Check allocations (Mock check > 160h)
        const overloaded = project.allocations ? project.allocations.some(a => a.hours > 160) : false;
        if (overloaded) {
            score -= 20;
            details.push('Sobrecarga de Equipe impactou -20 pts');
        }

        score = Math.max(0, Math.round(score));

        return {
            score: score,
            status: score >= 80 ? 'Otimizado' : (score >= 60 ? 'Atenção' : 'Crítico'),
            color: score >= 80 ? 'text-green-600' : (score >= 60 ? 'text-yellow-600' : 'text-red-600'),
            details
        };
    }
};
