import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller.js';

const router = Router();
const alunoController = new AlunoController();

//rotas para o CRUD de alunos
router.post('/', alunoController.cadastrar);
router.get('/', alunoController.listar);
router.put('/:id', alunoController.atualizar);

export default router;