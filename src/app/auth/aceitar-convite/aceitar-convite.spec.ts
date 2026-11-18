import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  convertToParamMap,
  provideRouter,
  Router,
  ActivatedRoute,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { AceitarConvite } from './aceitar-convite';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';
import { ApiError } from '../api/api-error';
import { criarAuthFake, preencher, submeter, texto, type AuthFake } from '../test-auth.fake';
import type { Convite } from '../auth.models';

describe('Aceitar convite (S10)', () => {
  let auth: AuthFake;
  let router: Router;
  let store: SessaoStore;
  let fixture: ComponentFixture<AceitarConvite>;

  const conviteNovo: Convite = {
    escolaNome: 'Escola Exemplo',
    funcao: 'professor_apoio',
    email: 'prof@exemplo.com',
    contaExistente: false,
    turmas: ['3º A'],
    materias: ['Matemática'],
  };

  const conviteExistente: Convite = {
    ...conviteNovo,
    contaExistente: true,
  };

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [AceitarConvite],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ token: 'token-abc' }) } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(SessaoStore);
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(AceitarConvite);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function preencherContaNova(): void {
    preencher(fixture, '#convite-nome', 'Ana Souza');
    preencher(fixture, '#convite-senha', 'Senha1234');
    preencher(fixture, '#convite-confirmacao', 'Senha1234');
  }

  it('[TDD-110] [BDD-050] chama GET /convites/:token antes de exibir formulário', () => {
    const pendente = new Subject<Convite>();
    auth.obterConvite.mockReturnValue(pendente.asObservable());

    const el = criar();

    expect(auth.obterConvite).toHaveBeenCalledWith('token-abc');
    expect(texto(el)).toContain('Carregando convite…');
    expect(el.querySelector('form')).toBeNull();

    pendente.next(conviteNovo);
    pendente.complete();
    fixture.detectChanges();

    expect(texto(el)).toContain(
      'Você foi convidado para Escola Exemplo como Professor de Apoio',
    );
    expect(el.querySelector('form')).toBeTruthy();
  });

  it('[TDD-111] [BDD-050] com conta inexistente exibe nome e senha', () => {
    auth.obterConvite.mockReturnValue(of(conviteNovo));
    const el = criar();

    expect(el.querySelector('#convite-nome')).toBeTruthy();
    expect(el.querySelector('#convite-senha')).toBeTruthy();
    expect(texto(el)).toContain('Aceitar convite e criar conta');
  });

  it('[TDD-112] [BDD-051] com conta existente não renderiza campo de senha', () => {
    auth.obterConvite.mockReturnValue(of(conviteExistente));
    const el = criar();

    expect(el.querySelector('input[type="password"]')).toBeNull();
    expect(texto(el)).toContain('Entre com sua conta para aceitar o convite');
    expect(texto(el)).toContain('Entrar e aceitar');
  });

  it('[TDD-113] [BDD-052] a função é texto, sem controle de edição', () => {
    auth.obterConvite.mockReturnValue(of(conviteNovo));
    const el = criar();

    expect(texto(el)).toContain('Professor de Apoio');
    expect(el.querySelector('select')).toBeNull();
    expect(el.querySelectorAll('input[type="radio"]').length).toBe(0);
  });

  it('[TDD-114] [BDD-053] 410 redireciona para /convite/invalido com código', () => {
    auth.obterConvite.mockReturnValue(
      throwError(() => new ApiError(410, 'token_expirado')),
    );
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();

    expect(navegar).toHaveBeenCalledWith(
      ['/convite/invalido'],
      expect.objectContaining({
        state: { codigo: 'expirado' },
        replaceUrl: true,
      }),
    );
  });

  it('[TDD-116] [BDD-050] e-mail do convite é somente leitura', () => {
    auth.obterConvite.mockReturnValue(of(conviteNovo));
    const el = criar();
    const email = el.querySelector('#convite-email') as HTMLInputElement;

    expect(email.value).toBe('prof@exemplo.com');
    expect(email.readOnly).toBe(true);
    expect(email.getAttribute('aria-readonly')).toBe('true');
  });

  it('[TDD-115] [BDD-050] aceitar cria a conta e navega sem o token na URL', () => {
    auth.obterConvite.mockReturnValue(of(conviteNovo));
    auth.carregarSessao.mockReturnValue(
      of({
        usuario: {
          nome: 'Ana Souza',
          email: 'prof@exemplo.com',
          emailVerificado: true,
        },
        vinculos: [
          {
            id: 'v1',
            escolaNome: 'Escola Exemplo',
            funcao: 'professor_apoio' as const,
          },
        ],
        contexto: {
          id: 'v1',
          escolaNome: 'Escola Exemplo',
          funcao: 'professor_apoio' as const,
        },
      }),
    );
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();
    preencherContaNova();
    submeter(fixture.nativeElement.querySelector('form') as HTMLFormElement);
    fixture.detectChanges();

    expect(auth.aceitarConvite).toHaveBeenCalledWith('token-abc', {
      nome: 'Ana Souza',
      senha: 'Senha1234',
    });
    expect(navegar).toHaveBeenCalledWith(
      ['/painel'],
      expect.objectContaining({
        replaceUrl: true,
        state: expect.objectContaining({
          aviso: 'Você agora faz parte de Escola Exemplo.',
        }),
      }),
    );
  });

  it('[BDD-051] com conta existente e usuário logado aceita sem pedir senha', () => {
    auth.obterConvite.mockReturnValue(of(conviteExistente));
    auth.carregarSessao.mockReturnValue(
      of({
        usuario: {
          nome: 'Ana Souza',
          email: 'prof@exemplo.com',
          emailVerificado: true,
        },
        vinculos: [],
        contexto: null,
      }),
    );
    store.usuario.set({
      nome: 'Ana Souza',
      email: 'prof@exemplo.com',
      emailVerificado: true,
    });
    store.carregada.set(true);

    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const aceitar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Aceitar convite'),
    ) as HTMLButtonElement;
    aceitar.click();
    fixture.detectChanges();

    expect(auth.aceitarConvite).toHaveBeenCalledWith('token-abc', {});
    expect(navegar).toHaveBeenCalledWith(
      ['/painel'],
      expect.objectContaining({ replaceUrl: true }),
    );
  });

  it('[BDD-051] sem login, "Entrar e aceitar" leva ao login com redirect', () => {
    auth.obterConvite.mockReturnValue(of(conviteExistente));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const entrar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Entrar e aceitar'),
    ) as HTMLButtonElement;
    entrar.click();

    expect(navegar).toHaveBeenCalledWith(
      ['/entrar'],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          redirect: expect.stringContaining('/convite/token-abc'),
        }),
      }),
    );
  });
});
