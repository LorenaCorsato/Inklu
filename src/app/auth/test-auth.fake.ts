import { vi } from 'vitest';
import { of } from 'rxjs';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import type { StatusLogin } from './auth.models';

/**
 * Dublê de `AuthService` para testes de componente e guard.
 * Mantém as telas independentes do transporte HTTP.
 */
export function criarAuthFake() {
  return {
    registrar: vi.fn(() => of({})),
    verificarEmail: vi.fn(() => of({ proximo: 'escolher_funcao' })),
    reenviarVerificacao: vi.fn(() => of(undefined)),
    definirFuncao: vi.fn(() => of({ proximo: 'painel' })),
    login: vi.fn(() => of({ status: 'ok' as StatusLogin })),
    verificarMfa: vi.fn(() => of({})),
    escolherContexto: vi.fn(() => of({ proximo: 'painel' })),
    logout: vi.fn(() => of(undefined)),
    carregarSessao: vi.fn(() => of({ usuario: null, vinculos: [], contexto: null })),
    garantirSessao: vi.fn(() => of({ usuario: null, vinculos: [], contexto: null })),
    obterConvite: vi.fn(),
    aceitarConvite: vi.fn(() => of({})),
    criarEscola: vi.fn(() => of({})),
    enviarConvite: vi.fn(() => of({})),
    listarConvites: vi.fn(() => of([])),
    reenviarConvite: vi.fn(() => of({})),
    cancelarConvite: vi.fn(() => of(undefined)),
    esquecerSenha: vi.fn(() => of(undefined)),
    redefinirSenha: vi.fn(() => of({})),
  };
}

export type AuthFake = ReturnType<typeof criarAuthFake>;

/**
 * Preenche um campo e dispara os eventos que o `DefaultValueAccessor`
 * escuta. Usar `DebugElement.triggerEventHandler` evita depender de como o
 * jsdom entrega eventos nativos compostos.
 */
export function preencher(
  fixture: ComponentFixture<unknown>,
  seletor: string,
  valor: string,
): HTMLInputElement {
  const debug = fixture.debugElement.query(By.css(seletor));
  const elemento = debug.nativeElement as HTMLInputElement;
  elemento.value = valor;
  // Em jsdom o listener do DefaultValueAccessor não é acionado pelo evento
  // nativo; o output `ngModelChange` é o mesmo caminho que a diretiva usa.
  debug.triggerEventHandler('ngModelChange', valor);
  fixture.detectChanges();
  return elemento;
}

export function digitarNaSenha(
  fixture: ComponentFixture<unknown>,
  seletor: string,
  valor: string,
): HTMLInputElement {
  return preencher(fixture, seletor, valor);
}

export function submeter(formulario: HTMLFormElement): void {
  formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export function texto(elemento: HTMLElement): string {
  return (elemento.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function idDoFoco(): string {
  return document.activeElement?.id ?? '';
}
