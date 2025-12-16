import { Api } from '../services/api.js';

export const Admin = {
    init() {
        // Tab switching logic
        const tabs = document.querySelectorAll('.admin-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all
                tabs.forEach(t => {
                    t.classList.remove('active', 'text-blue-600', 'border-blue-600');
                    t.classList.add('border-transparent');
                });
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));

                // Activate clicked
                tab.classList.add('active', 'text-blue-600', 'border-blue-600');
                tab.classList.remove('border-transparent');

                const targetId = tab.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.remove('hidden');
            });
        });

        // Initialize form logic
        const globalForm = document.getElementById('form-global-settings');
        if (globalForm) {
            globalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const appName = globalForm.querySelector('input[type="text"]').value;
                const selects = globalForm.querySelectorAll('select');
                const currency = selects[0].value;
                const theme = selects[1].value;

                await Api.saveSetting('app_name', appName);
                await Api.saveSetting('currency', currency);
                await Api.saveSetting('theme', theme);

                alert('Configurações salvas no Supabase!');
            });
        }
    },

    async render() {
        console.log('Admin view rendered');
        const settings = await Api.getGlobalSettings();

        const globalForm = document.getElementById('form-global-settings');
        if (globalForm && settings.app_name) {
            globalForm.querySelector('input[type="text"]').value = settings.app_name;
            const selects = globalForm.querySelectorAll('select');
            if (settings.currency) selects[0].value = settings.currency;
            if (settings.theme) selects[1].value = settings.theme;
        }
    }
};
