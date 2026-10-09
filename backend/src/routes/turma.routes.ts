import { Router } from 'express';
import { TurmaController } from '../controllers/turma.controller';

const router = Router();
const turmaController = new TurmaController();

router.get('/', (req, res) => turmaController.listar(req, res));
router.get('/:id/verificar-dependencias', (req, res) => turmaController.verificarDependencias(req, res));
router.get('/:id', (req, res) => turmaController.buscarPorId(req, res));
router.post('/', (req, res) => turmaController.adicionar(req, res));
router.put('/:id', (req, res) => turmaController.atualizar(req, res));
router.delete('/:id', (req, res) => turmaController.excluir(req, res));

export default router;
