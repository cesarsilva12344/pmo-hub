
import { ProjectFactory } from './project-factory.js';
import { Metrics } from '../metrics.js';

// Central State Management
export const AppState = {
    projects: [],
    demands: [],
    reports: [],
    resources: [],
    listeners: [],

    // Subscriber pattern for UI updates
    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach(fn => fn());
    },

    async loadProjects() {
        // Mock Data Loading (Move to API service later)
        if (this.projects.length === 0) {
            this.projects = [
                ProjectFactory.create('traditional', 'Implantação ERP', 'Acme Corp', 500000),
                ProjectFactory.create('agile', 'App Mobile V2', 'Tech Solutions', 150000),
                ProjectFactory.create('quick', 'Campanha Marketing', 'Retail SA', 20000)
            ];

            // Mock Stats Enrichment
            this._enrichMockData();
        }
        this.notify();
    },

    addProject(type, name, client, budget) {
        const newProject = ProjectFactory.create(type, name, client, budget);
        this.projects.push(newProject);
        this.notify();
        return newProject;
    },

    _enrichMockData() {
        // Helper to add dummy data
         this.projects[0].spent = 120000;
         this.projects[0].status = 'Em Execução';
         this.projects[0].risks = [
             { title: 'Atraso Fornecedor', prob: 4, impact: 5 },
             { title: 'Mudança Escopo', prob: 3, impact: 3 }
         ];
         this.projects[0].allocations = [
             { resourceId: 1, role: 'GP', hours: 40 },
             { resourceId: 2, role: 'Dev', hours: 80 }
         ];

         this.projects[1].spent = 145000;
         this.projects[1].status = 'Em Risco';
         this.projects[1].risks = [{ title: 'Bug Crítico', prob: 5, impact: 5 }];
         this.projects[1].allocations = [
            { resourceId: 2, role: 'Dev', hours: 120 },
            { resourceId: 3, role: 'QA', hours: 40 }
        ];

        this.demands = [
            { id: 1, title: 'Upgrade Servidores', status: 'ideia', score: 8 },
            { id: 2, title: 'Nova Intranet', status: 'analise', score: 5 },
            { id: 3, title: 'Migração Cloud', status: 'aprovado', score: 9 }
        ];

        this.resources = [
            { id: 1, name: 'Ana Silva', role: 'Gerente de Projetos', capacity: 160, avatar: 'AS' },
            { id: 2, name: 'Carlos Dev', role: 'Desenvolvedor Fullstack', capacity: 160, avatar: 'CD' },
            { id: 3, name: 'Julia QA', role: 'Analista de Qualidade', capacity: 160, avatar: 'JQ' }
        ];
    }
};
