import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Alunos } from './alunos';
import { AlunoService } from './aluno.service';

describe('Alunos', () => {
  let component: Alunos;
  let fixture: ComponentFixture<Alunos>;
  let alunoService: jasmine.SpyObj<AlunoService>;

  beforeEach(async () => {
    alunoService = jasmine.createSpyObj('AlunoService', ['listarAlunos', 'cadastrarAluno']);
    alunoService.listarAlunos.and.returnValue(of([
      {
        id: 99,
        nome: 'Maria Souza',
        ano: '5º Ano',
        deficiencia: 'TDAH',
        genero: 'Feminino',
        fotoUrl: 'https://example.com/maria.jpg',
      },
    ]));

    await TestBed.configureTestingModule({
      imports: [Alunos],
      providers: [{ provide: AlunoService, useValue: alunoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Alunos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students from the backend on init', () => {
    expect(alunoService.listarAlunos).toHaveBeenCalled();
    expect(component.alunos.length).toBe(1);
    expect(component.alunos[0].nome).toBe('Maria Souza');
  });
});
