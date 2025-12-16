require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    // Verificar se a DATABASE_URL está definida
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERRO: A variável de ambiente DATABASE_URL não está definida.');
        console.error('👉 Por favor, crie um arquivo .env na raiz do projeto e adicione sua string de conexão.');
        console.error('   Exemplo: DATABASE_URL=postgresql://postgres:senha@db.ref.supabase.co:5432/postgres');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔌 Conectando ao banco de dados...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');

        // Arquivos a serem executados na ordem
        const files = [
            'supabase/schema.sql',
            'supabase/seed.sql',
            'supabase/seed_admin.sql'
        ];

        for (const file of files) {
            const filePath = path.join(process.cwd(), file);
            console.log(`\n📄 Processando arquivo: ${file}...`);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Aviso: Arquivo não encontrado: ${file}. Pulando.`);
                continue;
            }

            const sql = fs.readFileSync(filePath, 'utf8');
            if (!sql.trim()) {
                 console.log(`   Arquivo vazio. Pulando.`);
                 continue;
            }

            // Executando o SQL
            // Nota: Para arquivos grandes ou com múltiplos comandos complexos, pode ser necessário dividir,
            // mas o driver 'pg' costuma lidar bem com strings contendo múltiplos comandos separados por ;
            await client.query(sql);
            console.log(`✅ Arquivo executado com sucesso: ${file}`);
        }

        console.log('\n🎉 Migração concluída com sucesso!');

    } catch (err) {
        console.error('\n❌ ERRO FATAL durante a migração:');
        console.error(err.message);
        if (err.code) console.error(`   Code: ${err.code}`);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigration();
