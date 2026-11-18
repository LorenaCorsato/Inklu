import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { VerificarEmail } from './verificar-email';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../api/api-error';
import {
  criarAuthFake,
  preencher,
  texto,
  type AuthFake,
} from '../test-auth.fake';

describe('Verificação de e-mail (S03)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<VerificarEmail>;

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [VerificarEmail],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(VerificarEmail);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('[TDD-050] [BDD-010] com token chama a API e mostra "Confirmando…"', () => {
    window.history.replaceState({}, '', '/verificar-email?token=tok-1');
    const pendente = new Subject<{ proximo?: string }>();
    auth.verificarEmail.mockReturnValue(pendente.asObservable());

    const el = criar();

    expect(texto(el)).toContain('Confirmando seu e-mail…');
    expect(auth.verificarEmail).toHaveBeenCalledWith('tok-1');

    pendente.next({ proximo: 'escolher_funcao' });
    pendente.complete();
  });

  it('[TDD-051] [BDD-010] após sucesso navega para /cadastro/funcao', () => {
    window.history.replaceState({}, '', '/verificar-email?token=tok-1');
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();

    expect(navegar).toHaveBeenCalledWith(['/cadastro/funcao'], {
      replaceUrl: true,
    });
  });

  it('[TDD-052] [BDD-011] 410 mostra link expirado e botão de reenvio', () => {
    window.history.replaceState({}, '', '/verificar-email?token=velho');
    auth.verificarEmail.mockReturnValue(
      throwError(() => new ApiError(410, 'token_expirado')),
    );

    const el = criar();

    expect(texto(el)).toContain('Este link expirou');
    expect(texto(el)).toContain('Reenviar e-mail');
  });

  it('[TDD-053] [BDD-012] 404 mostra link inválido e botão de login', () => {
    window.history.replaceState({}, '', '/verificar-email?token=usado');
    auth.verificarEmail.mockReturnValue(
      throwError(() => new ApiError(404, 'token_invalido')),
    );

    const el = criar();

    expect(texto(el)).toContain('Este link não é válido. Ele pode já ter sido usado.');
    expect(texto(el)).toContain('Ir para o login');
  });

  it('[TDD-054] [BDD-013] reenvio desabilita o botão por 60 segundos', () => {
    window.history.replaceState(
      { email: 'ana@exemplo.com' },
      '',
      '/verificar-email',
    );
    const el = criar();
    vi.useFakeTimers();

    const reenviar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Reenviar e-mail'),
    ) as HTMLButtonElement;
    reenviar.click();
    fixture.detectChanges();

    expect(auth.reenviarVerificacao).toHaveBeenCalledWith('ana@exemplo.com');
    expect(reenviar.disabled).toBe(true);
    expect(texto(el)).toContain('Reenviar e-mail em 60s');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(texto(el)).toContain('Reenviar e-mail em 59s');
  });

  it('[TDD-055] [BDD-013] ao fim da contagem o botão volta a ser habilitado', () => {
    window.history.replaceState(
      { email: 'ana@exemplo.com' },
      '',
      '/verificar-email',
    );
    const el = criar();
    vi.useFakeTimers();

    const reenviar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Reenviar e-mail'),
    ) as HTMLButtonElement;
    reenviar.click();
    fixture.detectChanges();

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();

    expect(reenviar.disabled).toBe(false);
    expect(texto(reenviar)).toBe('Reenviar e-mail');
  });

  it('[TDD-056] [BDD-013] mensagem de reenvio fica em região aria-live="polite"', () => {
    window.history.replaceState(
      { email: 'ana@exemplo.com' },
      '',
      '/verificar-email',
    );
    const el = criar();

    const reenviar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Reenviar e-mail'),
    ) as HTMLButtonElement;
    reenviar.click();
    fixture.detectChanges();

    const regiao = el.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(regiao).toBeTruthy();
    expect(texto(regiao)).toContain(
      'Reenviado. Verifique sua caixa de entrada e a pasta de spam.',
    );
  });

  it('[BDD-001] mostra o e-mail vindo do cadastro em memória', () => {
    window.history.replaceState(
      { email: 'ana@exemplo.com', nome: 'Ana Souza' },
      '',
      '/verificar-email',
    );
    const el = criar();

    expect(texto(el)).toContain('Enviamos um link para ana@exemplo.com');
  });

  it('[BDD-013] "Usar outro e-mail" volta ao cadastro com os dados', () => {
    window.history.replaceState(
      { email: 'ana@exemplo.com', nome: 'Ana Souza' },
      '',
      '/verificar-email',
    );
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const trocar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Usar outro e-mail'),
    ) as HTMLButtonElement;
    trocar.click();

    expect(navegar).toHaveBeenCalledWith(
      ['/cadastro'],
      expect.objectContaining({
        state: expect.objectContaining({ email: 'ana@exemplo.com' }),
      }),
    );
  });

  it('sem token e sem e-mail leva ao login', () => {
    window.history.replaceState({}, '', '/verificar-email');
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();

    expect(navegar).toHaveBeenCalledWith(['/entrar'], { replaceUrl: true });
  });
});
