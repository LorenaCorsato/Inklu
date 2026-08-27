import { Router } from 'express';
import { TurmaController } from '../controllers/turma.controller';

const router = Router();
const turmaController = new TurmaController();

router.get('/', turmaController.listar);

export default router;
