const config = {
    // Suas chaves do Supabase (Carregadas de secrets.js)
    supabaseUrl: typeof SECRETS !== 'undefined' ? SECRETS.SUPABASE_URL : '',
    supabaseAnonKey: typeof SECRETS !== 'undefined' ? SECRETS.SUPABASE_ANON_KEY : '',

    // Seu repositório GitHub
    githubRepoUrl: 'https://github.com/cesarsilva12344/pmo-hub.git',

    // Outros dados
    appName: 'PMO Hub v15.1 Enterprise',
    version: '15.1.0',

    // IA Integration
    geminiApiKey: typeof SECRETS !== 'undefined' ? SECRETS.GEMINI_API_KEY : ''
};

if (typeof SECRETS === 'undefined') {
    console.warn('⚠ SECRETS object not found. Please create js/secrets.js with your API keys.');
}

export default config;