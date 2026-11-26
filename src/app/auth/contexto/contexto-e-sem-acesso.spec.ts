import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Contexto } from './contexto';
import { SemAcesso } from '../sem-acesso/sem-acesso';
import { AuthService } from '../services/auth.service';
import { SessaoStore } from '../state/sessao.store';
import { criarAuthFake, texto, type AuthFake } from '../test-auth.fake';
import type { Vinculo } from '../auth.models';

describe('Seletor de contexto (S08)', () => {
  let auth: AuthFake;
  let router: Router;
  let store: SessaoStore;
  let fixture: ComponentFixture<Contexto>;

  const vinculos: Vinculo[] = [
    {
      id: 'v1',
      escolaNome: 'Conta individual',
      funcao: 'professor_regente',
    },
    {
      id: 'v2',
      escolaNome: 'Escola Exemplo',
      funcao: 'professor_apoio',
      ultimoUsado: true,
    },
  ];

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [Contexto],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(SessaoStore);
    store.usuario.set({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      emailVerificado: true,
    });
    store.vinculos.set(vinculos);
    store.contexto.set(null);
    store.carregada.set(true);
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(Contexto);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('[TDD-100] [BDD-061] lista um botão por vínculo com escola e função', () => {
    const el = criar();

    const botoes = el.querySelectorAll('button.vinculo-card');
    expect(botoes.length).toBe(2);
    expect(texto(botoes[0] as HTMLElement)).toContain('Conta individual');
    expect(texto(botoes[0] as HTMLElement)).toContain('Professor Regente');
    expect(texto(botoes[1] as HTMLElement)).toContain('Escola Exemplo');
    expect(texto(botoes[1] as HTMLElement)).toContain('Professor de Apoio');
    expect(texto(botoes[1] as HTMLElement)).toContain('Último usado');
  });

  it('[TDD-101] [BDD-061] escolher um vínculo envia o id e navega ao painel', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const escola = Array.from(el.querySelectorAll('button.vinculo-card')).find(
      (botao) => botao.textContent?.includes('Escola Exemplo'),
    ) as HTMLButtonElement;
    escola.click();
    fixture.detectChanges();

    expect(auth.escolherContexto).toHaveBeenCalledWith('v2');
    expect(navegar).toHaveBeenCalledWith(['/painel'], { replaceUrl: true });
  });

  it('vínculo revogado mostra mensagem e recarrega a lista', () => {
    auth.escolherContexto.mockImplementation(() => {
      throw new TypeError('vínculo removido');
    });
    const el = criar();

    const escola = Array.from(el.querySelectorAll('button.vinculo-card')).find(
      (botao) => botao.textContent?.includes('Escola Exemplo'),
    ) as HTMLButtonElement;
    escola.click();
    fixture.detectChanges();

    expect(texto(el)).toMatch(/vínculo não está mais ativo|Não foi possível conectar/);
    expect(auth.carregarSessao).toHaveBeenCalledWith(true);
  });
});

describe('Sem vínculo ativo (S09)', () => {
  let auth: AuthFake;
  let router: Router;
  let store: SessaoStore;
  let fixture: ComponentFixture<SemAcesso>;

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [SemAcesso],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(SessaoStore);
    store.usuario.set({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      emailVerificado: true,
      funcao: null,
    });
    store.vinculos.set([]);
    store.carregada.set(true);
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(SemAcesso);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('[TDD-102] [BDD-062] não exibe campo de código ou ID de escola', () => {
    const el = criar();

    expect(texto(el)).toContain(
      'Sua conta ainda não tem acesso a uma escola ou conta individual.',
    );
    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('select')).toBeNull();
    expect(texto(el)).toContain('Escolher função');
  });

  it('[TDD-103] "Sair" chama logout e vai para o login', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = criar();

    const sair = Array.from(el.querySelectorAll('button')).find(
      (botao) => botao.textContent?.trim() === 'Sair',
    ) as HTMLButtonElement;
    sair.click();

    expect(auth.logout).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/entrar'], { replaceUrl: true });
  });

  it('sem função oferece "Escolher função"; com função orienta a coordenação', () => {
    let el = criar();
    const escolher = Array.from(el.querySelectorAll('button')).find((botao) =>
      botao.textContent?.includes('Escolher função'),
    ) as HTMLButtonElement;
    escolher.click();

    store.usuario.set({
      nome: 'Ana Souza',
      email: 'ana@exemplo.com',
      emailVerificado: true,
      funcao: 'professor_apoio',
    });
    fixture = TestBed.createComponent(SemAcesso);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;

    expect(texto(el)).toContain('Fale com a coordenação da sua escola');
    expect(texto(el)).not.toContain('Escolher função');
  });
});
