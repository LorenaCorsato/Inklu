import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

export interface AlunoForm {
  nomeCompleto: string;
  fotoUrl: string | null;
  dataNascimento: string;
  genero: string;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  serieAno: string;
  turmaSala: string;
  diagnostico: string;
}

@Component({
  selector: 'app-modal-aluno',
  imports: [FormsModule, LucideX],
  templateUrl: './modal-aluno.html',
  styleUrl: './modal-aluno.scss',
})
export class ModalAluno {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AlunoForm>();

  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
  ];

  series = [
    { value: '1ano', label: '1º Ano' },
    { value: '2ano', label: '2º Ano' },
    { value: '3ano', label: '3º Ano' },
    { value: '4ano', label: '4º Ano' },
    { value: '5ano', label: '5º Ano' },
    { value: '6ano', label: '6º Ano' },
    { value: '7ano', label: '7º Ano' },
    { value: '8ano', label: '8º Ano' },
    { value: '9ano', label: '9º Ano' },
  ];

  turmas = [
    { value: 'turma-a', label: 'Turma A' },
    { value: 'turma-b', label: 'Turma B' },
    { value: 'turma-c', label: 'Turma C' },
    { value: 'turma-d', label: 'Turma D' },
  ];

  diagnosticos = [
    { value: 'tdah', label: 'TDAH (Transtorno do Déficit de Atenção com Hiperatividade)' },
    { value: 'autismo', label: 'TEA (Transtorno do Espectro Autista)' },
    { value: 'deficiencia-fisica', label: 'Deficiência Física' },
    { value: 'deficiencia-visual', label: 'Deficiência Visual' },
    { value: 'deficiencia-auditiva', label: 'Deficiência Auditiva' },
    { value: 'intelectual', label: 'Deficiência Intelectual' },
    { value: 'outro', label: 'Outro' },
  ];

  form: AlunoForm = {
    nomeCompleto: '',
    fotoUrl: null,
    dataNascimento: '',
    genero: '',
    nomeResponsavel: '',
    telefoneResponsavel: '',
    serieAno: '',
    turmaSala: '',
    diagnostico: '',
  };

  previewUrl: string | null = null;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.form.fotoUrl = URL.createObjectURL(file);
      this.previewUrl = this.form.fotoUrl;
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.closed.emit();
  }

  save() {
    this.saved.emit(this.form);
    this.resetForm();
    this.close();
  }

  private resetForm() {
    this.form = {
      nomeCompleto: '',
      fotoUrl: null,
      dataNascimento: '',
      genero: '',
      nomeResponsavel: '',
      telefoneResponsavel: '',
      serieAno: '',
      turmaSala: '',
      diagnostico: '',
    };
    this.previewUrl = null;
  }
}
