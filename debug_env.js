
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

console.log('--- Checking .env compliance ---');
const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'DATABASE_URL'];

requiredKeys.forEach(key => {
    const value = envConfig[key];
    if (!value) {
        console.log(`[MISSING] ${key}`);
    } else if (value.trim() === '') {
        console.log(`[EMPTY] ${key}`);
    } else {
        // Mask the value for security in logs
        const masked = value.substring(0, 5) + '...' + value.substring(value.length - 3);
        console.log(`[OK] ${key} = ${masked}`);
    }
});

console.log('--- End Check ---');
