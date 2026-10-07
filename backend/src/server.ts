import express from 'express';
import cors from 'cors';
import alunoRoutes from './routes/aluno.routes';
import arquivoRoutes from './routes/arquivo.routes';
import turmaRoutes from './routes/turma.routes';
import materiaRoutes from './routes/materia.routes';
import { createPlanoRouter } from './routes/plano.routes';
import { PlanoService } from './services/plano.service';
import { supabase } from './config/supabase';

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use('/api/alunos/:alunoId/planos', createPlanoRouter(new PlanoService(supabase)));
app.use('/api/alunos', alunoRoutes);
app.use('/api/arquivos', arquivoRoutes);
app.use('/api/turmas', turmaRoutes);
app.use('/api/materias', materiaRoutes);

app.listen(port, () => {
  console.log(`✅ Servidor backend iniciado em http://localhost:${port}`);
});
