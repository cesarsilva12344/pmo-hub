require('dotenv').config();
const { Client } = require('pg');

const cleanUser = async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('🧹 Limpando usuário cesarads96@gmail.com...');

        await client.query("DELETE FROM public.users WHERE email = 'cesarads96@gmail.com'");
        await client.query("DELETE FROM auth.users WHERE email = 'cesarads96@gmail.com'");

        console.log('✅ Usuário removido com sucesso.');

    } catch (err) {
        console.error('❌ ERRO AO LIMPAR:', err.message);
    } finally {
        await client.end();
    }
};

cleanUser();
