import { Request, Response } from 'express'; 
import { supabase } from '../config/supabase'; 

export class AlunoController {   
  async cadastrar(req: Request, res: Response): Promise<any> {     
    try {       
      const dadosAluno = req.body;       
      
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
          console.error("  Erro ao subir foto no Storage:", uploadError);           
          return res.status(400).json({ erro: "Erro ao fazer upload da foto." });         
        }         
        
        const { data: publicUrlData } = supabase.storage           
          .from('fotos-alunos')           
          .getPublicUrl(fileName);         
          
        dadosAluno.foto = publicUrlData.publicUrl;       
      }       

      const { data, error } = await supabase         
        .from('aluno')         
        .insert([dadosAluno])         
        .select();       
        
      if (error) {         
        console.error("  Erro ao inserir no Supabase:", error);         
        return res.status(400).json({ erro: error.message });       
      }       
      
      return res.status(201).json(data);     
      
    } catch (err) {       
      console.error("  Erro interno do servidor:", err);       
      return res.status(500).json({ erro: 'Erro interno no servidor' });     
    }
  } 

  // Adicione este método dentro da classe AlunoController
  async atualizar(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id; // Pega o ID da URL
      const dadosAluno = req.body;

      // Se enviou uma foto nova em Base64
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

      // Faz o UPDATE no banco
      const { data, error } = await supabase
        .from('aluno')
        .update(dadosAluno)
        .eq('id', id)
        .select();

      if (error) {
        return res.status(400).json({ erro: error.message });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar aluno' });
    }
  }

  async listar(req: Request, res: Response): Promise<any> {     
    try {       
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