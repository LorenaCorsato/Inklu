import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller.js';

const router = Router();
const alunoController = new AlunoController();

//rotas para o CRUD de alunos
router.post('/', alunoController.cadastrar);
router.get('/', alunoController.listar);
router.put('/:id', alunoController.atualizar);
router.delete('/:id', alunoController.excluir);
router.get('/:id', alunoController.buscarPorId);
export default router;