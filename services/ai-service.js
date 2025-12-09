
import config from '../config.js';

export const AiService = {
    async generateStatusReport(project, tasks) {
        const apiKey = config.geminiApiKey;

        if (!apiKey) {
            alert('Por favor, configure sua chave API do Gemini em js/config.js');
            return null;
        }

        const taskSummary = tasks.map(t =>
            `- ${t.title} (${t.status}, Prioridade: ${t.priority})`
        ).join('\n');

        const prompt = `
            Você é um PMO Sênior. Gere um Status Report executivo curto para o projeto "${project.title}".
            
            Dados do Projeto:
            - Cliente: ${project.client || 'N/D'}
            - Status Atual: ${project.status}
            - Saúde (Escopo/Custo/Prazo): ${project.health_scope}/${project.health_cost}/${project.health_time}
            
            Tarefas Recentes:
            ${taskSummary}

            Saída esperada (em formato JSON):
            {
                "summary": "Resumo de 1 frase",
                "risks": "Lista de riscos identificados baseados nas tarefas ou saúde",
                "recommendation": "Uma ação recomendada para o gerente"
            }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) throw new Error('Falha na API Gemini');

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;

            // Extract JSON from markdown code block if present
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

            return JSON.parse(jsonStr);

        } catch (error) {
            console.error('AI Error:', error);
            alert('Erro ao gerar insight com IA. Verifique o console.');
            return null;
        }
    }
};
