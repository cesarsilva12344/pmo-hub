require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Manually map environment variables because in Node.js we don't have Vite's prefixes automatically unless we defined them in .env exactly matching
// The user's .env has VITE_SUPABASE_URL. dotenv loads them, so process.env.VITE_SUPABASE_URL should exist.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔹 URL:', supabaseUrl);
console.log('🔹 Key Length:', supabaseKey ? supabaseKey.length : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('🔐 Tentando login com cesarads96@gmail.com ...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'cesarads96@gmail.com',
        password: 'Brisa@2026'
    });

    if (error) {
        console.error('❌ ERRO DE AUTH:', error.message);
        console.error('   Status:', error.status);
        if (error.message.includes('Database error querying schema')) {
            console.log('⚠️  Este erro geralmente indica que o serviço Auth do Supabase não consegue falar com o Postgres.');
            console.log('   Pode ser permissão, ou o schema "auth" está corrompido/bloqueado.');
        }
    } else {
        console.log('✅ Login bem sucedido!');
        console.log('   User ID:', data.user.id);
        console.log('   Token recebido com sucesso.');
    }
}

testAuth();
