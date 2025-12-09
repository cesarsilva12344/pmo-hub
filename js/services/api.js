
import { supabaseClient } from '../supabase-client.js';

export const Api = {
    // --- Projects ---
    async getProjects() {
        if (!supabaseClient) return [];

        let { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('API Error: getProjects', error);
            return [];
        }
        return projects;
    },

    async createProject(project) {
        if (!supabaseClient) return null;

        const { data, error } = await supabaseClient
            .from('projects')
            .insert([project])
            .select();

        if (error) {
            console.error('API Error: createProject', error);
            return null;
        }
        return data[0];
    },

    // --- Settings (Global) ---
    async getGlobalSettings() {
        if (!supabaseClient) return {};

        // We assume a 'settings' table with key/value pairs or a single row for global config
        // For simplicity, let's look for keys 'app_name', 'currency', 'theme'
        let { data, error } = await supabaseClient
            .from('settings')
            .select('*');

        if (error || !data) return {};

        // Reduce to simple object
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        return settings;
    },

    async saveSetting(key, value) {
        if (!supabaseClient) return;

        const { error } = await supabaseClient
            .from('settings')
            .upsert({ key: key, value: value }, { onConflict: 'key' });

        if (error) console.error('API Error: saveSetting', error);
    }
};
