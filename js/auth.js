const authClient = window.supabase.createClient(PMO_CONFIG.SUPABASE_URL, PMO_CONFIG.SUPABASE_KEY);

const Auth = {
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
        if (!session && !window.location.href.includes('login.html')) window.location.href = 'login.html';
        if (session) {
            // Busca o perfil (Admin/Gestor) criado no passo anterior
            const { data: profile } = await authClient.from('profiles').select('*').eq('id', session.user.id).single();
            Auth.userProfile = profile;
            
            if(window.location.href.includes('login.html')) window.location.href = 'index.html';
        }
        return session;
    },
    
    isAdmin: () => {
        return Auth.userProfile && Auth.userProfile.role === 'admin';
    }
};