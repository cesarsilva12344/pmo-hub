require('dotenv').config();
const { Client } = require('pg');

const runReset = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL missing');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        console.log('WARNING: This will delete ALL transactional data (Projects, Tasks, TimeLogs, etc).');
        console.log('Users will remain.');

        const sql = `
            TRUNCATE TABLE 
                public.inbox_items,
                public.time_logs,
                public.task_dependencies,
                public.tasks,
                public.project_risks,
                public.project_milestones,
                public.projects
            RESTART IDENTITY CASCADE;
        `;

        await client.query(sql);
        console.log('✅ Database reset successfully! Ready for Production.');

    } catch (err) {
        if (err.code === '42P01') {
            console.log('Some table did not exist, ignoring... (partial reset)');
        } else {
            console.error('Error resetting DB:', err);
        }
    } finally {
        await client.end();
    }
};

runReset();
