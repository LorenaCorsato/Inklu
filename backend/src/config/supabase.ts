import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Variáveis de ambiente do Supabase não encontradas no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);