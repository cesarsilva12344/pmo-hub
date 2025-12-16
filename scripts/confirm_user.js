require('dotenv').config();
const { Client } = require('pg');

const confirmUser = async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        console.log('✅ Confirmando email do usuário manualmente...');

        await client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'cesarads96@gmail.com'");

        console.log('✅ Email confirmado no banco!');

    } catch (err) {
        console.error('❌ ERRO:', err.message);
    } finally {
        await client.end();
    }
};

confirmUser();
