import express from 'express';
import cors from 'cors';
import alunoRoutes from './routes/aluno.routes';

const app = express();
const port = 3000;

// Middlewares essenciais
app.use(cors()); // Libera o acesso para o Angular (localhost:4200)
app.use(express.json()); // Permite que o servidor entenda o payloadBanco (JSON)

// Rotas da API
app.use('/api/alunos', alunoRoutes);

app.listen(port, () => {
  console.log(`✅ Servidor backend iniciado em http://localhost:${port}`);
});