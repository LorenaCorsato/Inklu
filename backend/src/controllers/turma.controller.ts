import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class TurmaController {
  async listar(req: Request, res: Response): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('turma')
        .select('*')
        .order('serie', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error("Erro interno ao buscar turmas:", err);
      return res.status(500).json({ erro: 'Erro interno ao buscar turmas' });
    }
  }
}
