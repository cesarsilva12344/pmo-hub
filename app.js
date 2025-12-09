
import { Auth } from './auth.js';
import { supabaseClient } from './supabase-client.js';
import { AppState } from './services/state.js';
import { Navigation } from './modules/navigation.js';
import { Dashboard } from './components/dashboard.js';
import { RiskMatrix } from './components/risk-matrix.js';
import { Kanban } from './components/kanban.js';
import { Financial } from './components/financial.js';
import { Resources } from './components/resources.js';
import { Reports } from './components/reports.js';
import { Calendar } from './components/calendar.js';
import { FileImporter } from './modules/file-importer.js';
import { ProjectDetails } from './components/project-details.js';
import { ProjectsList } from './components/projects-list.js';
import { ProjectForm } from './components/project-form.js';
import { PomodoroTimer } from './components/pomodoro.js';
import { Inbox } from './components/inbox.js';

console.log('PMO Hub v15.1 Modular Loaded');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    Auth.requireAuth();

    // Init Modules
    Navigation.init();
    FileImporter.init();
    ProjectDetails.init();
    ProjectForm.init();
    ProjectsList.init();
    PomodoroTimer.init();
    Inbox.init(); // Init GTD Inbox

    // Init Logic depends on route, but for now we render things when needed
    // Listen to View Changes to render specific components
    window.addEventListener('viewChanged', (e) => {
        const view = e.detail.view;
        if (view === 'dashboard') Dashboard.render();
        if (view === 'risks') RiskMatrix.render();
        if (view === 'projects') {
            ProjectsList.render();
            Calendar.render();
        }
        if (view === 'financial') Financial.render();
        if (view === 'resources') Resources.render();
    });

    // Subscribe Dashboard to State Changes
    AppState.subscribe(() => {
        // Simple reactivity: re-render active view
        // Ideally we check which view is active
        Dashboard.render(); // Always update dashboard stats if they are visible
        // Others only if visible... for simplicity we can just leave it to the user navigation or specific re-renders
    });

    // Initial Load
    if (window.location.pathname.includes('index.html')) {
        AppState.loadProjects().then(() => {
            Dashboard.render();
            Reports.render();
        });
    }

    // Bindings
    // const btnNew = document.getElementById('btn-new-project'); // Moved to ProjectForm
    // if (btnNew) { ... }

    const btnRep = document.getElementById('btn-gen-report');
    if (btnRep) {
        btnRep.addEventListener('click', () => {
            Reports.generate();
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    // Supabase Test
    supabaseClient.from('projects').select('count', { count: 'exact', head: true })
        .then(({ count, error }) => {
            if (error) console.error('Supabase Connection Error:', error);
            else console.log('Supabase Connected.');
        });
});
