import { AppState } from '../services/state.js';

export const ProjectForm = {
    modal: null,
    selectedTrack: null,

    init() {
        this.modal = document.getElementById('new-project-modal');
        this.bindEvents();
        this.initTabs();
        this.initSmartLists();
    },

    bindEvents() {
        // Open Modal (Handled by App.js usually, but we ensure logic here)

        // Close Modal
        const btnClose = document.getElementById('btn-close-new-project');
        const btnCancel = document.getElementById('btn-cancel-new-project');
        const closeFn = () => this.close();

        if (btnClose) btnClose.addEventListener('click', closeFn);
        if (btnCancel) btnCancel.addEventListener('click', closeFn);

        // Wizard: Step 1 Track Selection
        const tracks = document.querySelectorAll('.np-track-card');
        tracks.forEach(card => {
            card.addEventListener('click', () => {
                const track = card.getAttribute('data-track');
                this.selectTrack(track);
            });
        });

        // Wizard: Back Button
        const btnBack = document.getElementById('btn-back-step-1');
        if (btnBack) {
            btnBack.addEventListener('click', (e) => {
                e.preventDefault(); // prevent form submit if inside form
                this.goToStep(1);
            });
        }

        // Save
        const btnSave = document.getElementById('btn-save-new-project');
        if (btnSave) btnSave.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveProject();
        });
    },

    initTabs() {
        const tabs = document.querySelectorAll('button[data-tab^="np-"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Deactivate all
                tabs.forEach(t => {
                    t.classList.remove('text-blue-600', 'border-blue-600');
                    t.classList.add('text-gray-500', 'border-transparent');
                });
                document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));

                // Activate clicked
                e.target.classList.remove('text-gray-500', 'border-transparent');
                e.target.classList.add('text-blue-600', 'border-blue-600');

                const targetId = e.target.getAttribute('data-tab');
                document.getElementById(targetId).classList.remove('hidden');
            });
        });
    },

    initSmartLists() {
        // Hydrate datalists from AppState
        this.updateDatalist('list-clients', AppState.clients || []);
        this.updateDatalist('list-products', AppState.products || []);
        this.updateDatalist('list-categories', AppState.categories || []);
    },

    updateDatalist(id, items) {
        const dl = document.getElementById(id);
        if (!dl) return;
        dl.innerHTML = items.map(item => `<option value="${item}"></option>`).join('');
    },

    open() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.initSmartLists();
            this.goToStep(1); // Always start at wizard
            document.getElementById('form-new-project').reset();
        }
    },

    close() {
        if (this.modal) this.modal.classList.add('hidden');
    },

    goToStep(step) {
        const step1 = document.getElementById('np-step-1');
        const step2 = document.getElementById('np-step-2');

        if (step === 1) {
            step1.classList.remove('hidden');
            step2.classList.add('hidden');
            step2.classList.remove('flex');
        } else {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            step2.classList.add('flex');
        }
    },

    selectTrack(track) {
        this.selectedTrack = track;
        console.log(`Track Selected: ${track}`);

        // Custom Logic based on Track could go here
        // e.g. Pre-fill Category, toggle fields
        const catInput = document.getElementById('np-category');
        if (track === 'agile') catInput.value = 'Inovação / Ágil';
        else if (track === 'traditional') catInput.value = 'Engenharia / Sustentação';
        else if (track === 'quick') catInput.value = 'Quick Win';

        this.goToStep(2);
    },

    async saveProject() {
        // 1. Gather Data
        const name = document.getElementById('np-name').value;
        if (!name) {
            alert('Nome do projeto é obrigatório.');
            return;
        }

        const projectData = {
            id: crypto.randomUUID(), // Temp ID
            name: name,
            pep: document.getElementById('np-pep').value,
            manager: document.getElementById('np-manager').value,
            leiBem: document.getElementById('np-lei-bem').checked,
            description: document.getElementById('np-desc').value,

            client: document.getElementById('np-client').value,
            product: document.getElementById('np-product').value,
            category: document.getElementById('np-category').value,

            // New: Governance Track
            track: this.selectedTrack,
            status: 'Em Planejamento',

            health_scope: document.getElementById('np-scope').value,
            health_cost: document.getElementById('np-cost').value,
            health_time: document.getElementById('np-time').value,

            dates: {
                start_est: document.getElementById('np-start-est').value,
                start_real: document.getElementById('np-start-real').value,
                go_est: document.getElementById('np-go-est').value,
                go_real: document.getElementById('np-go-real').value,
                end_est: document.getElementById('np-end-est').value,
                end_real: document.getElementById('np-end-real').value
            },

            hours: {
                estimated: document.getElementById('np-hours-est').value,
                real: document.getElementById('np-hours-real').value
            }
        };

        // 2. Smart List Logic (Update DOM/State if new)
        this.checkAndAddSmartItem('clients', projectData.client);
        this.checkAndAddSmartItem('products', projectData.product);
        this.checkAndAddSmartItem('categories', projectData.category);

        // 3. Save to State/Supabase
        try {
            await AppState.addProject(projectData);
            this.close();
            alert('Projeto criado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar projeto: ' + err.message);
        }
    },

    checkAndAddSmartItem(listName, value) {
        if (!value) return;
        if (!AppState[listName]) AppState[listName] = [];

        // Simple case-insensitive check
        const exists = AppState[listName].some(i => i.toLowerCase() === value.toLowerCase());

        if (!exists) {
            AppState[listName].push(value);
            console.log(`Auto-added new ${listName}: ${value}`);
        }
    }
};
