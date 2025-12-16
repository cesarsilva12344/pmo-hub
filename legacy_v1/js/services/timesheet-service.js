import { AppState } from './state.js';
import { supabaseClient } from '../supabase-client.js';

export const TimesheetService = {
    // Mock Rate Card (In real app, this comes from Users table)
    RATE_CARD: {
        '1': 150.00, // Manager
        '2': 100.00, // Dev
        '3': 80.00   // QA
    },

    // Core Business Logic: Calculate Cost
    calculateCost(durationMinutes, userId) {
        const ratePerHour = this.RATE_CARD[userId] || 0;
        const durationHours = durationMinutes / 60;
        return (durationHours * ratePerHour).toFixed(2);
    },

    // Log Time (Transaction)
    async logTime(entry) {
        // entry: { taskId, userId, durationMinutes, date, projectId }

        // 1. Calculate Cost
        const cost = this.calculateCost(entry.durationMinutes, entry.userId);

        // 2. Prepare Record
        const dbRecord = {
            task_id: entry.taskId || null,
            user_id: null, // entry.userId (mocked as null for now to avoid FK error if user not in DB)
            project_id: entry.projectId || null,
            duration_minutes: entry.durationMinutes,
            cost_calulated: parseFloat(cost),
            log_date: entry.date || new Date().toISOString(),
            source: 'pomodoro'
        };

        console.log(`[Timesheet] Recording Log: ${entry.durationMinutes}min = R$ ${cost}`);

        // 3. Save to Supabase
        const { data, error } = await supabaseClient
            .from('time_logs')
            .insert([dbRecord])
            .select();

        if (error) {
            console.error('Timesheet Save Error:', error);
            // Fallback to local state if needed, but for now just log
        } else {
            // 4. Update Local State
            if (!AppState.timeLogs) AppState.timeLogs = [];
            if (data) AppState.timeLogs.unshift(data[0]);

            // 5. Update Project Actual Cost
            // If we have a project ID (explicit or implied), update it
            // For prototype, we mock-find a project if null
            let targetProjectId = entry.projectId;
            if (!targetProjectId && AppState.projects.length > 0) {
                // Taking the first project just to show EVM update
                targetProjectId = AppState.projects[0].id;
            }

            if (targetProjectId) {
                await this.updateProjectCost(targetProjectId, parseFloat(cost));
            }
        }

        return data ? data[0] : null;
    },

    async updateProjectCost(projectId, costToAdd) {
        // 1. Find in Local State
        const project = AppState.projects.find(p => p.id === projectId);

        if (project) {
            // Update Local
            const newCost = (parseFloat(project.cost_actual || 0) + costToAdd);
            project.cost_actual = newCost;

            console.log(`[EVM] Updated Project ${project.name} Cost to R$ ${newCost}`);
            AppState.notify();

            // 2. Update DB
            await supabaseClient
                .from('projects')
                .update({ cost_actual: newCost })
                .eq('id', projectId);
        }
    }
};
