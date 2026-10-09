import { Routes } from '@angular/router';
import { Alunos } from './alunos/alunos';
import { AdicionarAluno } from './alunos/adicionar-aluno/adicionar-aluno';
import { EditarAluno } from './alunos/editar-aluno/editar-aluno';
import { DetalheAluno } from './alunos/detalhe-aluno/detalhe-aluno';
import { Home } from './home/home';
import { Configuracoes } from './configuracoes/configuracoes';
import { Tarefas } from './tarefas/tarefas';
import { Calendario } from './calendario/calendario';
import { Documentos } from './documentos/documentos';
import { Turmas } from './turmas/turmas';
import { Materias } from './materias/materias';
import { pendingChangesGuard } from './documentos/editor/pending-changes.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'alunos',
    component: Alunos,
  },
  {
    path: 'alunos/adicionar',
    component: AdicionarAluno,
  },
  {
    path: 'alunos/:id/editar',
    component: EditarAluno,
  },
  {
    path: 'alunos/:alunoId/planos/:tipo/:id',
    loadComponent: () => import('./documentos/editor/documento-editor').then(m => m.DocumentoEditor),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'alunos/:id',
    component: DetalheAluno,
  },
  {
    path: 'tarefas',
    component: Tarefas,
  },
  {
    path: 'calendario',
    component: Calendario,
  },
  {
    path: 'documentos',
    component: Documentos,
  },
  // Rota do editor de documentos (aberta a partir de um card em Documentos).
  // Lazy-loaded: as extensões do TipTap ficam num chunk separado e não pesam
  // no bundle inicial da aplicação.
  {
    path: 'documentos/editor/:id',
    loadComponent: () =>
      import('./documentos/editor/documento-editor').then((m) => m.DocumentoEditor),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'configuracoes',
    component: Configuracoes,
  },
  {
    path: 'turmas',
    component: Turmas,
  },
  {
    path: 'materias',
    component: Materias,
  },
];
