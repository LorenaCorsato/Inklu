import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { EscolherFuncao } from './escolher-funcao';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../api/api-error';
import { criarAuthFake, submeter, texto, type AuthFake } from '../test-auth.fake';

describe('Escolha de função (S04)', () => {
  let auth: AuthFake;
  let router: Router;
  let fixture: ComponentFixture<EscolherFuncao>;

  beforeEach(async () => {
    auth = criarAuthFake();

    await TestBed.configureTestingModule({
      imports: [EscolherFuncao],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  function criar(): HTMLElement {
    fixture = TestBed.createComponent(EscolherFuncao);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function formulario(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function selecionar(valor: string): void {
    const radio = fixture.nativeElement.querySelector(
      `input[value="${valor}"]`,
    ) as HTMLInputElement;
    radio.click();
    fixture.detectChanges();
  }

  it('[TDD-060] [BDD-020] o botão Continuar começa desabilitado', () => {
    const el = criar();
    const botao = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
  });

  it('[TDD-061] [BDD-020] selecionar uma opção habilita o botão', () => {
    const el = criar();
    selecionar('professor_regente');

    expect(
      (el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('[TDD-062] [BDD-020] envia a função escolhida', () => {
    criar();
    selecionar('professor_regente');
    submeter(formulario());

    expect(auth.definirFuncao).toHaveBeenCalledWith('professor_regente');
  });

  it('[TDD-063] [BDD-021] 409 funcao_ja_definida leva ao painel com aviso', () => {
    auth.definirFuncao.mockReturnValue(
      throwError(() => new ApiError(409, 'funcao_ja_definida')),
    );
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    criar();
    selecionar('professor_regente');
    submeter(formulario());

    expect(navegar).toHaveBeenCalledWith(['/painel'], {
      state: { aviso: 'funcao_ja_definida' },
      replaceUrl: true,
    });
  });

  it('[TDD-065] opções estão em fieldset com legend acessível', () => {
    const el = criar();
    const fieldset = el.querySelector('fieldset');
    expect(fieldset).toBeTruthy();
    expect(texto(fieldset!.querySelector('legend') as HTMLElement)).toBe(
      'Sua função',
    );
    expect(el.querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('erro de rede mantém a escolha e mostra mensagem', () => {
    auth.definirFuncao.mockReturnValue(throwError(() => new TypeError('offline')));
    const el = criar();
    selecionar('professor_apoio');
    submeter(formulario());
    fixture.detectChanges();

    expect(texto(el)).toContain(
      'Não foi possível conectar. Verifique sua internet e tente de novo',
    );
    expect(
      (el.querySelector('input[value="professor_apoio"]') as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
});
