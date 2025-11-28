// js/auth.js

if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(window.PMO_CONFIG.SUPABASE_URL, window.PMO_CONFIG.SUPABASE_KEY);
}

window.Auth = {
    userProfile: null,
    originalRole: null,

    signIn: async (email, password) => {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    signUp: async (email, password) => {
        const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    resetPassword: async (email) => {
        const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { 
            redirectTo: window.location.href.replace('login.html', 'index.html') 
        });
        if (error) throw error;
        return data;
    },

    signOut: async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    },

    checkSession: async () => {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (!session && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
            return null;
        }

        if (session) {
            try {
                const { data: profile } = await window.supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
                window.Auth.userProfile = profile || { role: 'gestor' };
                window.Auth.originalRole = window.Auth.userProfile.role;
            } catch (err) {
                console.warn("Perfil não encontrado, usando padrão gestor.");
                window.Auth.userProfile = { role: 'gestor' };
            }
            
            if(window.location.href.includes('login.html')) {
                window.location.href = 'index.html';
            }
        }
        return session;
    },
    
    isAdmin: () => {
        return window.Auth.userProfile && window.Auth.userProfile.role === 'admin';
    },

    switchProfileView: (newRole) => {
        if (window.Auth.originalRole !== 'admin') {
            alert("Apenas administradores podem trocar de visão.");
            return;
        }
        window.Auth.userProfile.role = newRole;
        alert(`Visão alterada para: ${newRole.toUpperCase()}`);
        location.reload(); 
    }
};