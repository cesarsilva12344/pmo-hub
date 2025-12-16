require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL missing in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔌 Connecting...');
        await client.connect();

        const file = 'supabase/migrations/20251211_create_milestones.sql';
        const filePath = path.join(process.cwd(), file);

        console.log(`\n📄 Applying: ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query(sql);
        console.log(`✅ Success! Table 'project_milestones' should exist now.`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
};

runMigration();
