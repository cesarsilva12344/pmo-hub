import config from './config.js';

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;

// Check if the global supabase object is available (from CDN)
if (!window.supabase) {
    console.error('Supabase SDK not loaded! Check index.html');
}

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase Client Initialized');
