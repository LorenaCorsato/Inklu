import type { Request, Response } from 'express';
import { supabase } from '../config/supabase';

interface TurmaPayload {
  nome: string;
  serie: string;
  periodo: string;
  ano: number;
  qtd_alunos: string;
  status: number;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const possui = (objeto: object, campo: string) => Object.prototype.hasOwnProperty.call(objeto, campo);
// Os registros anteriores ao CRUD não possuem status preenchido.
const normalizarStatus = <T extends { status?: number | string | null }>(turma: T) => ({
  ...turma,
  status: Number(turma.status ?? 1),
});

function validarPayload(body: unknown, parcial: boolean) {
  const dados: Partial<TurmaPayload> = {};
  const erros: string[] = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { dados, erros: ['Envie um objeto JSON com os dados da turma'] };
  }

  const entrada = body as Record<string, unknown>;
  for (const campo of ['nome', 'serie'] as const) {
    if (!parcial || possui(entrada, campo)) {
      const valor = entrada[campo];
      if (typeof valor !== 'string' || !valor.trim()) {
        erros.push(`${campo} deve ser um texto não vazio`);
      } else {
        dados[campo] = valor.trim();
      }
    }
  }

  if (!parcial || possui(entrada, 'periodo')) {
    const periodo = entrada.periodo;
    if (typeof periodo !== 'string' || !periodo.trim()) {
      erros.push('periodo deve ser um texto não vazio');
    } else {
      dados.periodo = periodo.trim();
    }
  }

  if (!parcial || possui(entrada, 'ano')) {
    if (typeof entrada.ano !== 'number' || !Number.isInteger(entrada.ano) || entrada.ano < 1 || entrada.ano > 9999) {
      erros.push('ano deve ser um número inteiro entre 1 e 9999');
    } else {
      dados.ano = entrada.ano;
    }
  }

  if (!parcial || possui(entrada, 'qtd_alunos')) {
    const valor = entrada.qtd_alunos;
    const quantidade = typeof valor === 'string' && /^\d+$/.test(valor.trim())
      ? Number(valor.trim()) : valor;
    if (typeof quantidade !== 'number' || !Number.isSafeInteger(quantidade) || quantidade < 0) {
      erros.push('qtd_alunos deve ser um número inteiro maior ou igual a zero');
    } else {
      // A quantidade é informada no cadastro; a coluna do Supabase é text.
      dados.qtd_alunos = String(quantidade);
    }
  }

  if (possui(entrada, 'status')) {
    if (entrada.status !== 1 && entrada.status !== 2) {
      erros.push('status deve ser 1 (ativa) ou 2 (inativa)');
    } else if (!parcial && entrada.status !== 1) {
      erros.push('Uma nova turma deve ser cadastrada como ativa');
    } else {
      dados.status = entrada.status;
    }
  }

  if (parcial && Object.keys(dados).length === 0 && erros.length === 0) {
    erros.push('Informe ao menos um campo da turma para atualizar');
  }
  return { dados, erros };
}

export class TurmaController {
  private obterTurma(id: string) {
    return supabase.from('turma').select('*').eq('id_turma', id).maybeSingle();
  }

  private obterAlunos(id: string) {
    return supabase.from('aluno')
      .select('id, nome_completo, status', { count: 'exact' })
      .eq('id_turma', id);
  }

  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const { ano, status, periodo } = req.query;
      if (ano !== undefined && (typeof ano !== 'string' || !/^\d{1,4}$/.test(ano) || Number(ano) < 1)) {
        return res.status(400).json({ erro: 'ano deve ser um número inteiro entre 1 e 9999' });
      }
      if (periodo !== undefined && (typeof periodo !== 'string' || !periodo.trim())) {
        return res.status(400).json({ erro: 'periodo deve ser um texto não vazio' });
      }
      if (status !== undefined && status !== '1' && status !== '2') {
        return res.status(400).json({ erro: 'status deve ser 1 (ativa) ou 2 (inativa)' });
      }

