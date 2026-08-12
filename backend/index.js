// Importações necessárias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors()); // Permite que o Angular faça requisições
app.use(express.json()); // Permite que o Node entenda JSON

// Configuração do Supabase 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

// ROTA PARA CADASTRAR ALUNO
app.post('/api/alunos', async (req, res) => {
    try {
        // Pega os dados enviados pelo Angular
        const dadosAluno = req.body;

        // Insere na tabela 'aluno'
        const { data, error } = await supabase
            .from('aluno')
            .insert([dadosAluno])
            .select(); // O .select() faz retornar os dados criados (incluindo o ID gerado)

        if (error) {
            return res.status(400).json({ erro: error.message });
        }

        // Retorna sucesso e os dados do aluno cadastrado
        return res.status(201).json(data);
    } catch (err) {
        return res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Backend rodando na porta 3000');
});