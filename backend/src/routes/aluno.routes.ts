import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller';

const router = Router();
const alunoController = new AlunoController();

// Quando o Angular chamar POST /api/alunos, o controlador assume
router.post('/', alunoController.cadastrar);

export default router;