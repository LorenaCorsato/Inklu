import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Garante que o Node leia o arquivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Atualizamos o nome aqui para bater exatamente com o seu .env!
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Variáveis de ambiente do Supabase não encontradas no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);