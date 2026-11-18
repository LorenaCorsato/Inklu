import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { Cadastro } from './cadastro';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../api/api-error';
import {
  criarAuthFake,
  idDoFoco,
  preencher,
  submeter,
  texto,
  type AuthFake,
} from '../test-auth.fake';

describe('Cadastro individual (S02)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<Cadastro>;

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(Cadastro);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function preencherTudo(
    nome = 'Ana Souza',
    email = 'ana@exemplo.com',
    senha = 'Senha1234',
    confirmacao = 'Senha1234',
  ): void {
    preencher(fixture, '#cadastro-nome', nome);
    preencher(fixture, '#cadastro-email', email);
    preencher(fixture, '#cadastro-senha', senha);
    preencher(fixture, '#cadastro-confirmacao', confirmacao);
  }

  it('[TDD-040] [BDD-001] envia os dados válidos para POST /auth/register', () => {
    criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    expect(auth.registrar).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      senha: 'Senha1234',
    });
  });

  it('[TDD-041] [BDD-001] após 202 navega para /verificar-email sem e-mail na URL', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(
      ['/verificar-email'],
      expect.objectContaining({
        state: expect.objectContaining({ email: 'ana@exemplo.com' }),
      }),
    );
    expect(navegar.mock.calls[0][0]).not.toContain('ana@exemplo.com');
  });

  it('[TDD-042] [BDD-002] não chama a API e foca o primeiro campo inválido', () => {
    vi.useFakeTimers();
    const el = criar();
    submeter(formulario());
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    expect(auth.registrar).not.toHaveBeenCalled();
    expect(texto(el)).toContain('Informe seu nome completo');
    expect(idDoFoco()).toBe('cadastro-nome');
  });

  it('[TDD-043] [BDD-002] valida no blur, não a cada tecla antes do primeiro blur', () => {
    const el = criar();
    const campoEmail = preencher(fixture, '#cadastro-email', 'ana@x');

    expect(texto(el)).not.toContain('Informe um e-mail válido');

    campoEmail.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(texto(el)).toContain('Informe um e-mail válido');
  });

  it('[TDD-044] [BDD-003] indicador de força mostra o texto da faixa', () => {
    const el = criar();

    preencher(fixture, '#cadastro-senha', 'abc');
    expect(texto(el)).toContain('Senha fraca');

    preencher(fixture, '#cadastro-senha', 'Senha1234!xyz');
    expect(texto(el)).toContain('Senha forte');
  });

  it('[TDD-045] [BDD-004] 409 mostra erro no e-mail, link Entrar e preserva o resto', () => {
    auth.registrar.mockReturnValue(
      throwError(() => new ApiError(409, 'email_em_uso')),
    );
    const el = criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain('Já existe uma conta com este e-mail. Entrar?');
    expect(el.querySelector('#cadastro-email-erro a')).toBeTruthy();
    expect(
      (el.querySelector('#cadastro-nome') as HTMLInputElement).value,
    ).toBe('Ana Souza');
    expect(
      (el.querySelector('#cadastro-senha') as HTMLInputElement).value,
    ).toBe('Senha1234');
  });

  it('[TDD-046] [BDD-005] falha de rede mostra alerta e preserva os valores', () => {
    auth.registrar.mockReturnValue(throwError(() => new TypeError('offline')));
    const el = criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain(
      'Não foi possível conectar. Verifique sua internet e tente de novo',
    );
    expect(
      (el.querySelector('#cadastro-nome') as HTMLInputElement).value,
    ).toBe('Ana Souza');
    expect(
      (el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('[TDD-047] botão fica com aria-busy e desabilitado durante o envio', () => {
    const pendente = new Subject<unknown>();
    auth.registrar.mockReturnValue(pendente.asObservable());
    const el = criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    const botao = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(texto(botao)).toBe('Criando conta…');

    pendente.complete();
  });

  it('[TDD-048] os campos de senha usam autocomplete="new-password"', () => {
    const el = criar();
    expect(
      (el.querySelector('#cadastro-senha') as HTMLInputElement).getAttribute(
        'autocomplete',
      ),
    ).toBe('new-password');
    expect(
      (el.querySelector('#cadastro-confirmacao') as HTMLInputElement).getAttribute(
        'autocomplete',
      ),
    ).toBe('new-password');
  });

  it('mantém nome/e-mail ao voltar de "Usar outro e-mail"', () => {
    window.history.replaceState(
      { nome: 'Ana Souza', email: 'ana@exemplo.com' },
      '',
      '/cadastro',
    );
    const el = criar();

    expect((el.querySelector('#cadastro-nome') as HTMLInputElement).value).toBe(
      'Ana Souza',
    );
    expect((el.querySelector('#cadastro-email') as HTMLInputElement).value).toBe(
      'ana@exemplo.com',
    );
  });

  it('mostra confirmação diferente como erro de campo', () => {
    const el = criar();
    preencherTudo('Ana Souza', 'ana@exemplo.com', 'Senha1234', 'Senha9999');
    submeter(formulario());
    fixture.detectChanges();

    expect(auth.registrar).not.toHaveBeenCalled();
    expect(texto(el)).toContain('As senhas não coincidem');
  });

  it('mapeia erros 422 por campo e preserva o preenchimento', () => {
    auth.registrar.mockReturnValue(
      throwError(
        () =>
          new ApiError(422, 'validacao', {
            email: 'E-mail já validado por outra conta',
          }),
      ),
    );
    const el = criar();
    preencherTudo();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain('E-mail já validado por outra conta');
    expect(
      (el.querySelector('#cadastro-nome') as HTMLInputElement).value,
    ).toBe('Ana Souza');
  });
});
