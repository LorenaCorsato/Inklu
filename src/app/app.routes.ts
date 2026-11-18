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
import { Login } from './auth/login/login';
import { Cadastro } from './auth/cadastro/cadastro';
import { VerificarEmail } from './auth/verificar-email/verificar-email';
import { EscolherFuncao } from './auth/escolher-funcao/escolher-funcao';
import { RecuperarSenha } from './auth/recuperar-senha/recuperar-senha';
import { RedefinirSenha } from './auth/redefinir-senha/redefinir-senha';
import { Mfa } from './auth/mfa/mfa';
import { Contexto } from './auth/contexto/contexto';
import { SemAcesso } from './auth/sem-acesso/sem-acesso';
import { AceitarConvite } from './auth/aceitar-convite/aceitar-convite';
import { ConviteInvalido } from './auth/convite-invalido/convite-invalido';
import { CadastroEscola } from './auth/cadastro-escola/cadastro-escola';
import { ConvidarProfessor } from './auth/convidar-professor/convidar-professor';
import { Painel } from './auth/painel/painel';
import {
  contextoGuard,
  coordenacaoGuard,
  funcaoGuard,
  mfaGuard,
  painelGuard,
  semAcessoGuard,
} from './auth/guards/auth.guards';

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

  // ─── Autenticação (seção 2 da especificação) ────────────────────────────────
  {
    path: 'entrar',
    component: Login,
  },
  {
    path: 'entrar/mfa',
    component: Mfa,
    canActivate: [mfaGuard],
  },
  {
    path: 'cadastro',
    component: Cadastro,
  },
  {
    path: 'cadastro/funcao',
    component: EscolherFuncao,
    canActivate: [funcaoGuard],
  },
  {
    path: 'verificar-email',
    component: VerificarEmail,
  },
  {
    path: 'recuperar-senha',
    component: RecuperarSenha,
  },
  {
    path: 'redefinir-senha',
    component: RedefinirSenha,
  },
  {
    path: 'contexto',
    component: Contexto,
    canActivate: [contextoGuard],
  },
  {
    path: 'sem-acesso',
    component: SemAcesso,
    canActivate: [semAcessoGuard],
  },
  {
    path: 'convite/invalido',
    component: ConviteInvalido,
  },
  {
    path: 'convite/:token',
    component: AceitarConvite,
  },
  {
    path: 'escola/cadastro',
    component: CadastroEscola,
  },
  {
    path: 'escola/convites',
    component: ConvidarProfessor,
    canActivate: [coordenacaoGuard],
  },
  {
    path: 'painel',
    component: Painel,
    canActivate: [painelGuard],
  },
];
