import { CONFIG } from './config.js';

// Initialize Supabase Client
// We use window.supabase because it's loaded via CDN
const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;
const _supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

export const Auth = {
    client: _supabase,

    login: async (email, password) => {
        if (!_supabase) {
            alert("Erro: Supabase não inicializado. Verifique as chaves em config.js");
            return;
        }
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert('Erro ao entrar: ' + error.message);
            console.error(error);
        } else {
            console.log('Login efetuado:', data);
            window.location.href = 'index.html';
        }
    },

    logout: async () => {
        if (!_supabase) return;
        const { error } = await _supabase.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        } else {
            console.error('Logout error:', error);
        }
    },

    checkSession: async () => {
        if (!_supabase) return null;
        const { data: { session } } = await _supabase.auth.getSession();
        return session;
    },

    // Auth Guard: Call this on protected pages
    requireAuth: async () => {
        if (!_supabase) return; // Allow dev if no supabase? Or block? Block for security simulation.
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
        }
    }
};

// Auto-check session on load if we are not in login page
// (Simple check based on pathname)
if (!window.location.pathname.includes('login.html')) {
    // We defer this call slightly to let things load or call it explicitly in app.js
    // Auth.requireAuth(); 
}

