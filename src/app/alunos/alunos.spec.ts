import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Alunos } from './alunos';
import { AlunoService } from './aluno.service';

describe('Alunos', () => {
  let component: Alunos;
  let fixture: ComponentFixture<Alunos>;
  let alunoService: Pick<AlunoService, 'listarAlunos' | 'cadastrarAluno'>;

  beforeEach(async () => {
    alunoService = {
      listarAlunos: vi.fn().mockReturnValue(of([
        {
          id: 99,
          nome_completo: 'Maria Souza',
          turma: { serie: '5º Ano', nome: 'A' },
          diagnostico: 'TDAH',
          genero: 'Feminino',
          fotoUrl: 'https://example.com/maria.jpg',
        },
      ])),
      cadastrarAluno: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Alunos],
      providers: [provideRouter([]), { provide: AlunoService, useValue: alunoService }],
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
    expect(component.alunos[0].ano).toBe('5º Ano A');
    expect(component.alunos[0].deficiencia).toBe('TDAH');
  });
});
