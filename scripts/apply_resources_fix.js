require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERRO: DATABASE_URL não definida.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔌 Conectando ao banco...');
        await client.connect();

        const file = 'supabase/migrations/20251211_v8_risks_gtd_settings.sql';
        const filePath = path.join(process.cwd(), file);
        console.log(`\n📄 Aplicando migração: ${file}...`);

        if (!fs.existsSync(filePath)) {
            throw new Error('Arquivo de migração não encontrado!');
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`✅ Migração aplicada com sucesso!`);

    } catch (err) {
        console.error('\n❌ ERRO:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigration();
