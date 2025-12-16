
export const Admin = {
    init() {
        const tabs = document.querySelectorAll('.admin-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = tab.getAttribute('data-tab');
                this.switchTab(targetId);
            });
        });
    },

    switchTab(tabId) {
        // Hide all contents
        document.querySelectorAll('.admin-tab-content').forEach(el => {
            el.classList.add('hidden');
        });

        // Show target content
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }

        // Update tabs styles
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            // Remove active styles
            btn.classList.remove('text-blue-600', 'border-blue-600', 'active');
            // Add inactive styles
            btn.classList.add('border-transparent', 'hover:text-gray-600');

            // If this is the active button, set active styles
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.remove('border-transparent', 'hover:text-gray-600');
                btn.classList.add('text-blue-600', 'border-blue-600', 'active');
            }
        });
    }
};
