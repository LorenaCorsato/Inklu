import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class AlunoController {
  async cadastrar(req: Request, res: Response): Promise<any> {
    try {
      const dadosAluno = req.body;

      // 1. Verifica se o Angular mandou uma foto em Base64
      if (dadosAluno.foto && dadosAluno.foto.startsWith('data:image')) {
        // Limpa o cabeçalho do Base64 e transforma em Buffer (Arquivo real)
        const base64Data = dadosAluno.foto.replace(/^data:image\/\w+;base64,/, "");
        const fotoBuffer = Buffer.from(base64Data, 'base64');
        
        // Cria um nome único para a foto (Ex: 1691234567890-foto.jpg)
        const fileName = `${Date.now()}-foto.jpg`;

        // 2. Faz o upload da foto para o Storage do Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-alunos')
          .upload(fileName, fotoBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error("❌ Erro ao subir foto no Storage:", uploadError);
          return res.status(400).json({ erro: "Erro ao fazer upload da foto." });
        }

        // 3. Pega a URL pública gerada pelo Supabase
        const { data: publicUrlData } = supabase.storage
          .from('fotos-alunos')
          .getPublicUrl(fileName);

        // 4. Substitui o Base64 gigante pela URL bonitinha para salvar na tabela
        dadosAluno.foto = publicUrlData.publicUrl;
      }

      // ==========================================
      // SALVA NO BANCO DE DADOS (Igual antes)
      // ==========================================
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

  // Adicione esta função dentro da classe AlunoController
  async listar(req: Request, res: Response): Promise<any> {
    try {
      // Busca todos os alunos, ordenando pelos mais recentes
      const { data, error } = await supabase
        .from('aluno')
        .select('*')
        .order('data_de_criacao', { ascending: false });

      if (error) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ erro: 'Erro interno ao buscar alunos' });
    }
  }
}