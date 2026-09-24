import { Router } from 'express';
import { MateriaController } from '../controllers/materia.controller';

const router = Router();
const materiaController = new MateriaController();

router.get('/', (req, res) => materiaController.Listar(req, res));
router.delete('/:id', (req, res) => materiaController.Excluir(req, res));
router.post('/', (req, res) => materiaController.Adicionar(req, res));
router.put('/:id', (req, res) => materiaController.Atualizar(req, res));
export default router;