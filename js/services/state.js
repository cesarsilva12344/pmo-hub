import { ProjectFactory } from './project-factory.js';
import { Metrics } from '../metrics.js';
import { Api } from './api.js';
import { supabaseClient } from '../supabase-client.js'; // Import direct client for now

// Central State Management
export const AppState = {
    projects: [],
    demands: [],
    reports: [],
    resources: [],
    inbox: [], // GTD Inbox Items
    timeLogs: [], // Timesheet Logs

    // Auxiliary Lists (Smart Dropdowns)
    clients: ['Acme Corp', 'Tech Solutions', 'Retail SA'],
    products: ['ERP', 'App Mobile', 'Consultoria'],
    categories: ['Inovação', 'Manutenção', 'Legal'],

    listeners: [],

    // Subscriber pattern for UI updates
    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach(fn => fn());
    },

    async loadProjects() {
        // 1. Projects
        const { data: dbProjects, error: errProj } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (!errProj && dbProjects) {
            this.projects = dbProjects;
        } else {
            console.error('Error loading projects:', errProj);
        }

        // 2. Inbox (GTD)
        const { data: dbInbox, error: errInbox } = await supabaseClient
            .from('inbox_items')
            .select('*')
            .eq('is_processed', false)
            .order('created_at', { ascending: false });

        if (!errInbox && dbInbox) {
            this.inbox = dbInbox;
        }

        // 3. TimeLogs
        const { data: dbLogs, error: errLogs } = await supabaseClient
            .from('time_logs')
            .select('*')
            .order('log_date', { ascending: false })
            .limit(50);

        if (!errLogs && dbLogs) {
            this.timeLogs = dbLogs;
        }

        // 4. Enrich Mock Data (Resources, Demands still mock)
        this._enrichMockData();

        this.notify();
    },

    async addProject(projectData) {
        // Map Frontend Form Data to SQL Columns
        // Form field names might differ slightly from DB
        const dbPayload = {
            name: projectData.name,
            pep_code: projectData.pep,
            manager_id: null, // We need to resolve Name to UUID or use current user
            description: projectData.description,
            client: projectData.client,
            product: projectData.product,
            category: projectData.category,
            track: projectData.track,
            status: projectData.status,

            health_scope: projectData.health_scope,
            health_cost: projectData.health_cost,
            health_time: projectData.health_time,

            start_date_est: projectData.dates?.start_est || null,
            start_date_real: projectData.dates?.start_real || null,
            end_date_est: projectData.dates?.end_est || null,
            end_date_real: projectData.dates?.end_real || null,

            // Estimates (Parsing strings to numbers)
            budget_total: 0, // Not in form yet
            cost_actual: 0
        };

        // Remove empty strings for Date fields (Postgres fails on "")
        Object.keys(dbPayload).forEach(k => {
            if (dbPayload[k] === "") dbPayload[k] = null;
        });

        // Optimistic UI Update (Temporary)
        this.projects.unshift({ ...dbPayload, id: 'temp-' + Date.now() });
        this.notify();

        // Persist to Supabase
        const { data, error } = await supabaseClient
            .from('projects')
            .insert([dbPayload])
            .select();

        if (error) {
            console.error('Supabase Save Error:', error);
            alert('Falha ao salvar no banco. Verifique o console.');
            return null;
        }

        // Update with Real ID
        if (data && data[0]) {
            // Replace temp item with real one
            this.projects.shift(); // Remove optimistic
            this.projects.unshift(data[0]);
            this.notify();
            return data[0];
        }
    },

    _enrichMockData() {
        // Only enrich if we have mock projects (or real ones we want to patch)
        if (this.projects.length >= 2) {
            this.projects[0].spent = 120000;
            // ... (rest of logic if needed)
        }

        // If NO projects (empty DB), let's insert a "Ghost" demo project for UI visualization only (not saved to DB)
        if (this.projects.length === 0) {
            this.projects.push({
                id: 'demo-1',
                name: 'Projeto Exemplo (Demo)',
                client: 'Cliente Demo',
                status: 'Em Execução',
                progress: 45,
                budget_total: 50000,
                health_time: 'verde',
                health_cost: 'amarelo',
                description: 'Este é um projeto visualizado apenas na memória para demonstração.'
            });
        }

        // Keep some static data for parts not yet in DB (Resources, Demands)
        this.resources = [
            { id: 1, name: 'Ana Silva', role: 'Gerente de Projetos', capacity: 160, avatar: 'AS' },
            { id: 2, name: 'Carlos Dev', role: 'Desenvolvedor Fullstack', capacity: 160, avatar: 'CD' },
            { id: 3, name: 'Julia QA', role: 'Analista de Qualidade', capacity: 160, avatar: 'JQ' }
        ];

        this.demands = [
            { id: 1, title: 'Upgrade Servidores', status: 'ideia', score: 8 },
            { id: 2, title: 'Nova Intranet', status: 'analise', score: 5 },
            { id: 3, title: 'Migração Cloud', status: 'aprovado', score: 9 }
        ];
    }
};
