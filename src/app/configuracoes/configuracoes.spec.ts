import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { Configuracoes } from './configuracoes';

/** `ActivatedRoute` mínima: o componente só lê os parâmetros de consulta. */
function rotaFake(parametros: Record<string, string>) {
  return { queryParamMap: of(convertToParamMap(parametros)) };
}

describe('Configuracoes', () => {
  let fixture: ComponentFixture<Configuracoes> | null = null;

  const criar = (parametros: Record<string, string>): Configuracoes => {
    TestBed.configureTestingModule({
      imports: [Configuracoes],
      providers: [{ provide: ActivatedRoute, useValue: rotaFake(parametros) }],
    });
    fixture = TestBed.createComponent(Configuracoes);
    return fixture.componentInstance;
  };

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    expect(criar({})).toBeTruthy();
  });

  it('abre a seção indicada em ?secao=', () => {
    expect(criar({ secao: 'suporte' }).activeSection).toBe('suporte');
  });

  it('ignora uma seção desconhecida na URL', () => {
    expect(criar({ secao: 'inexistente' }).activeSection).toBe('geral');
  });
});
