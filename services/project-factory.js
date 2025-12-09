
export const ProjectFactory = {
    create: (type, name, client, budget) => {
        const baseProject = {
            id: crypto.randomUUID(),
            name,
            client,
            budget,
            spent: 0,
            startDate: new Date().toISOString().split('T')[0],
            status: 'Em Planejamento',
            risks: [],
            team: [],
            allocations: []
        };

        switch (type) {
            case 'traditional':
                return { ...baseProject, methodology: 'Cascata', tools: ['Gantt', 'EAP', 'EVM'] };
            case 'agile':
                return { ...baseProject, methodology: 'Agile', tools: ['Kanban', 'Backlog', 'Burndown'] };
            case 'quick':
                return { ...baseProject, methodology: 'Ganho Rápido', tools: ['Checklist', 'Kanban Lite'] };
            default:
                return baseProject;
        }
    }
};
