// js/auth.js

// Usa a configuração global do config.js
const authClient = window.supabase.createClient(PMO_CONFIG.SUPABASE_URL, PMO_CONFIG.SUPABASE_KEY);

const Auth = {
    // --- LOGIN ---
    signIn: async (email, password) => {
        const { data, error } = await authClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) throw error;
        return data;
    },

    // --- CRIAR CONTA (SIGN UP) ---
    signUp: async (email, password) => {
        const { data, error } = await authClient.auth.signUp({
            email: email,
            password: password,
        });
        if (error) throw error;
        return data;
    },

    // --- RESET DE SENHA ---
    resetPassword: async (email) => {
        // Redireciona para uma página de atualização de senha (pode ser o próprio index por enquanto)
        const { data, error } = await authClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href.replace('login.html', 'index.html'),
        });
        if (error) throw error;
        return data;
    },

    // --- LOGOUT ---
    signOut: async () => {
        const { error } = await authClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    },

    // --- VERIFICAÇÃO DE SESSÃO (PROTEÇÃO) ---
    checkSession: async () => {
        const { data: { session } } = await authClient.auth.getSession();
        // Se não tem sessão e não está na tela de login, chuta pra fora
        if (!session && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
        // Se tem sessão e está no login, manda pro sistema
        if (session && window.location.href.includes('login.html')) {
            window.location.href = 'index.html';
        }
        return session;
    }
};
