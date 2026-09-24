import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

interface MateriaPayload {
  nome: string;
  descricao?: string;
  area_conhecimento?: string;
}

export class MateriaController {

  async Listar(req: Request, res: Response): Promise<Response> {
    try {
      const { data, error } = await supabase.from('materia').select('*');
      if (error) throw error;
      return res.json(data);
    } catch (error) {
      console.error('Erro ao listar matérias:', error);
      return res.status(500).json({ error: 'Erro ao listar matérias' });
    }
  }

  // Método para Excluir uma matéria (soft delete via status)
  async Excluir(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;
      const { data, error } = await supabase
        .from('materia')
        .update({ status: '2' })
        .eq('id_materia', id)
        .select();

      if (error) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(200).json({ mensagem: 'Matéria excluída com sucesso', data });
    } catch (err) {
      console.error('Erro ao excluir:', err);
      return res.status(500).json({ erro: 'Erro interno ao excluir matéria' });
    }
  }

  async Adicionar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, area_conhecimento } = req.body;
      const { data, error } = await supabase
        .from('materia')
        .insert([{ nome, area_conhecimento, status: '1' }])
        .select();
      if (error) throw error;
      return res.status(201).json({ mensagem: 'Matéria adicionada com sucesso', data });
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      return res.status(500).json({ error: 'Erro ao adicionar matéria' });
    }
  }

  async Atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;
      const { nome, area_conhecimento } = req.body;
      const { data, error } = await supabase
        .from('materia')
        .update({ nome, area_conhecimento })
        .eq('id_materia', id)
        .select();

      if (error) {
        return res.status(400).json({ erro: error.message });
      }
      return res.status(200).json({ mensagem: 'Matéria atualizada com sucesso', data });
    } catch (err) {
      console.error('Erro ao atualizar matéria:', err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar matéria' });
    }
  }
}