      let consulta = supabase
        .from('turma')
        .select('*')
        .order('serie', { ascending: true })
        .order('nome', { ascending: true });
      if (ano !== undefined) consulta = consulta.eq('ano', Number(ano));
      if (typeof periodo === 'string') consulta = consulta.eq('periodo', periodo.trim());
      if (status === '1') consulta = consulta.or('status.eq.1,status.is.null');
      if (status === '2') consulta = consulta.eq('status', 2);
      const { data, error } = await consulta;
      if (error) {
        return res.status(400).json({ erro: error.message });
      }
      return res.status(200).json((data ?? []).map(normalizarStatus));
    } catch (err) {
      console.error('Erro interno ao buscar turmas:', err);
      return res.status(500).json({ erro: 'Erro interno ao buscar turmas' });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;
    if (!uuid.test(id)) return res.status(400).json({ erro: 'id_turma deve ser um UUID válido' });
    try {
      const { data, error } = await this.obterTurma(id);
      if (error) return res.status(400).json({ erro: error.message });
      if (!data) return res.status(404).json({ erro: 'Turma não encontrada' });
      return res.status(200).json(normalizarStatus(data));
    } catch (err) {
      console.error('Erro ao buscar turma:', err);
      return res.status(500).json({ erro: 'Erro interno ao buscar turma' });
    }
  }

  async adicionar(req: Request, res: Response): Promise<Response> {
    const { dados, erros } = validarPayload(req.body, false);
    if (erros.length) return res.status(400).json({ erro: 'Dados da turma inválidos', detalhes: erros });
    try {
      const { data, error } = await supabase.from('turma')
        .insert([{ ...dados, status: 1 }]).select();
      if (error) return res.status(400).json({ erro: error.message });
      return res.status(201).json({ mensagem: 'Turma adicionada com sucesso', data });
    } catch (err) {
      console.error('Erro ao adicionar turma:', err);
      return res.status(500).json({ erro: 'Erro interno ao adicionar turma' });
    }
  }

  async atualizar(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;
    if (!uuid.test(id)) return res.status(400).json({ erro: 'id_turma deve ser um UUID válido' });
    const { dados, erros } = validarPayload(req.body, true);
    if (erros.length) return res.status(400).json({ erro: 'Dados da turma inválidos', detalhes: erros });
    try {
      const { data: turma, error: erroBusca } = await this.obterTurma(id);
      if (erroBusca) return res.status(400).json({ erro: erroBusca.message });
      if (!turma) return res.status(404).json({ erro: 'Turma não encontrada' });
      if (dados.status !== undefined) {
        const statusAtual = normalizarStatus(turma).status;
        if (dados.status !== statusAtual && statusAtual !== 2) {
          return res.status(400).json({
            erro: 'O status só pode ser editado quando a turma está inativa. Para inativar, use DELETE.',
          });
        }
        // Reenviar o status atual não representa uma mudança de status.
        if (dados.status === statusAtual) delete dados.status;
      }
      if (Object.keys(dados).length === 0) {
        return res.status(200).json({
          mensagem: 'Turma atualizada com sucesso', data: [normalizarStatus(turma)],
        });
      }
      const { data, error } = await supabase.from('turma')
        .update(dados).eq('id_turma', id).select();
      if (error) return res.status(400).json({ erro: error.message });
      if (!data?.length) return res.status(404).json({ erro: 'Turma não encontrada' });
      return res.status(200).json({
        mensagem: 'Turma atualizada com sucesso', data: data.map(normalizarStatus),
      });
    } catch (err) {
      console.error('Erro ao atualizar turma:', err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar turma' });
    }
  }

  async verificarDependencias(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;
    if (!uuid.test(id)) return res.status(400).json({ erro: 'id_turma deve ser um UUID válido' });
    try {
      const { data: turma, error: erroBusca } = await this.obterTurma(id);
      if (erroBusca) return res.status(400).json({ erro: erroBusca.message });
      if (!turma) return res.status(404).json({ erro: 'Turma não encontrada' });
      const { data: alunos, count, error } = await this.obterAlunos(id);
      if (error) return res.status(400).json({ erro: error.message });
      const quantidadeAlunos = count ?? alunos?.length ?? 0;
      return res.status(200).json({
        temDependencias: quantidadeAlunos > 0, quantidadeAlunos, alunos: alunos ?? [],
      });
    } catch (err) {
      console.error('Erro ao verificar dependências da turma:', err);
      return res.status(500).json({ erro: 'Erro interno ao verificar dependências da turma' });
    }
  }

  async excluir(req: Request, res: Response): Promise<Response> {
    const id = req.params.id as string;
    if (!uuid.test(id)) return res.status(400).json({ erro: 'id_turma deve ser um UUID válido' });
    const { confirmar } = req.query;
    if (confirmar !== undefined && confirmar !== 'true' && confirmar !== 'false') {
      return res.status(400).json({ erro: 'confirmar deve ser true ou false' });
    }
    try {
      const { data: turma, error: erroBusca } = await this.obterTurma(id);
      if (erroBusca) return res.status(400).json({ erro: erroBusca.message });
      if (!turma) return res.status(404).json({ erro: 'Turma não encontrada' });
      if (normalizarStatus(turma).status === 2) {
        return res.status(200).json({ mensagem: 'Turma já está inativa', data: [normalizarStatus(turma)] });
      }
      const { data: alunos, count, error: erroAlunos } = await this.obterAlunos(id);
      if (erroAlunos) return res.status(400).json({ erro: erroAlunos.message });
      const quantidadeAlunos = count ?? alunos?.length ?? 0;
      if (quantidadeAlunos > 0 && confirmar !== 'true') {
        return res.status(409).json({
          erro: 'A turma possui alunos vinculados. Confirme a inativação com confirmar=true.',
          requerConfirmacao: true, temDependencias: true, quantidadeAlunos, alunos: alunos ?? [],
        });
      }
      // Inativa apenas a turma, preservando os alunos e seus vínculos.
      const { data, error } = await supabase.from('turma')
        .update({ status: 2 }).eq('id_turma', id).select();
      if (error) return res.status(400).json({ erro: error.message });
      if (!data?.length) return res.status(404).json({ erro: 'Turma não encontrada' });
      return res.status(200).json({ mensagem: 'Turma inativada com sucesso', data: data.map(normalizarStatus) });
    } catch (err) {
      console.error('Erro ao inativar turma:', err);
      return res.status(500).json({ erro: 'Erro interno ao inativar turma' });
    }
  }
}
