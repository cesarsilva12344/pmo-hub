import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// List of models to try in order of preference (Balancing cost/speed/quality)
const MODEL_FALLBACK_LIST = [
    "gemini-2.0-flash-lite", // Fast & Free/Cheap
    "gemini-2.0-flash",      // Balanced
    "gemini-flash-latest",   // Fallback V1
    "gemini-pro-latest"       // Fallback Legacy
];

let genAI = null;

try {
    if (API_KEY) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }
} catch (error) {
    console.error("Gemini init error:", error);
}

export const aiService = {
    /**
     * Aggregates all relevant project data to build a context window.
     */
    async buildProjectContext(projectId) {
        try {
            // GLOBAL CONTEXT (Dashboard)
            if (!projectId) {
                const { data: projects, error } = await supabase
                    .from('projects')
                    .select('name, status, health_scope, health_time, health_cost');

                if (error) throw error;

                const portfolioSummary = projects.map(p =>
                    `- ${p.name}: ${p.status} (Saúde: Escopo=${p.health_scope}, Prazo=${p.health_time}, Custo=${p.health_cost})`
                ).join('\n');

                return `
VOCÊ ESTÁ NO DASHBOARD GERAL (VISÃO DE PORTFÓLIO).
Você tem acesso a todos os projetos ativos. Se o usuário perguntar sobre um projeto específico, use os dados abaixo.

RESUMO DO PORTFÓLIO:
${portfolioSummary || 'Nenhum projeto encontrado.'}

Analise o portfólio como um todo. Identifique tendências, riscos sistêmicos e atrasos.
`;
            }

            // PROJECT CONTEXT (Specific)
            const [
                { data: project },
                { data: tasks },
                { data: risks },
            ] = await Promise.all([
                supabase.from('projects').select('*').eq('id', projectId).single(),
                supabase.from('tasks').select('id, name, status, priority, end_date').eq('project_id', projectId),
                supabase.from('project_risks').select('title, probability, impact, score').eq('project_id', projectId).order('score', { ascending: false }).limit(5),
            ]);

            if (!project) return "Projeto não encontrado.";

            // Construct Context String
            let context = `
CONTEXTO DO PROJETO ATUAL:
Nome: ${project.name}
Status: ${project.status}
Saúde: Escopo(${project.health_scope}), Prazo(${project.health_time}), Custo(${project.health_cost})
Descrição: ${project.description || 'N/A'}

ESTATÍSTICAS DE TAREFAS:
Total: ${tasks?.length || 0}
A Fazer: ${tasks?.filter(t => t.status === 'todo').length}
Em Andamento: ${tasks?.filter(t => t.status === 'in_progress').length}
Concluídas: ${tasks?.filter(t => t.status === 'done').length}

TOP RISCOS:
${risks?.map(r => `- ${r.title} (Score: ${r.score})`).join('\n') || 'Nenhum risco cadastrado.'}

Você deve agir como um especialista em Gerenciamento de Projetos (PMO) analisando esses dados. Seja conciso, direto e ofereça insights acionáveis.
`;
            return context;
        } catch (error) {
            console.error("Error building context:", error);
            return "Erro ao carregar contexto. (Dados parciais)";
        }
    },

    /**
     * Sends message to Gemini with robust fallback handling.
     */
    async sendMessage(userMessage, context = "") {
        if (!genAI) {
            return "Erro de Configuração: API Key do Gemini não encontrada ou inválida.";
        }

        const prompt = `
${context}

PERGUNTA DO USUÁRIO:
${userMessage}
`;

        // Try models in sequence
        for (const modelName of MODEL_FALLBACK_LIST) {
            try {
                // console.log(`Attempting AI connection with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // console.log(`Success with model: ${modelName}`);
                return text;

            } catch (error) {
                console.warn(`Failed with model ${modelName}:`, error.message);

                // If it's the last model, throw or return error
                if (modelName === MODEL_FALLBACK_LIST[MODEL_FALLBACK_LIST.length - 1]) {
                    console.error("All AI models failed.");

                    if (error.message.includes("429")) {
                        return "⚠️ Capacidade máxima da IA atingida temporariamente. Todos os modelos de backup estão ocupados. Por favor, aguarde 30 segundos e tente novamente.";
                    }

                    return "Desculpe, a IA está indisponível no momento devido a instabilidade nos servidores do Google. Tente novamente em breve.";
                }

                // Otherwise continue to next model loop
                continue;
            }
        }
    }
};
