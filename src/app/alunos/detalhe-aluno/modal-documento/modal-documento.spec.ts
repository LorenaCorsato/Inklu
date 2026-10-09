import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalDocumento } from './modal-documento';

describe('ModalDocumento', () => {
  let fixture: ComponentFixture<ModalDocumento>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDocumento],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalDocumento);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega as matérias e inicializa a pasta ao abrir para um aluno sem pastas', () => {
    fixture.componentRef.setInput('defaultFolderId', 'planejamento');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedFolderId).toBe('planejamento');
    expect(fixture.nativeElement.querySelector('#doc-materia-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.drop-zone')).toBeTruthy();
    http.expectOne('http://localhost:3000/api/materias').flush([
      { id_materia: '2', nome: 'Português' },
      { id_materia: '1', nome: 'Matemática' },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.materias.map(materia => materia.nome)).toEqual([
      'Matemática', 'Português',
    ]);
    expect(fixture.componentInstance.isLoadingMaterias).toBe(false);
  });

  it('mostra a pasta de destino no modo local sem consultar matérias', async () => {
    fixture.componentRef.setInput('localOnly', true);
    fixture.componentRef.setInput('folders', [
      { id: null, label: 'Documentos (raiz)' },
      { id: 'planejamento', label: 'Planejamento' },
    ]);
    fixture.componentRef.setInput('defaultFolderId', 'planejamento');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.folder-field select').value).toBe('planejamento');
    expect(fixture.nativeElement.querySelector('#doc-materia-select')).toBeNull();
    http.expectNone('http://localhost:3000/api/materias');
  });
});
