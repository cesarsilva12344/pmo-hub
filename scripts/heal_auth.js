require('dotenv').config();
const { Client } = require('pg');

const healAuth = async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('⚕️  Iniciando reparo de permissões do Auth...');

        await client.query('BEGIN');

        // 1. Ensure extensions
        console.log('   - Checando extensões...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions');

        // 2. Grant Permissions to supabase_auth_admin (O usuário interno do GoTrue)
        console.log('   - Garantindo privilégios para supabase_auth_admin...');

        await client.query(`
            GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role, postgres, anon, authenticated;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
            GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;
            
            -- Garantir que o admin possa ver o schema public também (seed pode ter falhado nisso)
            GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
        `);

        // 3. Fix Search Path
        // console.log('   - Ajustando search_path...');
        // await client.query('ALTER ROLE supabase_auth_admin SET search_path = public, auth, extensions;');

        await client.query('COMMIT');
        console.log('✅ Reparo concluído com sucesso!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO NO REPARO:', err.message);
    } finally {
        await client.end();
    }
};

healAuth();
