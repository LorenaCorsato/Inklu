import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Navbar } from './navbar';
import {
  DocumentoFile,
  ModalDocumento,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';
import { DocumentosService } from '../services/documentos.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const adicionarDocumentoButton = (): HTMLButtonElement | undefined =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(button =>
      button.textContent?.includes('Adicionar Documento'),
    );

  const openDocumentoModal = async (): Promise<void> => {
    adicionarDocumentoButton()?.click();
    await fixture.whenStable();
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

  it('abre o modal de documento ao clicar em "Adicionar Documento"', async () => {
    await openDocumentoModal();

    expect(component.isDocumentoModalOpen).toBe(true);
    const modal = (fixture.nativeElement as HTMLElement).querySelector('app-modal-documento');
    expect(modal).toBeTruthy();
  });

  it('exibe o seletor de pasta de destino com as pastas de Documentos', async () => {
    await openDocumentoModal();

    const select = (fixture.nativeElement as HTMLElement).querySelector('select');
    expect(select).toBeTruthy();

    const options = [...select!.querySelectorAll('option')].map(option =>
      option.textContent?.trim(),
    );
    expect(options[0]).toContain('Documentos (raiz)');
    expect(options).toContain('Planejamento');
    expect(options).toContain('— Mensal');
  });

  it('registra o arquivo na pasta escolhida no serviço de documentos', async () => {
    await openDocumentoModal();

    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select',
    ) as HTMLSelectElement;
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
