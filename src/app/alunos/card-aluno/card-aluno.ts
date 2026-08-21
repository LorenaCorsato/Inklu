import { Router } from '@angular/router';
import { LucideEllipsisVertical, LucideUser, LucidePencil, LucideTrash2, LucideShare2 } from '@lucide/angular';
import { CommonModule } from '@angular/common'; 
import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';

export interface Aluno {
  id: any; // <--- Alterado para any
  nome: string;
  ano: string;
  deficiencia: string;
  genero: string;
  fotoUrl?: string;
  originalData?: any; 
}

@Component({
  selector: 'app-card-aluno',
  imports: [CommonModule, LucideEllipsisVertical, LucideUser, LucidePencil, LucideTrash2, LucideShare2],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.scss',
})
export class CardAluno {
  @Input({ required: true }) aluno!: Aluno;
  @Output() editar = new EventEmitter<Aluno>(); 
  
  isOptionsMenuOpen = false;

  private readonly onDocumentClick: (event: Event) => void;

  constructor(private router: Router, private elementRef: ElementRef) {
    this.onDocumentClick = (event: Event) => {
      if (this.isOptionsMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
        this.isOptionsMenuOpen = false;
      }
    };
  }

  ngOnInit() {
    document.addEventListener('click', this.onDocumentClick, true);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  onCardClick() {
    this.router.navigate(['/alunos', this.aluno.id]);
  }

  onEditarClick(event: Event) {
    event.stopPropagation();
    this.editar.emit(this.aluno); 
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