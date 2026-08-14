import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller.js';

const router = Router();
const alunoController = new AlunoController();

router.post('/', alunoController.cadastrar);
router.get('/', alunoController.listar);

export default router;