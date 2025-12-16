const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.log('❌ ARQUIVO .env NÃO ENCONTRADO!');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const geminiKey = envConfig.VITE_GEMINI_API_KEY;

console.log('--- Relatório de Validação de Ambiente ---');

if (!geminiKey) {
    console.log('❌ VITE_GEMINI_API_KEY: Ausente/Vazia.');
    console.log('   Certifique-se de adicionar: VITE_GEMINI_API_KEY=sua_chave');
} else {
    // Basic heuristics for Gemini keys (they usually start with AIza)
    if (geminiKey.startsWith('AIza')) {
        console.log('✅ VITE_GEMINI_API_KEY: Encontrada e parece válida (começa com AIza).');
    } else {
        console.log('⚠️ VITE_GEMINI_API_KEY: Encontrada, mas o formato parece atípico (não começa com AIza). Verifique se copiou corretamente.');
    }
    console.log(`   (Comprimento da chave: ${geminiKey.length} caracteres)`);
}

console.log('------------------------------------------');
