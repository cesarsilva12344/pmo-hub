// js/metrics.js

const PMO_Metrics = {
    /**
     * Farol Financeiro (Custo)
     */
    calcularFarolCusto: (planejado, realizado) => {
        if (!planejado || planejado === 0) return 'verde'; 
        const razao = realizado / planejado;
        if (razao <= 1.0) return 'verde';      
        if (razao <= 1.10) return 'amarelo';   
        return 'vermelho';                     
    },

    /**
     * Farol de Prazo (Baseado no Gantt vs Hoje)
     */
    calcularFarolPrazo: (tarefas) => {
        if (!tarefas || tarefas.length === 0) return 'verde';
        const fimProjeto = Math.max(...tarefas.map(t => t.end));
        const mesAtual = new Date().getMonth();
        if (fimProjeto < mesAtual) return 'vermelho';
        if (fimProjeto === mesAtual) return 'amarelo';
        return 'verde';
    },

    /**
     * NOVO: Farol de Esforço (Horas)
     * Regra: 
     * - Até 90% das horas consumidas: Verde
     * - Entre 90% e 100%: Amarelo (Atenção, vai estourar)
     * - Acima de 100%: Vermelho (Estourou)
     */
    calcularFarolHoras: (horasPlan, horasReal) => {
        // Se não tiver horas cadastradas, assume neutro
        if (!horasPlan || horasPlan == 0) return 'verde';
        
        const consumo = horasReal / horasPlan;

        if (consumo > 1.0) return 'vermelho'; // Estourou as horas
        if (consumo >= 0.9) return 'amarelo'; // Está perigoso (90%+)
        return 'verde'; // Confortável
    },

    formatarCompacto: (valor) => {
        return Intl.NumberFormat('pt-BR', { notation: "compact", style: "currency", currency: "BRL" }).format(valor);
    }
};
