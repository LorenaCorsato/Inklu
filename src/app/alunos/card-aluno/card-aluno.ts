import { Router } from '@angular/router';
import { LucideEllipsisVertical, LucideUser, LucidePencil, LucideUserRoundX, LucideShare2 } from '@lucide/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';

export interface Aluno {
  id: any; // <--- Alterado para any
  nome: string;
  ano: string;
  deficiencia: string;
  genero: string;
  fotoUrl?: string;
  originalData?: any;
  status?: number; // 1 = ativo, 2 = inativo
}

@Component({
  selector: 'app-card-aluno',
  imports: [CommonModule, LucideEllipsisVertical, LucideUser, LucidePencil, LucideUserRoundX, LucideShare2],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.scss',
})
export class CardAluno {
  @Input({ required: true }) aluno!: Aluno;
  @Output() editar = new EventEmitter<Aluno>();
  @Output() excluir = new EventEmitter<Aluno>();

  isOptionsMenuOpen = false;

  constructor(private router: Router, private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOptionsMenuOpen = false;
    }
  }

  onCardClick() {
    this.router.navigate(['/alunos', this.aluno.id]);
  }

  onEditarClick(event: Event) {
    event.stopPropagation();
    this.editar.emit(this.aluno);
    this.closeOptionsMenu();
  }

  onExcluirClick(event: Event) {
    event.stopPropagation();
    this.excluir.emit(this.aluno);
    this.closeOptionsMenu();
  }

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
  }

  closeOptionsMenu() {
    this.isOptionsMenuOpen = false;
  }

  shouldShowDeficienciaLabel(): boolean {
    if (!this.aluno?.deficiencia) return false;
    return !this.aluno.deficiencia.toLowerCase().startsWith('deficiência');
  }

  getDeficienciaDisplay(): string {
    if (!this.aluno?.deficiencia) return '';
    return this.aluno.deficiencia.replace(/^Deficiência\s*/i, '');
  }
}