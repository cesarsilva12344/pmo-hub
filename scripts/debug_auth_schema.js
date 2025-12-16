require('dotenv').config();
const { Client } = require('pg');

const debugAuth = async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('🔌 Conectado (Admin). Checando schema "auth"...');

        // 1. Check if auth schema exists
        const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'");
        if (schemaRes.rows.length === 0) {
            console.error('❌ CRÍTICO: Schema "auth" NÃO EXISTE!');
            return;
        }
        console.log('✅ Schema "auth" existe.');

        // 2. Check if auth.users table exists
        const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'");
        if (tableRes.rows.length === 0) {
            console.error('❌ CRÍTICO: Tabela "auth.users" NÃO EXISTE!');
            return;
        }
        console.log('✅ Tabela "auth.users" existe.');

        // 3. Check specific user
        const userRes = await client.query("SELECT id, email, encrypted_password, last_sign_in_at FROM auth.users WHERE email = 'cesarads96@gmail.com'");
        if (userRes.rows.length === 0) {
            console.error('⚠️ Usuário NÃO encontrado em auth.users (mas isso daria erro de "credentials invalid", não "querying schema").');
        } else {
            console.log('✅ Usuário encontrado:', userRes.rows[0]);
        }

        // 4. Check permissions (basic)
        console.log('🔍 Tentando Grant de permissões básicas...');
        await client.query(`
            GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
            GRANT SELECT ON ALL TABLES IN SCHEMA auth TO postgres, service_role, dashboard_user;
            -- Nota: GoTrue usa o role 'supabase_auth_admin' internamente.
        `);
        console.log('✅ Permissões de Usage reaplicadas.');

    } catch (err) {
        console.error('❌ ERRO SQL:', err.message);
    } finally {
        await client.end();
    }
};

debugAuth();
