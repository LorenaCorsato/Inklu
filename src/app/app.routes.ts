import { Routes } from '@angular/router';
import { Alunos } from './alunos/alunos';
import { DetalheAluno } from './alunos/detalhe-aluno/detalhe-aluno';
import { Home } from './home/home';

export const routes: Routes = [
  {
    path: 'alunos',
    component: Alunos,
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
