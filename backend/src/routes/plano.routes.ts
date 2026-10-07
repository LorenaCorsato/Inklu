import { Router, Request, Response, NextFunction } from 'express';
import { PlanoService } from '../services/plano.service';
import { DocumentGeneratorService } from '../services/document-generator.service';
import { PlanoError, tipoPlano } from '../models/plano.model';

export function createPlanoRouter(service: PlanoService, generator = new DocumentGeneratorService()) {
  const router = Router({ mergeParams: true });
  const alunoId = (req: Request) => String(req.params.alunoId);
  router.get('/', async (req, res) => { res.json(await service.list(alunoId(req))); });
  router.get('/:tipo/modelo', async (req, res) => {
    const type = tipoPlano(req.params.tipo);
    const { bimestre, ano } = service.period({ bimestre: req.query.bimestre, anoLetivo: Number(req.query.anoLetivo) });
    const content = await service.fresh(alunoId(req), type);
    res.json(await service.editable(alunoId(req), type, content, bimestre, ano));
  });
  router.post('/:tipo/importar', async (req, res) => { res.json(await service.import(alunoId(req), tipoPlano(req.params.tipo), req.body ?? {})); });
  router.get('/:tipo/:id', async (req, res) => { res.json((await service.get(alunoId(req), tipoPlano(req.params.tipo), String(req.params.id))).document); });
  router.post('/:tipo', async (req, res) => { res.status(req.body?.saveMode === 'overwrite' ? 200 : 201).json(await service.save(alunoId(req), tipoPlano(req.params.tipo), req.body ?? {})); });
  router.post('/:tipo/:id/exportar', async (req, res) => {
    const format = req.body?.format;
    if (format !== 'pdf' && format !== 'docx' && format !== 'html') throw new PlanoError(400, 'Formato de exportação inválido.');
    const { document } = await service.get(alunoId(req), tipoPlano(req.params.tipo), String(req.params.id));
    const buffer = await generator.generateFromHtml(document.htmlContent, format, document.name);
    const mime = format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/html;charset=utf-8';
    const name = `${document.name.replace(/\.(docx|pdf)$/i, '')}_versao_${document.versionNumber}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${name}.${format}"`);
    res.send(buffer);
  });
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof PlanoError) { res.status(error.status).json({ erro: error.message }); return; }
    console.error('Erro no fluxo de planos:', error);
    res.status(500).json({ erro: 'Não foi possível processar o plano.' });
  });
  return router;
}
