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
            alert("Erro Crítico: Conexão com Supabase não estabelecida. Verifique config.js e secrets.js.");
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login Error:', error);
            let msg = 'Falha no login.';
            if (error.message.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.';
            if (error.message.includes('Email not confirmed')) msg = 'E-mail não confirmado. Verifique sua caixa de entrada.';

            alert(msg);
        } else {
            console.log('Login efetuado:', data);
            window.location.href = 'index.html';
        }
    },

    loginDemo: () => {
        console.log('Login Demo Activated');
        localStorage.setItem('pmo_demo_mode', 'true');
        window.location.href = 'index.html';
    },

    logout: async () => {
        if (!supabaseClient) {
            window.location.href = 'login.html';
            return;
        }
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        } else {
            console.error('Logout error:', error);
            // Force logout anyway
            window.location.href = 'login.html';
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
            // Check hash for password reset flow before redirecting
            if (window.location.hash && window.location.hash.includes('type=recovery')) {
                // Let Supabase handle recovery, likely redirecting to update-password internally or we handle it here
                return;
            }
            window.location.href = 'login.html';
        }
    },

    resetPassword: async (email) => {
        if (!supabaseClient) {
            alert("Erro: Supabase não configurado.");
            return;
        }
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html',
        });
        if (error) {
            alert('Erro ao enviar email: ' + error.message);
        } else {
            alert('Enviamos um link de recuperação para: ' + email + '. Verifique sua caixa de entrada (e spam).');
        }
    }
};

// Auto-check session on load if we are not in login page
// (Simple check based on pathname)
if (!window.location.pathname.includes('login.html')) {
    // We defer this call slightly to let things load or call it explicitly in app.js
    // Auth.requireAuth(); 
}

