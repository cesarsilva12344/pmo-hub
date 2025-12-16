require('dotenv').config();
const { Client } = require('pg');

const testConnection = async () => {
    console.log('🔌 Testando conexão direto com Postgres...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Conexão estabelecida!');

        console.log('🔍 Buscando tabelas públicas...');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log('📊 Tabelas encontradas:', res.rows.map(r => r.table_name).join(', '));

        console.log('🔍 Testando SELECT em projects...');
        const projects = await client.query('SELECT name, status FROM projects LIMIT 5');
        console.table(projects.rows);

        console.log('✅ Teste concluído sem erros de banco!');

    } catch (err) {
        console.error('❌ ERRO:', err.message);
    } finally {
        await client.end();
    }
};

testConnection();
