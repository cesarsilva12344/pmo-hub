
export const Navigation = {
    init() {
        const views = ['dashboard', 'risks', 'projects', 'admin', 'financial', 'resources', 'inbox'];

        views.forEach(view => {
            const link = document.getElementById(`nav-${view}`);
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchView(view);
                });
            }
        });
    },

    switchView(viewId) {
        // Hide all sections
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

        // Reset Nav
        document.querySelectorAll('nav a').forEach(el => {
            el.classList.remove('bg-slate-800', 'text-white');
            el.classList.add('text-slate-300');
        });

        // Show active section
        const activeSection = document.getElementById(`view-${viewId}`);
        if (activeSection) activeSection.classList.remove('hidden');

        // Highlight active nav
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) {
            activeNav.classList.add('bg-slate-800', 'text-white');
            activeNav.classList.remove('text-slate-300');
        }

        // Trigger view specific render events (could be done via EventBus, but keeping simple)
        // This relies on the main app loop or specific listeners to react, 
        // OR we can export an event bus. 
        // For now, let's dispatch a custom event on window
        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: viewId } }));
    }
};
