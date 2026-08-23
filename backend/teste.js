 //teste.js
// Carrega as variáveis do arquivo .env
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Valida se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não definidas');
    console.log('   URL presente:', !!supabaseUrl);
    console.log('   KEY presente:', !!supabaseKey);
    process.exit(1);
}

console.log('✅ Variáveis de ambiente carregadas com sucesso');

// Inicializa o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexao() {
    console.log('\n📡 Testando conexão com Supabase...\n');

    try {
        // Testa a busca de dados da tabela
        console.log('1️⃣  Consultando tabela "aluno"...');
        const { data, error } = await supabase
            .from('aluno')
            .select('*')
            .limit(5);

        if (error) {
            throw new Error(`Erro ao consultar: ${error.message}`);
        }

        console.log(`✅ Sucesso! ${data.length} registro(s) encontrado(s):`);
        console.log(JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('❌ Erro na conexão:', err.message);
        process.exit(1);
    }
}

// Executa os testes
testarConexao();