require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERRO: DATABASE_URL missing.');
        process.exit(1);
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        console.log('🔌 Connecting...');
        await client.connect();

        const files = ['supabase/migrations/20251211_v5_fix_timesheet.sql'];

        for (const file of files) {
            const filePath = path.join(process.cwd(), file);
            console.log(`\n📄 Processing: ${file}...`);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Not found: ${file}`);
                continue;
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            await client.query(sql);
            console.log(`✅ Executed: ${file}`);
        }
        console.log('\n🎉 V5 Enhancements Applied!');
    } catch (err) {
        console.error('\n❌ Fatal Error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigration();
