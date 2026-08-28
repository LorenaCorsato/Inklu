import { Request, Response } from 'express'; 
import { supabase } from '../config/supabase';

export class AlunoController {   
  
  async cadastrar(req: Request, res: Response): Promise<any> {     
    try {       
      // Extraindo os responsáveis do payload para não conflitar com a tabela aluno
      const { responsaveis, ...dadosAluno } = req.body;       
      
      dadosAluno.status = dadosAluno.status || 1;

      if (dadosAluno.foto && dadosAluno.foto.startsWith('data:image')) {         
        const base64Data = dadosAluno.foto.replace(/^data:image\/\w+;base64,/, "");         
        const fotoBuffer = Buffer.from(base64Data, 'base64');                  
        const fileName = `${Date.now()}-foto.jpg`;         
        
        const { data: uploadData, error: uploadError } = await supabase.storage           
          .from('fotos-alunos')           
          .upload(fileName, fotoBuffer, {             
            contentType: 'image/jpeg',             
            upsert: false           
          });         
          
        if (uploadError) {           
          console.error("Erro ao subir foto no Storage:", uploadError);           
          return res.status(400).json({ erro: "Erro ao fazer upload da foto." });         
        }         
        
        const { data: publicUrlData } = supabase.storage           
          .from('fotos-alunos')           
          .getPublicUrl(fileName);         
          
        dadosAluno.foto = publicUrlData.publicUrl;       
      }       

      // 1. Cadastra o aluno
      const { data: alunoData, error: alunoError } = await supabase         
        .from('aluno')         
        .insert([dadosAluno])         
        .select();       
        
      if (alunoError) {         
        console.error("Erro ao inserir aluno no Supabase:", alunoError);         
        return res.status(400).json({ erro: alunoError.message });       
      }       

      const alunoId = alunoData[0].id; // Pegando a FK recém gerada

      // 2. Cadastra os responsáveis associados
      if (responsaveis && responsaveis.length > 0) {
        // Formata para bater com as colunas do seu banco
        const responsaveisPayload = responsaveis.map((r: any) => ({
          id_aluno: alunoId, 
          nome: r.nome,
          parentesco: r.parentesco,
          email: r.email,
          telefone: r.telefone
        }));

        const { error: responsavelError } = await supabase
          .from('responsaveis')
          .insert(responsaveisPayload);

        if (responsavelError) {
          console.error("Erro ao inserir responsaveis:", responsavelError);
        }
      }
      
      return res.status(201).json(alunoData);     
      
    } catch (err) {       
      console.error("Erro interno do servidor:", err);       
      return res.status(500).json({ erro: 'Erro interno no servidor' });     
    }
  } 

  async atualizar(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id; 
      const { responsaveis, ...dadosAluno } = req.body;

      if (dadosAluno.foto && dadosAluno.foto.startsWith('data:image')) {
        const base64Data = dadosAluno.foto.replace(/^data:image\/\w+;base64,/, "");
        const fotoBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `${Date.now()}-foto.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-alunos')
          .upload(fileName, fotoBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          return res.status(400).json({ erro: "Erro ao fazer upload da foto." });
        }

        const { data: publicUrlData } = supabase.storage
          .from('fotos-alunos')
          .getPublicUrl(fileName);

        dadosAluno.foto = publicUrlData.publicUrl;
      }

      // Atualiza os dados do Aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('aluno')
        .update(dadosAluno)
        .eq('id', id)
        .select();

      if (alunoError) {
        return res.status(400).json({ erro: alunoError.message });
      }

      // Atualiza os responsáveis (limpa os antigos e adiciona os novos editados)
      if (responsaveis) {
        await supabase.from('responsaveis').delete().eq('id_aluno', id);

        if (responsaveis.length > 0) {
          const responsaveisPayload = responsaveis.map((r: any) => ({
            id_aluno: id,
            nome: r.nome,
            parentesco: r.parentesco,
            email: r.email,
            telefone: r.telefone
          }));

          await supabase.from('responsaveis').insert(responsaveisPayload);
        }
      }

      return res.status(200).json(alunoData);
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar aluno' });
    }
  }

  async listar(req: Request, res: Response): Promise<any> {     
    try {       
      const { data, error } = await supabase         
        .from('aluno')         
        .select('*, turma(*)')         
        .order('data_de_criacao', { ascending: false });       
        
      if (error) {         
        return res.status(400).json({ erro: error.message });       
      }       
      
      return res.status(200).json(data);     
      
    } catch (err) {       
      return res.status(500).json({ erro: 'Erro interno ao buscar alunos' });     
    }
  } 

  async excluir(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id;

      const { data, error } = await supabase
        .from('aluno')
        .update({ status: 2 })
        .eq('id', id)
        .select();

      if (error) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(200).json({ mensagem: 'Aluno inativado com sucesso', data });
    } catch (err) {
      console.error('Erro ao excluir:', err);
      return res.status(500).json({ erro: 'Erro interno ao excluir aluno' });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id;

      // O 'responsaveis(*)' e 'turma(*)' fazem o JOIN automático do Supabase
      const { data, error } = await supabase
        .from('aluno')
        .select('*, responsaveis(*), turma(*)') 
        .eq('id', id)
        .single(); 

      if (error) {
        console.error("Erro ao buscar aluno por ID no Supabase:", error);
        return res.status(400).json({ erro: error.message });
      }

      if (!data) {
        return res.status(404).json({ erro: 'Aluno não encontrado' });
      }

      return res.status(200).json(data);

    } catch (err) {
      console.error("Erro interno ao buscar aluno por ID:", err);
      return res.status(500).json({ erro: 'Erro interno ao buscar detalhes do aluno' });
    }
  }
}