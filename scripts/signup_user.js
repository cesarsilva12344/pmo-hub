require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function signup() {
    console.log('📝 Criando usuário via API Pública...');

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email: 'cesarads96@gmail.com',
        password: 'Brisa@2026',
        options: {
            data: {
                full_name: 'Cesar Silva',
                role: 'admin' // Note: This goes to user_metadata, manual sync to public table might be needed if triggers aren't set
            }
        }
    });

    if (error) {
        console.error('❌ ERRO NO SIGNUP:', error.message);
    } else {
        console.log('✅ Usuário criado com sucesso!', data.user.id);
        console.log('   Verifique se o email de confirmação foi enviado (se autoconfirm não estiver ativo).');
    }
}

signup();
