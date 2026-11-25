import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { VerificacaoEmailModal } from './verificacao-email-modal';
import { VerificacaoEmailModalService } from './verificacao-email-modal.service';
import { AuthService } from '../services/auth.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { criarAuthFake, texto, type AuthFake } from '../test-auth.fake';

describe('Modal de verificação de e-mail', () => {
  let auth: AuthFake;
  let modal: VerificacaoEmailModalService;
  let toast: ToastService;
  let firebase: { usuarioAtual: unknown; recarregar: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<VerificacaoEmailModal>;

  beforeEach(async () => {
    auth = criarAuthFake();
    firebase = { usuarioAtual: null, recarregar: vi.fn(async () => null) };

    await TestBed.configureTestingModule({
      imports: [VerificacaoEmailModal],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: FirebaseAuthService, useValue: firebase },
      ],
    }).compileComponents();

    modal = TestBed.inject(VerificacaoEmailModalService);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
    modal.fechar();
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(VerificacaoEmailModal);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function botao(el: HTMLElement, parte: string): HTMLButtonElement {
    const achado = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(parte),
    );
    if (!achado) throw new Error(`Botão "${parte}" não encontrado`);
    return achado as HTMLButtonElement;
  }

  it('fica oculto enquanto o modal estiver fechado', () => {
    const el = criar();

    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('aberto mostra o título e o e-mail do usuário logado', () => {
    firebase.usuarioAtual = { email: 'ana@exemplo.com' };
    modal.abrir();
    const el = criar();

    expect(texto(el)).toContain('Verifique seu e-mail');
    expect(texto(el)).toContain('ana@exemplo.com');
  });

  it('reenvio mostra confirmação e contagem de 60s', () => {
    vi.useFakeTimers();
    firebase.usuarioAtual = { email: 'ana@exemplo.com' };
    auth.reenviarVerificacao.mockReturnValue(of(undefined));
    modal.abrir();
    const el = criar();

    botao(el, 'Reenviar e-mail').click();
    fixture.detectChanges();

    expect(auth.reenviarVerificacao).toHaveBeenCalledWith('ana@exemplo.com');
    expect(texto(el)).toContain('Reenviamos o link');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(texto(el)).toContain('Reenviar em 59s');
  });

  it('"Já verifiquei" fecha o modal quando o e-mail foi confirmado', async () => {
    const sucesso = vi.spyOn(toast, 'sucesso');
    firebase.usuarioAtual = { email: 'ana@exemplo.com' };
    firebase.recarregar.mockResolvedValue({ emailVerified: true });
    modal.abrir();
    const el = criar();

    botao(el, 'Já verifiquei').click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(sucesso).toHaveBeenCalledWith('E-mail verificado com sucesso!');
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('"Já verifiquei" mantém o modal com aviso quando ainda não confirmou', async () => {
    firebase.usuarioAtual = { email: 'ana@exemplo.com' };
    firebase.recarregar.mockResolvedValue({ emailVerified: false });
    modal.abrir();
    const el = criar();

    botao(el, 'Já verifiquei').click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(texto(el)).toContain('Ainda não identificamos a confirmação');
    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
