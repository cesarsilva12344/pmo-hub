// Inicializa o cliente usando a config global
const authClient = window.supabase.createClient(window.PMO_CONFIG.SUPABASE_URL, window.PMO_CONFIG.SUPABASE_KEY);

// Define Auth no escopo global (window)
window.Auth = {
    userProfile: null,

    signIn: async (email, password) => {
        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    signUp: async (email, password) => {
        const { data, error } = await authClient.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    resetPassword: async (email) => {
        const { data, error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href.replace('login.html', 'index.html') });
        if (error) throw error;
        return data;
    },

    signOut: async () => {
        await authClient.auth.signOut();
        window.location.href = 'login.html';
    },

    checkSession: async () => {
        const { data: { session } } = await authClient.auth.getSession();
        
        // Proteção de rota: se não tem sessão e não está no login, vai pro login
        if (!session && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
            return null;
        }

        // Se tem sessão
        if (session) {
            try {
                // Busca perfil
                const { data: profile } = await authClient.from('profiles').select('*').eq('id', session.user.id).single();
                window.Auth.userProfile = profile;
            } catch (err) {
                console.warn("Perfil não encontrado, usando padrão gestor.");
            }
            
            // Se está no login com sessão válida, vai pro index
            if(window.location.href.includes('login.html')) {
                window.location.href = 'index.html';
            }
        }
        return session;
    },
    
    isAdmin: () => {
        return window.Auth.userProfile && window.Auth.userProfile.role === 'admin';
    }
};
