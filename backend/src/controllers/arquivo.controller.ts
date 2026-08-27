import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

interface ArquivoPayload {
	nomeArquivo?: string;
	tipoArquivo?: string;
	arquivo?: string;
	tipoMaterial?: string;
	idUsuario?: number | string | null;
}

export class ArquivoController {
	async cadastrar(req: Request, res: Response): Promise<Response> {
		try {
			const { alunoId } = req.params;
			const {
				nomeArquivo,
				tipoArquivo,
				arquivo,
				tipoMaterial = 'original',
				idUsuario = null,
			} = req.body as ArquivoPayload;

			if (!alunoId || !nomeArquivo || !arquivo) {
				return res.status(400).json({
					erro: 'alunoId, nomeArquivo e arquivo são obrigatórios.',
				});
			}

			const { data: aluno, error: alunoError } = await supabase
				.from('aluno')
				.select('id')
				.eq('id', alunoId)
				.maybeSingle();

			if (alunoError) {
				return res.status(400).json({ erro: alunoError.message });
			}

			if (!aluno) {
				return res.status(404).json({ erro: 'Aluno não encontrado.' });
			}

			const base64Data = arquivo.replace(/^data:[^;]+;base64,/, '');
			const arquivoBuffer = Buffer.from(base64Data, 'base64');
			const nomeSeguro = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
			const caminhoArquivo = `${alunoId}/${Date.now()}-${nomeSeguro}`;

			const { error: uploadError } = await supabase.storage
				.from('material-alunos')
				.upload(caminhoArquivo, arquivoBuffer, {
					contentType: tipoArquivo || 'application/octet-stream',
					upsert: false,
				});

			if (uploadError) {
				console.error('Erro ao subir material no Storage:', uploadError);
				return res.status(400).json({ erro: 'Erro ao fazer upload do material.' });
			}

			const { data: urlData } = supabase.storage
				.from('material-alunos')
				.getPublicUrl(caminhoArquivo);

			const { data: material, error: materialError } = await supabase
				.from('material')
				.insert({
					id_aluno: alunoId,
					id_materia: null,
					id_usuario: null,
					nome_do_arquivo: nomeArquivo,
					tipo_do_arquivo: tipoArquivo || 'application/octet-stream',
					url_do_arquivo: urlData.publicUrl,
					tipo_de_material: tipoMaterial,
					data_de_upload: new Date().toISOString(),
				})
				.select()
				.single();

			if (materialError) {
				await supabase.storage.from('material-alunos').remove([caminhoArquivo]);
				console.error('Erro ao registrar material:', materialError);
				return res.status(400).json({ erro: materialError.message });
			}

			return res.status(201).json(material);
		} catch (error) {
			console.error('Erro interno ao cadastrar material:', error);
			return res.status(500).json({ erro: 'Erro interno ao cadastrar material.' });
		}
	}

	async listarPorAluno(req: Request, res: Response): Promise<Response> {
		try {
			const { alunoId } = req.params;
			const { data, error } = await supabase
				.from('material')
				.select('*')
				.eq('id_aluno', alunoId);

			if (error) {
				return res.status(400).json({ erro: error.message });
			}

			return res.status(200).json(data);
		} catch (error) {
			console.error('Erro ao listar materiais:', error);
			return res.status(500).json({ erro: 'Erro interno ao listar materiais.' });
		}
	}

	async excluir(req: Request, res: Response): Promise<Response> {
		try {
			const { id } = req.params;
			const { error } = await supabase.from('material').delete().eq('id_material', id);

			if (error) {
				return res.status(400).json({ erro: error.message });
			}

			return res.status(204).send();
		} catch (error) {
			console.error('Erro ao excluir material:', error);
			return res.status(500).json({ erro: 'Erro interno ao excluir material.' });
		}
	}
}
