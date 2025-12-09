import { Api } from './api.js';
import { supabaseClient } from '../supabase-client.js';

export const TaskService = {
    async getTasks(projectId) {
        if (!supabaseClient) return [];

        let { data: tasks, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('order', { ascending: true });

        if (error) {
            console.error('TaskService Error: getTasks', error);
            return [];
        }
        return tasks;
    },

    async createTask(task) {
        if (!supabaseClient) return null;

        // Get max order to append to bottom
        const currentTasks = await this.getTasks(task.project_id);
        const maxOrder = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => t.order)) : 0;

        task.order = maxOrder + 1;

        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([task])
            .select();

        if (error) {
            console.error('TaskService Error: createTask', error);
            return null;
        }
        return data[0];
    },

    async updateTaskStatus(taskId, newStatus) {
        if (!supabaseClient) return;

        const { error } = await supabaseClient
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) console.error('TaskService Error: updateTaskStatus', error);
    },

    async updateTaskOrder(taskId, newOrder) {
        if (!supabaseClient) return;

        const { error } = await supabaseClient
            .from('tasks')
            .update({ order: newOrder })
            .eq('id', taskId);

        if (error) console.error('TaskService Error: updateTaskOrder', error);
    },

    async deleteTask(taskId) {
        if (!supabaseClient) return;

        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) console.error('TaskService Error: deleteTask', error);
    },

    async updateTaskDates(taskId, startDate, endDate) {
        if (!supabaseClient) return null;

        const { data, error } = await supabaseClient
            .from('tasks')
            .update({ start_date: startDate, end_date: endDate })
            .eq('id', taskId)
            .select();

        if (error) {
            console.error('TaskService Error: updateDates', error);
            return null;
        }
        return data[0];
    }
};
