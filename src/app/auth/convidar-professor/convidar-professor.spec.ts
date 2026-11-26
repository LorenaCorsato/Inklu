import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { ConvidarProfessor } from './convidar-professor';
import { AuthService } from '../services/auth.service';
import { EscolaService } from '../services/escola.service';
import { ApiError } from '../api/api-error';
import { criarAuthFake, preencher, submeter, texto, type AuthFake } from '../test-auth.fake';
import type { ConviteEnviado } from '../auth.models';

describe('Convidar professor (S13)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<ConvidarProfessor>;
  let escolaFake: {
    buscarCep: ReturnType<typeof vi.fn>;
    listarTurmas: ReturnType<typeof vi.fn>;
    listarMaterias: ReturnType<typeof vi.fn>;
  };

  const convitePendente: ConviteEnviado = {
    id: 'c1',
    email: 'prof@escola.com',
    funcao: 'professor_regente',
    status: 'pendente',
  };

  beforeEach(async () => {
    auth = criarAuthFake();
    escolaFake = {
      buscarCep: vi.fn(() => of({})),
      listarTurmas: vi.fn(() => of([{ id: 't1', nome: '3º A' }])),
      listarMaterias: vi.fn(() => of([{ id: 'm1', nome: 'Matemática' }])),
    };

    await TestBed.configureTestingModule({
      imports: [ConvidarProfessor],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: EscolaService, useValue: escolaFake },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(ConvidarProfessor);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function preencherConvite(email = 'prof@escola.com'): void {
    preencher(fixture, '#convite-form-email', email);
  }

  it('[TDD-130] [BDD-040] envia função, turmas e matérias do regente', () => {
    criar();
    preencherConvite();

    const componente = fixture.componentInstance;
    componente.alternarTurma('t1', true);
    componente.alternarMateria('m1', true);
    fixture.detectChanges();

    submeter(formulario());

    expect(auth.enviarConvite).toHaveBeenCalledWith({
      email: 'prof@escola.com',
      funcao: 'professor_regente',
      turmaIds: ['t1'],
      materiaIds: ['m1'],
    });
    expect(texto(fixture.nativeElement)).toContain('Convite enviado para prof@escola.com');
  });

  it('[TDD-131] [BDD-041] turmas e matérias somem para Professor de Apoio', () => {
    const el = criar();
    expect(texto(el)).toContain('Turmas');
    expect(texto(el)).toContain('Matérias');

    const radio = el.querySelector(
      'input[value="professor_apoio"]',
    ) as HTMLInputElement;
    radio.click();
    fixture.detectChanges();

    expect(texto(el)).not.toContain('Turmas');
    expect(texto(el)).not.toContain('Matérias');
    expect(el.querySelectorAll('input[type="checkbox"]').length).toBe(0);
  });

  it('[TDD-132] [BDD-042] cancelar abre diálogo com foco no botão seguro', () => {
    auth.listarConvites.mockReturnValue(of([convitePendente]));
    const el = criar();
    vi.useFakeTimers();

    const cancelar = Array.from(el.querySelectorAll('button')).find(
      (botao) => botao.textContent?.trim() === 'Cancelar',
    ) as HTMLButtonElement;
    cancelar.click();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    const dialogo = el.querySelector('[role="dialog"]');
    expect(dialogo).toBeTruthy();
    expect(texto(dialogo as HTMLElement)).toContain(
      'Cancelar o convite para prof@escola.com?',
    );
    expect(document.activeElement?.id).toBe('dialogo-manter');
  });

  it('[TDD-133] [BDD-042] Esc fecha o diálogo sem cancelar o convite', () => {
    auth.listarConvites.mockReturnValue(of([convitePendente]));
    const el = criar();
    vi.useFakeTimers();

    const cancelar = Array.from(el.querySelectorAll('button')).find(
      (botao) => botao.textContent?.trim() === 'Cancelar',
    ) as HTMLButtonElement;
    cancelar.click();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    const dialogo = el.querySelector('[role="dialog"]') as HTMLElement;
    dialogo.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(auth.cancelarConvite).not.toHaveBeenCalled();
  });

  it('[TDD-134] [BDD-043] 409 mostra que o professor já faz parte da escola', () => {
    auth.enviarConvite.mockReturnValue(
      throwError(() => new ApiError(409, 'ja_vinculado')),
    );
    const el = criar();
    preencherConvite();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain('Este professor já faz parte da escola');
  });

  it('[TDD-135] [BDD-044] 403 leva ao painel com aviso de permissão', () => {
    auth.listarConvites.mockReturnValue(
      throwError(() => new ApiError(403, 'sem_permissao')),
    );
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();

    expect(navegar).toHaveBeenCalledWith(['/painel'], {
      queryParams: { aviso: 'sem_permissao' },
    });
  });

  it('[TDD-136] lista vazia mostra mensagem e botão de convidar', () => {
    const el = criar();

    expect(texto(el)).toContain('Nenhum convite enviado ainda.');
    expect(
      Array.from(el.querySelectorAll('button')).some(
        (botao) => botao.textContent?.trim() === 'Convidar professor',
      ),
    ).toBe(true);
  });

  it('cancelar confirmado marca o convite como cancelado', () => {
    auth.listarConvites.mockReturnValue(of([convitePendente]));
    const el = criar();
    vi.useFakeTimers();

    const cancelar = Array.from(el.querySelectorAll('button')).find(
      (botao) => botao.textContent?.trim() === 'Cancelar',
    ) as HTMLButtonElement;
    cancelar.click();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    const confirmar = Array.from(el.querySelectorAll('button')).find(
      (botao) => botao.textContent?.trim() === 'Cancelar convite',
    ) as HTMLButtonElement;
    confirmar.click();
    fixture.detectChanges();

    expect(auth.cancelarConvite).toHaveBeenCalledWith('c1');
    expect(texto(el)).toContain('Cancelado');
  });

  it('valida o e-mail antes de chamar a API', () => {
    criar();
    preencherConvite('prof@escola');
    submeter(formulario());
    fixture.detectChanges();

    expect(auth.enviarConvite).not.toHaveBeenCalled();
    expect(texto(fixture.nativeElement)).toContain('Informe um e-mail válido');
  });
});
