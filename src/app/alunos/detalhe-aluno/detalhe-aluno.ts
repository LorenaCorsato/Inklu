import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideUser,
  LucideDownload,
  LucideMoreVertical,
  LucideGraduationCap,
  LucideAccessibility,
  LucideCalendar,
  LucideTrendingUp,
  LucidePencil,
  LucideTrash2,
  LucideShare2
} from '@lucide/angular';
import { Aluno } from '../card-aluno/card-aluno';

@Component({
  selector: 'app-detalhe-aluno',
  imports: [
    CommonModule,
    LucideArrowLeft,
    LucideUser,
    LucideDownload,
    LucideMoreVertical,
    LucideGraduationCap,
    LucideAccessibility,
    LucideCalendar,
    LucideTrendingUp,
    LucidePencil,
    LucideTrash2,
    LucideShare2
  ],
  templateUrl: './detalhe-aluno.html',
  styleUrl: './detalhe-aluno.scss',
})
export class DetalheAluno {
  aluno: Aluno | null = null;
  isOptionsMenuOpen = false;

  private readonly onDocumentClick: (event: Event) => void;

  constructor(private route: ActivatedRoute, private router: Router, private elementRef: ElementRef) {
    this.onDocumentClick = (event: Event) => {
      if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isOptionsMenuOpen = false;
      }
    };
  }

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick, true);
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.aluno = this.getAlunoById(id);
    });
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  voltar() {
    this.router.navigate(['/alunos']);
  }

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
  }

  closeOptionsMenu() {
    this.isOptionsMenuOpen = false;
  }

  private getAlunoById(id: number): Aluno | null {
    const alunos: Aluno[] = [
      {
        id: 1,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
      },
      {
        id: 2,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=400&h=300&fit=crop',
      },
      {
        id: 3,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
      },
      {
        id: 4,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      },
      {
        id: 5,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop',
      },
      {
        id: 6,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop',
      },
      {
        id: 7,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop',
      },
      {
        id: 8,
        nome: 'Alex Oliveira',
        ano: '3º Ano',
        deficiencia: 'Autismo',
        genero: 'Masculino',
        fotoUrl: 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop',
      },
    ];
    return alunos.find(a => a.id === id) ?? null;
  }
}
