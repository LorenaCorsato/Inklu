import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alunos } from './alunos';

describe('Alunos', () => {
  let component: Alunos;
  let fixture: ComponentFixture<Alunos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alunos],
    }).compileComponents();

    fixture = TestBed.createComponent(Alunos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
