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
  {
    path: 'configuracoes',
    component: Configuracoes,
  }
];
