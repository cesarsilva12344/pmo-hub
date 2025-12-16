require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20251210_create_risks.sql'), 'utf8');
        console.log('🚧 Applying migration...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
};

migrate();
