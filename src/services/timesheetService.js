import { supabase } from './supabase';

export const timesheetService = {
    // Get all entries for a project
    async getProjectEntries(projectId) {
        const { data, error } = await supabase
            .from('time_logs')
            .select(`
                *,
                user:users(id, email, full_name, role)
            `)
            .eq('project_id', projectId)
            .order('log_date', { ascending: false });

        if (error) {
            console.error('Timesheet fetch error:', error);
            return [];
        }

        // Map DB fields to Frontend fields
        return data.map(entry => ({
            id: entry.id,
            project_id: entry.project_id,
            user_id: entry.user_id,
            task_id: entry.task_id,
            date: entry.log_date ? entry.log_date.split('T')[0] : '',
            hours: (entry.duration_minutes / 60).toFixed(1), // Convert minutes to hours
            type: 'Production', // Default since DB doesn't have type yet
            observation: entry.notes,
            user: entry.user || { email: 'unknown' }
        }));
    },

    // Log new hours
    async logHours(entry) {
        // entry: { project_id, task_id (optional), date, hours, type, observation }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check if user exists in public.users
        const { data: publicUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (userError || !publicUser) {
            console.warn('User not found in public.users, attempting to sync...');
            // Optional: Sync user if missing (simple fallback)
            await supabase.from('users').insert([{
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                role: 'member'
            }]);
        }

        const duration_minutes = Math.round(Number(entry.hours) * 60);

        const { data, error } = await supabase
            .from('time_logs')
            .insert([{
                project_id: entry.project_id,
                user_id: user.id,
                task_id: entry.task_id || null,
                log_date: entry.date, // Format YYYY-MM-DD is accepted by timestamp
                duration_minutes: duration_minutes,
                notes: `${entry.type ? `[${entry.type}] ` : ''}${entry.observation || ''}`,
                source: 'manual'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error inserting time log:', error);
            throw error;
        }
        return data;
    },

    // Delete entry
    async deleteEntry(id) {
        const { error } = await supabase
            .from('time_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Get total hours for a project
    async getProjectTotalHours(projectId) {
        const { data, error } = await supabase
            .from('time_logs')
            .select('duration_minutes')
            .eq('project_id', projectId);

        if (error) throw error;

        // Sum user entries
        const totalMinutes = data.reduce((acc, curr) => acc + Number(curr.duration_minutes), 0);
        return (totalMinutes / 60).toFixed(1);
    }
};
