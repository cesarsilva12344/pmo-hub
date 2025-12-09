import config from './config.js';

const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_ANON_KEY = config.supabaseAnonKey;

// Check if the global supabase object is available (from CDN)
if (!window.supabase) {
    console.error('Supabase SDK not loaded! Check index.html');
}

export let supabaseClient = null;

try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase Client Initialized');
    } else {
        console.warn('Supabase Credentials missing. Client set to null.');
    }
} catch (err) {
    console.error('Failed to init Supabase client:', err);
}
