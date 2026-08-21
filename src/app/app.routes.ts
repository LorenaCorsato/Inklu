import { Routes } from '@angular/router';
import { Alunos } from './alunos/alunos';
import { AdicionarAluno } from './alunos/adicionar-aluno/adicionar-aluno';
import { DetalheAluno } from './alunos/detalhe-aluno/detalhe-aluno';
import { Home } from './home/home';

export const routes: Routes = [
  {
    path: 'alunos',
    component: Alunos,
  },
  {
    path: 'alunos/adicionar',
    component: AdicionarAluno,
  },
  {
    path: 'alunos/:id',
    component: DetalheAluno,
  },
  {
    path: '',
    component: Home,
  },
];
