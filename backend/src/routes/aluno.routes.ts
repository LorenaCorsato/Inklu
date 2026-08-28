import { Router } from 'express';
import { AlunoController } from '../controllers/aluno.controller';

const router = Router();
const alunoController = new AlunoController();

// rotas para o CRUD de alunos usando arrow functions para não perder o contexto (this)
router.post('/', (req, res) => alunoController.cadastrar(req, res));
router.get('/', (req, res) => alunoController.listar(req, res));
router.put('/:id', (req, res) => alunoController.atualizar(req, res));
router.delete('/:id', (req, res) => alunoController.excluir(req, res));
router.get('/:id', (req, res) => alunoController.buscarPorId(req, res));

export default router;