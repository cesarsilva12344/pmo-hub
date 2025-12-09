import { supabaseClient } from './supabase-client.js';

export const Auth = {
    client: supabaseClient,

    login: async function (email, password) {
        if (!supabaseClient) {
            // Fallback for demo if no Supabase credentials
            if (email === 'demo@pmo.com' && password === 'demo') {
                this.loginDemo();
                return;
            }
            alert("Erro: Supabase não inicializado. Verifique as chaves em config.js");
            return;
        }
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login Error:', error);
            alert('Falha no Login: ' + (error.message || error.error_description || 'Erro desconhecido'));
        } else {
            console.log('Login efetuado:', data);
            window.location.href = 'index.html';
        }
    },

    loginDemo: () => {
        console.log('Login Demo Activated');
        // Simulate session by setting a cookie or just redirecting?
        // Since requireAuth checks Supabase, we need to bypass it or mock it.
        // For now, we will assume requireAuth handles 'demo' state if we set a flag.
        localStorage.setItem('pmo_demo_mode', 'true');
        window.location.href = 'index.html';
    },

    logout: async () => {
        if (!supabaseClient) return;
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        } else {
            console.error('Logout error:', error);
        }
    },

    checkSession: async () => {
        if (!supabaseClient) return null;
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    },

    // Auth Guard: Call this on protected pages
    requireAuth: async () => {
        if (localStorage.getItem('pmo_demo_mode') === 'true') return; // Bypass for demo
        if (!supabaseClient) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
        }
    },

    resetPassword: async (email) => {
        if (!supabaseClient) {
            alert("Sistema em modo Demo. Redefinição simulada enviada para: " + email);
            return;
        }
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html',
        });
        if (error) {
            alert('Erro ao enviar email: ' + error.message);
        } else {
            alert('Email de redefinição enviado para: ' + email);
        }
    }
};

// Auto-check session on load if we are not in login page
// (Simple check based on pathname)
if (!window.location.pathname.includes('login.html')) {
    // We defer this call slightly to let things load or call it explicitly in app.js
    // Auth.requireAuth(); 
}

