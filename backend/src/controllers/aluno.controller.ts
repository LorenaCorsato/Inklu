import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export class AlunoController {
  async cadastrar(req: Request, res: Response): Promise<any> {
    try {
      const dadosAluno = req.body;

      // Inserção direta na tabela 'aluno'
      const { data, error } = await supabase
        .from('aluno')
        .insert([dadosAluno])
        .select();

      if (error) {
        console.error("❌ Erro ao inserir no Supabase:", error);
        return res.status(400).json({ erro: error.message });
      }

      return res.status(201).json(data);
    } catch (err) {
      console.error("❌ Erro interno do servidor:", err);
      return res.status(500).json({ erro: 'Erro interno no servidor' });
    }
  }
}