// Define Metrics no escopo global
window.PMO_Metrics = {
    calcularFarolCusto: (planejado, realizado) => {
        if (!planejado || planejado === 0) return 'verde'; 
        const razao = realizado / planejado;
        if (razao <= 1.0) return 'verde';      
        if (razao <= 1.10) return 'amarelo';   
        return 'vermelho';                     
    },

    calcularFarolPrazo: (tarefas) => {
        if (!tarefas || tarefas.length === 0) return 'verde';
        const fimProjeto = Math.max(...tarefas.map(t => t.end));
        const mesAtual = new Date().getMonth();
        if (fimProjeto < mesAtual) return 'vermelho';
        if (fimProjeto === mesAtual) return 'amarelo';
        return 'verde';
    },

    calcularFarolHoras: (horasPlan, horasReal) => {
        if (!horasPlan || horasPlan == 0) return 'verde';
        const consumo = horasReal / horasPlan;
        if (consumo > 1.0) return 'vermelho'; 
        if (consumo >= 0.9) return 'amarelo'; 
        return 'verde'; 
    },

    calcularScoreRisco: (prob, imp) => {
        return prob * imp;
    },

    formatarCompacto: (valor) => {
        return Intl.NumberFormat('pt-BR', { notation: "compact", style: "currency", currency: "BRL" }).format(valor);
    }
};
