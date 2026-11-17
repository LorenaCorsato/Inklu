import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { CadastroEscola } from './cadastro-escola';
import { AuthService } from '../services/auth.service';
import { EscolaService } from '../services/escola.service';
import { ApiError } from '../api/api-error';
import { criarAuthFake, preencher, submeter, texto, type AuthFake } from '../test-auth.fake';

describe('Cadastro da escola (S12)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<CadastroEscola>;

  beforeEach(async () => {
    auth = criarAuthFake();
    const escolaFake = {
      buscarCep: vi.fn(() => of({})),
      listarTurmas: vi.fn(() => of([])),
      listarMaterias: vi.fn(() => of([])),
    };

    await TestBed.configureTestingModule({
      imports: [CadastroEscola],
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
    fixture = TestBed.createComponent(CadastroEscola);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function clicar(rotulo: string): void {
    const botao = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((item) => item.textContent?.trim() === rotulo) as HTMLButtonElement;
    expect(botao, `botão ${rotulo}`).toBeTruthy();
    botao.click();
    fixture.detectChanges();
  }

  function preencherEtapa1(cnpj = '11222333000181'): void {
    preencher(fixture, '#escola-cnpj', cnpj);
    preencher(fixture, '#escola-nome', 'Escola Exemplo');
    preencher(fixture, '#escola-email', 'escola@exemplo.com');
    preencher(fixture, '#escola-cep', '01001000');
    preencher(fixture, '#escola-logradouro', 'Rua A');
    preencher(fixture, '#escola-numero', '100');
    preencher(fixture, '#escola-cidade', 'São Paulo');
    preencher(fixture, '#escola-uf', 'SP');
  }

  function preencherEtapa2(nome = 'Ana Souza'): void {
    preencher(fixture, '#responsavel-nome', nome);
    preencher(fixture, '#responsavel-email', 'ana@exemplo.com');
    preencher(fixture, '#responsavel-senha', 'Senha1234');
    preencher(fixture, '#responsavel-confirmacao', 'Senha1234');
  }

  function irAteRevisao(): void {
    preencherEtapa1();
    clicar('Continuar');
    preencherEtapa2();
    clicar('Continuar');
  }

  it('[TDD-120] [BDD-031] não avança da etapa 1 com CNPJ inválido', () => {
    const el = criar();
    preencherEtapa1('11222333000182');
    clicar('Continuar');

    expect(texto(el)).toContain('Dados da escola');
    expect(texto(el)).toContain('CNPJ inválido');
    expect(el.querySelector('#responsavel-nome')).toBeNull();
  });

  it('[TDD-121] [BDD-030] Criar escola fica desabilitado até o checkbox', () => {
    criar();
    irAteRevisao();

    const botao = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);

    fixture.componentInstance.declaro.set(true);
    fixture.detectChanges();
    expect(botao.disabled).toBe(false);
  });

  it('[TDD-122] [BDD-032] Editar na revisão volta à etapa com os dados', () => {
    const el = criar();
    irAteRevisao();

    const editarResponsavel = el.querySelectorAll('.resumo-secao button')[1] as HTMLButtonElement;
    editarResponsavel.click();
    fixture.detectChanges();

    expect(texto(el)).toContain('Responsável');
    expect((el.querySelector('#responsavel-nome') as HTMLInputElement).value).toBe(
      'Ana Souza',
    );

    preencher(fixture, '#responsavel-nome', 'Ana Souza Lima');
    clicar('Continuar');

    expect(texto(el)).toContain('Ana Souza Lima');
  });

  it('[TDD-123] [BDD-033] nenhum campo de senha aparece na revisão', () => {
    criar();
    irAteRevisao();

    expect(fixture.nativeElement.querySelectorAll('input[type="password"]').length).toBe(0);
    expect(texto(fixture.nativeElement)).not.toContain('Senha1234');
  });

  it('[TDD-124] [BDD-034] 409 do CNPJ volta à etapa 1 com erro no campo', () => {
    auth.criarEscola.mockReturnValue(
      throwError(() => new ApiError(409, 'cnpj_em_uso')),
    );
    criar();
    irAteRevisao();
    fixture.componentInstance.declaro.set(true);
    fixture.detectChanges();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(fixture.nativeElement)).toContain(
      'Já existe uma escola cadastrada com este CNPJ',
    );
    expect(fixture.nativeElement.querySelector('#escola-cnpj')).toBeTruthy();
  });

  it('[TDD-125] o indicador de etapas usa aria-current="step"', () => {
    const el = criar();
    expect(
      el.querySelector('nav li[aria-current="step"]')?.textContent,
    ).toContain('Dados da escola');

    clicar('Continuar');
    expect(
      el.querySelector('nav li[aria-current="step"]')?.textContent,
    ).toContain('Responsável');
  });

  it('[TDD-126] [BDD-030] sucesso navega para a verificação do responsável', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    criar();
    irAteRevisao();
    fixture.componentInstance.declaro.set(true);
    fixture.detectChanges();
    submeter(formulario());
    fixture.detectChanges();

    expect(auth.criarEscola).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: '11222333000181',
        nomeEscola: 'Escola Exemplo',
        responsavel: {
          nome: 'Ana Souza',
          email: 'ana@exemplo.com',
          senha: 'Senha1234',
        },
      }),
    );
    expect(navegar).toHaveBeenCalledWith(
      ['/verificar-email'],
      expect.objectContaining({
        state: expect.objectContaining({ email: 'ana@exemplo.com' }),
      }),
    );
  });

  it('não avança da etapa 2 com senhas diferentes', () => {
    criar();
    preencherEtapa1();
    clicar('Continuar');
    preencher(fixture, '#responsavel-nome', 'Ana Souza');
    preencher(fixture, '#responsavel-email', 'ana@exemplo.com');
    preencher(fixture, '#responsavel-senha', 'Senha1234');
    preencher(fixture, '#responsavel-confirmacao', 'Senha9999');
    clicar('Continuar');

    expect(texto(fixture.nativeElement)).toContain('As senhas não coincidem');
  });

  it('erro de rede mantém as etapas preenchidas', () => {
    auth.criarEscola.mockReturnValue(throwError(() => new TypeError('offline')));
    criar();
    irAteRevisao();
    fixture.componentInstance.declaro.set(true);
    fixture.detectChanges();
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(fixture.nativeElement)).toContain(
      'Não foi possível conectar. Verifique sua internet e tente de novo',
    );
    expect(texto(fixture.nativeElement)).toContain('Escola Exemplo');
  });
});
