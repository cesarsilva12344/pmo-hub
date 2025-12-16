require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL missing');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        const file = 'supabase/migrations/20251211_v8_gantt_improvements.sql';
        const filePath = path.join(process.cwd(), file);
        console.log(`Processing ${file}...`);

        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`Success: ${file}`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
};

runMigration();
