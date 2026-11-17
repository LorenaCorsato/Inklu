import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Mfa } from './mfa';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../api/api-error';
import { criarAuthFake, preencher, submeter, texto, type AuthFake } from '../test-auth.fake';

describe('Verificação em duas etapas (S07)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<Mfa>;

  beforeEach(async () => {
    auth = criarAuthFake();
    window.history.replaceState({}, '', '/entrar/mfa');

    await TestBed.configureTestingModule({
      imports: [Mfa],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(Mfa);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function codigo(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#mfa-codigo') as HTMLInputElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  it('[TDD-080] [BDD-067] campo aceita apenas 6 dígitos numéricos', () => {
    const el = criar();
    const campo = codigo();

    expect(campo.getAttribute('inputmode')).toBe('numeric');
    expect(campo.getAttribute('autocomplete')).toBe('one-time-code');
    expect(campo.getAttribute('maxlength')).toBe('6');

    preencher(fixture, '#mfa-codigo', '12a34567');
    expect(campo.value).toBe('123456');
    expect(texto(el)).not.toContain('Informe o código de 6 dígitos');
  });

  it('[TDD-081] [BDD-067] código correto navega para o painel', () => {
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    criar();
    preencher(fixture, '#mfa-codigo', '123456');
    submeter(formulario());

    expect(auth.verificarMfa).toHaveBeenCalledWith('123456');
    expect(navegar).toHaveBeenCalledWith('/painel', { replaceUrl: true });
  });

  it('[TDD-082] [BDD-067] código incorreto mostra erro sem limpar o campo', () => {
    auth.verificarMfa.mockReturnValue(
      throwError(() => new ApiError(401, 'codigo_invalido')),
    );
    const el = criar();
    preencher(fixture, '#mfa-codigo', '123456');
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain('Código incorreto. Confira no seu aplicativo');
    expect(codigo().value).toBe('123456');
  });

  it('[TDD-084] [BDD-068] "Usar outra conta" limpa a sessão parcial e volta ao login', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const botao = Array.from(el.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Usar outra conta'),
    ) as HTMLButtonElement;
    botao.click();

    expect(auth.logout).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/entrar'], { replaceUrl: true });
  });

  it('[BDD-065] bloqueio por tentativas desabilita e faz contagem', () => {
    vi.useFakeTimers();
    auth.verificarMfa.mockReturnValue(
      throwError(() => new ApiError(429, 'bloqueado', undefined, 30)),
    );
    const el = criar();
    preencher(fixture, '#mfa-codigo', '123456');
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain('Muitas tentativas. Tente de novo em 00:30');
    expect(
      (el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(true);

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(texto(el)).toContain('00:29');
  });

  it('redireciona de volta à rota original após o MFA', () => {
    window.history.replaceState({}, '', '/entrar/mfa?redirect=/escola/convites');
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    criar();
    preencher(fixture, '#mfa-codigo', '123456');
    submeter(formulario());

    expect(navegar).toHaveBeenCalledWith('/escola/convites', {
      replaceUrl: true,
    });
  });
});
