
export const GanttChart = {
    gantt: null,
    containerId: null,

    async render(projectId, containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);

        if (!container) return;
        container.innerHTML = ''; // Clear previous

        // 1. Fetch Tasks
        // We need a specialized fetch or enrich existing one
        // For now, let's assume getTasks returns start_date/end_date
        const tasks = await TaskService.getTasks(projectId);

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-10">Nenhuma tarefa com datas definidas.</div>';
            return;
        }

        // 2. Transform to Frappe Format
        // Expected: { id, name, start, end, progress, dependencies }
        const ganttTasks = tasks
            .filter(t => t.start_date && t.end_date) // Only show scheduled tasks
            .map(t => ({
                id: t.id,
                name: t.title,
                start: t.start_date,
                end: t.end_date,
                progress: t.status === 'done' ? 100 : (t.status === 'in_progress' ? 50 : 0),
                dependencies: t.parent_id || '', // Simple parent usage for now, ideally fetch connections
                custom_class: `gantt-priority-${t.priority}`
            }));

        if (ganttTasks.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-10">Defina datas de início e fim para visualizar o Gantt.</div>';
            return;
        }

        // 3. Initialize Frappe Gantt
        // We verify if window.Gantt exists (loaded via CDN)
        if (typeof Gantt === 'undefined') {
            console.error('Frappe Gantt lib not loaded');
            container.innerHTML = 'Erro: Biblioteca Gantt não carregada.';
            return;
        }

        this.gantt = new Gantt(`#${containerId}`, ganttTasks, {
            view_modes: ['Day', 'Week', 'Month'],
            view_mode: 'Week',
            header_height: 50,
            column_width: 30,
            step: 24,
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            date_format: 'YYYY-MM-DD',
            language: 'ptBr', // We might need custom generic 'en' if 'ptBr' not supported out of box

            on_click: task => {
                console.log(task);
            },
            on_date_change: (task, start, end) => {
                // Update in DB
                console.log(`Update ${task.id}: ${start} - ${end}`);
                // TODO: Call TaskService.updateDates(task.id, start, end)
            },
            on_progress_change: (task, progress) => {
                console.log(task, progress);
            },
            on_view_change: (mode) => {
                console.log(mode);
            }
        });
    },

    changeView(mode) {
        if (this.gantt) {
            this.gantt.change_view_mode(mode);
        }
    }
};

window.GanttChart = GanttChart;
