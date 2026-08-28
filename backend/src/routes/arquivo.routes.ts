
import { Router } from 'express';
import { ArquivoController } from '../controllers/arquivo.controller.js';

const router = Router();
const arquivoController = new ArquivoController();

router.post('/alunos/:alunoId', (req, res) => arquivoController.cadastrar(req, res));
router.get('/alunos/:alunoId', (req, res) => arquivoController.listarPorAluno(req, res));
router.delete('/:id', (req, res) => arquivoController.excluir(req, res));

export default router;