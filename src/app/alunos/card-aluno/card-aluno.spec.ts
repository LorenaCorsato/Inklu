import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAluno, Aluno } from './card-aluno';

describe('CardAluno', () => {
  let component: CardAluno;
  let fixture: ComponentFixture<CardAluno>;

  const mockAluno: Aluno = {
    id: 1,
    nome: 'Alex Oliveira',
    ano: '3º Ano',
    deficiencia: 'Autismo',
    genero: 'Masculino'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAluno],
    }).compileComponents();

    fixture = TestBed.createComponent(CardAluno);
    component = fixture.componentInstance;
    component.aluno = mockAluno;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display aluno name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.card-aluno-nome')?.textContent).toContain('Alex Oliveira');
  });

  it('should display aluno ano', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.ano-badge')?.textContent).toContain('3º Ano');
  });

  it('should display deficiencia', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const detalhes = compiled.querySelectorAll('.detalhe-valor');
    expect(detalhes[0]?.textContent).toContain('Autismo');
  });

  it('should display genero', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const detalhes = compiled.querySelectorAll('.detalhe-valor');
    expect(detalhes[1]?.textContent).toContain('Masculino');
  });

  it('should show placeholder when no fotoUrl', () => {
    component.aluno = { ...mockAluno, fotoUrl: undefined };
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.aluno-placeholder')).toBeTruthy();
    expect(compiled.querySelector('.aluno-imagem')).toBeFalsy();
  });

  it('should show image when fotoUrl provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.aluno-imagem')).toBeTruthy();
    expect(compiled.querySelector('.aluno-placeholder')).toBeFalsy();
  });
});
