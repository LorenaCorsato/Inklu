import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router, ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../api/api-error';
import { criarAuthFake, preencher, submeter, texto, type AuthFake } from '../test-auth.fake';

describe('Login (S01)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<Login>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    auth = criarAuthFake();
    queryParams = {};

    const rotaFake = {
      get snapshot() {
        return { queryParamMap: convertToParamMap(queryParams) };
      },
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: rotaFake },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function email(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#login-email') as HTMLInputElement;
  }

  function senha(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#login-senha') as HTMLInputElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  async function logar(comEmail = 'ana@exemplo.com', comSenha = 'Senha1234'): Promise<void> {
    preencher(fixture, '#login-email', comEmail);
    preencher(fixture, '#login-senha', comSenha);
    submeter(formulario());
    fixture.detectChanges();
    await Promise.resolve();
  }

  it('[TDD-070] [BDD-063] 401 mostra mensagem genérica em role="alert"', async () => {
    auth.login.mockReturnValue(throwError(() => new ApiError(401, 'credenciais_invalidas')));
    criar();
    await logar();

    const alerta = fixture.nativeElement.querySelector('form')!.parentElement!.querySelector('[role="alert"]') as HTMLElement;
    expect(texto(alerta)).toBe('E-mail ou senha inválidos');
    expect(senha().value).toBe('');
    expect(email().value).toBe('ana@exemplo.com');
  });

  it('[TDD-071] [BDD-063] e-mail inexistente recebe a mesma mensagem', async () => {
    auth.login.mockReturnValue(throwError(() => new ApiError(401, 'credenciais_invalidas')));
    criar();
    await logar('naoexiste@exemplo.com');

    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(texto(alerta)).toBe('E-mail ou senha inválidos');
  });

  it('[TDD-072] [BDD-064] 403 mostra aviso de e-mail não verificado com reenvio', async () => {
    auth.login.mockReturnValue(throwError(() => new ApiError(403, 'email_nao_verificado')));
    const el = criar();
    await logar();

    expect(texto(el)).toContain('Confirme seu e-mail para continuar');
    expect(texto(el)).toContain('Reenviar e-mail de verificação');

    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const reenviar = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Reenviar e-mail de verificação'),
    );
    reenviar?.click();

    // O e-mail vai no estado da navegação, nunca na URL.
    expect(navegar).toHaveBeenCalledWith(
      ['/verificar-email'],
      expect.objectContaining({
        state: expect.objectContaining({ email: 'ana@exemplo.com' }),
      }),
    );
  });

  it('[TDD-073] [BDD-065] 429 desabilita o botão e mostra contagem MM:SS', async () => {
    vi.useFakeTimers();
    auth.login.mockReturnValue(
      throwError(() => new ApiError(429, 'bloqueado', undefined, 61)),
    );
    const el = criar();
    await logar();

    const botao = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    expect(texto(el)).toContain('Muitas tentativas. Tente de novo em 01:01');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(texto(el)).toContain('01:00');
  });

  it('[TDD-074] [BDD-065] anúncio para leitor de tela muda a cada minuto', async () => {
    vi.useFakeTimers();
    auth.login.mockReturnValue(
      throwError(() => new ApiError(429, 'bloqueado', undefined, 300)),
    );
    const el = criar();
    await logar();

    const anuncio = el.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(texto(anuncio)).toContain('5 minutos');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(texto(anuncio)).toContain('5 minutos');

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    expect(texto(anuncio)).toContain('4 minutos');
  });

  it('[TDD-075] [BDD-066] mostrar/ocultar alterna type e aria-pressed', () => {
    const el = criar();
    const campo = senha();
    expect(campo.type).toBe('password');

    const alternar = el.querySelector('.campo-senha__toggle') as HTMLButtonElement;
    expect(alternar.getAttribute('aria-pressed')).toBe('false');
    expect(alternar.getAttribute('aria-label')).toBe('Mostrar senha');

    alternar.click();
    fixture.detectChanges();

    expect(senha().type).toBe('text');
    expect(alternar.getAttribute('aria-pressed')).toBe('true');
    expect(alternar.getAttribute('aria-label')).toBe('Ocultar senha');
  });

  it('[TDD-076] [BDD-069] banner de sessão expirada vem da query', () => {
    queryParams = { motivo: 'sessao_expirada' };
    const el = criar();
    expect(texto(el)).toContain('Sua sessão expirou. Entre novamente.');
  });

  it('[TDD-077] [BDD-081] usa o redirect preservado após o login', async () => {
    queryParams = { redirect: '/escola/convites' };
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    criar();
    await logar();

    expect(navegar).toHaveBeenCalledWith('/escola/convites');
  });

  it('[TDD-078] campos usam autocomplete de login', () => {
    criar();
    expect(email().getAttribute('autocomplete')).toBe('username');
    expect(senha().getAttribute('autocomplete')).toBe('current-password');
  });

  it('[BDD-067] mfa_requerido navega para a segunda etapa e marca a sessão parcial', async () => {
    auth.login.mockReturnValue(of({ status: 'mfa_requerido' as const }));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    criar();
    await logar();

    expect(navegar).toHaveBeenCalledWith(['/entrar/mfa'], { queryParams: {} });
  });

  it('[BDD-061] escolher_contexto navega para o seletor', async () => {
    auth.login.mockReturnValue(of({ status: 'escolher_contexto' as const }));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    criar();
    await logar();

    expect(navegar).toHaveBeenCalledWith(['/contexto']);
  });

  it('[BDD-062] sem_vinculo navega para a tela sem acesso', async () => {
    auth.login.mockReturnValue(of({ status: 'sem_vinculo' as const }));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    criar();
    await logar();

    expect(navegar).toHaveBeenCalledWith(['/sem-acesso']);
  });

  it('[BDD-065] o botão volta a ficar habilitado ao fim da contagem', async () => {
    vi.useFakeTimers();
    auth.login.mockReturnValue(
      throwError(() => new ApiError(429, 'bloqueado', undefined, 2)),
    );
    const el = criar();
    await logar();

    const botao = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(botao.disabled).toBe(false);
  });

  it('[BDD-060] login com sucesso único vai para o painel', async () => {
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    criar();
    await logar();

    expect(navegar).toHaveBeenCalledWith('/painel');
  });

  it('não chama a API quando a validação local falha', () => {
    criar();
    preencher(fixture, '#login-email', 'ana@x');
    submeter(formulario());
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(texto(fixture.nativeElement)).toContain('Informe um e-mail válido');
  });

  it('preserva o formulário quando a rede falha', async () => {
    auth.login.mockReturnValue(throwError(() => new TypeError('offline')));
    const el = criar();
    await logar();

    expect(texto(el)).toContain(
      'Não foi possível conectar. Verifique sua internet e tente de novo',
    );
    expect(email().value).toBe('ana@exemplo.com');
    expect((el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('mostra aria-busy durante o envio', async () => {
    const pendente = new Subject<{ status: 'ok' }>();
    auth.login.mockReturnValue(pendente.asObservable());
    const el = criar();

    preencher(fixture, '#login-email', 'ana@exemplo.com');
    preencher(fixture, '#login-senha', 'Senha1234');
    submeter(formulario());
    fixture.detectChanges();

    const botao = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(texto(botao)).toBe('Entrando…');
    expect(email().readOnly).toBe(true);

    pendente.complete();
  });
});
