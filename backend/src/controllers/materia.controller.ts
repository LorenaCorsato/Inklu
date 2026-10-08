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

  // Verifica se a matéria possui dependências antes de inativar e retorna os registros associados
  async VerificarDependencias(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id;

      // Busca materiais vinculados, incluindo o nome do arquivo e o nome do aluno (via join)
      const { data: materiais, error: errMaterial } = await supabase
        .from('material')
        .select('id_material, nome_do_arquivo, tipo_de_material, aluno:id_aluno(id, nome_completo)')
        .eq('id_materia', id);

      if (errMaterial) {
        return res.status(400).json({ erro: errMaterial.message });
      }

      // Busca professores de apoio vinculados, incluindo nome via join com usuario
      const { data: professores, error: errProfessor } = await supabase
        .from('professor_apoio')
        .select('id_professor_apoio, status, usuario:id_usuario(id_usuario, nome)')
        .eq('id_materia', id)
        .neq('status', '2'); // Ignora professores já inativados

      if (errProfessor) {
        return res.status(400).json({ erro: errProfessor.message });
      }

      const quantidadeMateriais = materiais?.length ?? 0;
      const quantidadeProfessores = professores?.length ?? 0;
      const temDependencias = quantidadeMateriais > 0 || quantidadeProfessores > 0;

      return res.status(200).json({
        temDependencias,
        quantidadeMateriais,
        quantidadeProfessores,
        materiais: materiais ?? [],
        professores: professores ?? [],
      });
    } catch (err) {
      console.error('Erro ao verificar dependências:', err);
      return res.status(500).json({ erro: 'Erro interno ao verificar dependências' });
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
      const { nome, area_conhecimento, status } = req.body as {
        nome?: unknown;
        area_conhecimento?: unknown;
        status?: unknown;
      };
      const update: { nome?: string; area_conhecimento?: string; status?: string } = {};

      if (nome !== undefined) {
        if (typeof nome !== 'string' || !nome.trim()) {
          return res.status(400).json({ erro: 'nome deve ser um texto não vazio' });
        }
        update.nome = nome.trim();
      }
      if (area_conhecimento !== undefined) {
        if (typeof area_conhecimento !== 'string') {
          return res.status(400).json({ erro: 'area_conhecimento deve ser um texto' });
        }
        update.area_conhecimento = area_conhecimento.trim();
      }
      if (status !== undefined) {
        const statusStr = String(status);
        if (statusStr !== '1' && statusStr !== '2') {
          return res.status(400).json({ erro: 'status deve ser 1 (ativa) ou 2 (inativa)' });
        }
        update.status = statusStr;
      }
      if (Object.keys(update).length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos um campo da matéria para atualizar' });
      }

      const { data, error } = await supabase
        .from('materia')
        .update(update)
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
