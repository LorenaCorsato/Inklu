import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { Navbar } from './navbar';
import { ToastService } from '../shared/toast/toast.service';
import {
  DocumentoFile,
  ModalDocumento,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';
import { DocumentosService } from '../services/documentos.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const adicionarDocumentoButton = (): HTMLButtonElement | undefined =>
    [...elemento().querySelectorAll('button')].find((button) =>
      button.textContent?.toLowerCase().includes('adicionar documento'),
    );

  const openDocumentoModal = async (): Promise<void> => {
    adicionarDocumentoButton()?.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const itensDoMenu = (): HTMLAnchorElement[] =>
    [...elemento().querySelectorAll<HTMLAnchorElement>('.item')];

  const buscar = (termo: string): void => {
    const campo = elemento().querySelector<HTMLInputElement>('#nav-busca')!;
    campo.value = termo;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('agrupa os itens em Geral, Gestão e Organização', () => {
    const titulos = [...elemento().querySelectorAll('.grupo__titulo')].map((no) =>
      no.textContent?.trim(),
    );
    expect(titulos).toEqual(['Geral', 'Gestão', 'Organização']);
    expect(itensDoMenu().map((item) => item.textContent?.trim())).toEqual([
      'Início',
      'Tarefas',
      'Calendário',
      'Alunos',
      'Turmas',
      'Matérias',
      'Documentos',
    ]);
  });

  it('exibe o perfil da sessão ou o perfil demo', () => {
    expect(elemento().querySelector('.conta__nome')?.textContent?.trim()).toBe('Sara Wood');
    expect(elemento().querySelector('.conta__funcao')?.textContent?.trim()).toBe('Professor');
    expect(elemento().querySelector('.conta__avatar')?.textContent?.trim()).toBe('SW');
  });

  it('sair da conta volta ao login com toast de confirmação', async () => {
    const toast = TestBed.inject(ToastService);
    const sucesso = vi.spyOn(toast, 'sucesso');
    const navegar = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    component.alternarConta();
    fixture.detectChanges();

    const sair = [...elemento().querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Sair da conta'),
    );
    expect(sair).toBeTruthy();

    sair!.click();
    await fixture.whenStable();

    expect(sucesso).toHaveBeenCalledWith('Você saiu da conta.');
    expect(navegar).toHaveBeenCalledWith(['/entrar']);
  });

  it('filtra os itens do menu pela busca, ignorando acentos', () => {
    buscar('materi');
    expect(itensDoMenu().map((item) => item.textContent?.trim())).toEqual(['Matérias']);

    buscar('GESTAO');
    expect(itensDoMenu().map((item) => item.textContent?.trim())).toEqual([
      'Alunos',
      'Turmas',
      'Matérias',
    ]);
  });

  it('avisa quando nenhum item do menu corresponde à busca', () => {
    buscar('xyz');
    expect(itensDoMenu()).toHaveLength(0);
    expect(elemento().querySelector('.busca-vazia')?.textContent).toContain('xyz');
  });

  it('recolhe e expande a barra lateral', () => {
    const toggle = elemento().querySelector<HTMLButtonElement>('.sidebar__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    fixture.detectChanges();

    expect(component.isCollapsed).toBe(true);
    expect(elemento().classList.contains('collapsed')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Expandir menu lateral');
  });

  it('expande a barra ao usar o atalho "/"', () => {
    component.isCollapsed = true;
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    fixture.detectChanges();

    expect(component.isCollapsed).toBe(false);
  });

  it('abre o modal de documento ao clicar em "Adicionar documento"', async () => {
    await openDocumentoModal();

    expect(component.isDocumentoModalOpen).toBe(true);
    const modal = elemento().querySelector('app-modal-documento');
    expect(modal).toBeTruthy();
  });

  it('exibe o seletor de pasta de destino com as pastas de Documentos', async () => {
    await openDocumentoModal();

    const select = elemento().querySelector('select');
    expect(select).toBeTruthy();

    const options = [...select!.querySelectorAll('option')].map((option) =>
      option.textContent?.trim(),
    );
    expect(options[0]).toContain('Documentos (raiz)');
    expect(options).toContain('Planejamento');
    expect(options).toContain('— Mensal');
  });

  it('registra o arquivo na pasta escolhida no serviço de documentos', async () => {
    await openDocumentoModal();

    const select = elemento().querySelector('select') as HTMLSelectElement;
    select.value = 'f-avaliacoes';
    select.dispatchEvent(new Event('change'));

    const modal = fixture.debugElement.query(By.directive(ModalDocumento))
      .componentInstance as ModalDocumento;
    expect(modal.selectedFolderId).toBe('f-avaliacoes');

    const store = TestBed.inject(DocumentosService);
    const file: DocumentoFile = {
      name: 'Prova adaptada 2.pdf',
      size: 1024,
      type: 'application/pdf',
      data: 'data:application/pdf;base64,',
      progress: 100,
      status: 'done',
      folderId: modal.selectedFolderId,
    };

    component.onDocumentoFilesAdded([file]);

    const added = store.files().at(-1);
    expect(added?.name).toBe('Prova adaptada 2.pdf');
    expect(added?.folderId).toBe('f-avaliacoes');
  });
});
