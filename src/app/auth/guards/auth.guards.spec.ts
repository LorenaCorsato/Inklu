import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';

import {
  contextoGuard,
  coordenacaoGuard,
  funcaoGuard,
  mfaGuard,
  painelGuard,
  semAcessoGuard,
} from './auth.guards';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';
import { criarAuthFake, type AuthFake } from '../test-auth.fake';

@Component({ selector: 'app-destino-teste', template: '<p>destino</p>', standalone: true })
class DestinoTeste {}

const rotas: Routes = [
  { path: 'entrar', component: DestinoTeste },
  { path: 'entrar/mfa', component: DestinoTeste, canActivate: [mfaGuard] },
  { path: 'painel', component: DestinoTeste, canActivate: [painelGuard] },
  { path: 'sem-acesso', component: DestinoTeste, canActivate: [semAcessoGuard] },
  { path: 'contexto', component: DestinoTeste, canActivate: [contextoGuard] },
  {
    path: 'escola/convites',
    component: DestinoTeste,
    canActivate: [coordenacaoGuard],
  },
  {
    path: 'cadastro/funcao',
    component: DestinoTeste,
    canActivate: [funcaoGuard],
  },
];

describe('Guards de rota', () => {
  let auth: AuthFake;
  let router: Router;
  let store: SessaoStore;

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [DestinoTeste],
      providers: [provideRouter(rotas), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(SessaoStore);
    store.limpar();
  });

  function definirSessao(
    usuario: {
      nome: string;
      email: string;
      emailVerificado: boolean;
      funcao?: 'professor_regente' | 'professor_apoio' | 'coordenacao' | null;
    },
    vinculos: {
      id: string;
      escolaNome: string;
      funcao: 'professor_regente' | 'professor_apoio' | 'coordenacao';
    }[],
    contextoId?: string,
  ): void {
    store.usuario.set(usuario);
    store.vinculos.set(vinculos);
    store.contexto.set(
      contextoId
        ? (vinculos.find((vinculo) => vinculo.id === contextoId) ?? null)
        : vinculos.length === 1
          ? vinculos[0]
          : null,
    );
    store.carregada.set(true);
  }

  it('[TDD-140] [BDD-080] visitante em rota protegida vai para /entrar com redirect', async () => {
    for (const rota of ['/painel', '/escola/convites', '/contexto']) {
      await router.navigateByUrl('/entrar');
      await router.navigateByUrl(rota);

      expect(router.url).toContain('/entrar');
      const arvore = router.parseUrl(router.url);
      expect(arvore.queryParams['redirect']).toBe(rota);
    }
  });

  it('[TDD-142] [BDD-082] usuário sem vínculo no painel vai para /sem-acesso', async () => {
    definirSessao(
      {
        nome: 'Ana',
        email: 'ana@exemplo.com',
        emailVerificado: true,
        funcao: null,
      },
      [],
    );

    await router.navigateByUrl('/painel');

    expect(router.url).toBe('/sem-acesso');
  });

  it('usuário com dois vínculos sem contexto vai para /contexto', async () => {
    definirSessao(
      { nome: 'Ana', email: 'ana@exemplo.com', emailVerificado: true },
      [
        { id: 'v1', escolaNome: 'Conta individual', funcao: 'professor_regente' },
        { id: 'v2', escolaNome: 'Escola Exemplo', funcao: 'professor_apoio' },
      ],
    );

    await router.navigateByUrl('/painel');

    expect(router.url).toBe('/contexto');
  });

  it('usuário com um vínculo em /contexto é levado ao painel', async () => {
    definirSessao(
      { nome: 'Ana', email: 'ana@exemplo.com', emailVerificado: true },
      [{ id: 'v1', escolaNome: 'Escola Exemplo', funcao: 'professor_regente' }],
    );

    await router.navigateByUrl('/contexto');

    expect(router.url).toBe('/painel');
  });

  it('[TDD-144] [BDD-044] professor em /escola/convites vê painel com aviso', async () => {
    definirSessao(
      {
        nome: 'Ana',
        email: 'ana@exemplo.com',
        emailVerificado: true,
        funcao: 'professor_regente',
      },
      [{ id: 'v1', escolaNome: 'Escola Exemplo', funcao: 'professor_regente' }],
    );

    await router.navigateByUrl('/escola/convites');

    expect(router.url).toContain('/painel');
    expect(router.parseUrl(router.url).queryParams['aviso']).toBe('sem_permissao');
  });

  it('[TDD-083] [BDD-068] MFA sem sessão parcial vai para o login', async () => {
    store.mfaPendente.set(false);

    await router.navigateByUrl('/entrar/mfa');

    expect(router.url).toContain('/entrar');
  });

  it('[BDD-067] MFA com sessão parcial é permitido', async () => {
    store.mfaPendente.set(true);

    await router.navigateByUrl('/entrar/mfa');

    expect(router.url).toBe('/entrar/mfa');
  });

  it('[TDD-064] [BDD-022] função com e-mail não verificado vai para verificação', async () => {
    definirSessao(
      {
        nome: 'Ana',
        email: 'ana@exemplo.com',
        emailVerificado: false,
        funcao: null,
      },
      [],
    );

    await router.navigateByUrl('/cadastro/funcao');

    expect(router.url).toContain('/verificar-email');
    expect(router.parseUrl(router.url).queryParams['modo']).toBe('reenvio');
  });

  it('[BDD-021] função já definida vai ao painel com aviso', async () => {
    definirSessao(
      {
        nome: 'Ana',
        email: 'ana@exemplo.com',
        emailVerificado: true,
        funcao: 'professor_apoio',
      },
      [{ id: 'v1', escolaNome: 'Conta individual', funcao: 'professor_apoio' }],
    );

    await router.navigateByUrl('/cadastro/funcao');

    expect(router.url).toContain('/painel');
    expect(router.parseUrl(router.url).queryParams['aviso']).toBe(
      'funcao_ja_definida',
    );
  });

  it('coordenação acessa /escola/convites', async () => {
    definirSessao(
      {
        nome: 'Ana',
        email: 'ana@exemplo.com',
        emailVerificado: true,
        funcao: 'coordenacao',
      },
      [{ id: 'v1', escolaNome: 'Escola Exemplo', funcao: 'coordenacao' }],
    );

    await router.navigateByUrl('/escola/convites');

    expect(router.url).toBe('/escola/convites');
  });

  it('[TDD-141] [BDD-081] redirect preserva a rota original', async () => {
    await router.navigateByUrl('/escola/convites');

    const arvore = router.parseUrl(router.url);
    expect(arvore.queryParams['redirect']).toBe('/escola/convites');
  });

  it('o guard usa o /auth/me para decidir (fonte da verdade)', async () => {
    await router.navigateByUrl('/painel');
    expect(auth.garantirSessao).toHaveBeenCalled();
  });
});
