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

  get isFormValid(): boolean {
    return !!(
      this.form.nomeCompleto?.trim() &&
      this.form.dataNascimento &&
      this.form.genero &&
      this.form.nomeResponsavel?.trim() &&
      this.form.telefoneResponsavel?.trim() &&
      this.form.serieAno &&
      this.form.turmaSala &&
      this.form.diagnostico
    );
  }
  generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'feminino', label: 'Feminino' },
    { value: 'outro', label: 'Outro' },
  ];

  series = [
    { value: '6ano', label: '6º Ano' },
    { value: '7ano', label: '7º Ano' },
    { value: '8ano', label: '8º Ano' },
    { value: '9ano', label: '9º Ano' },
    { value: '1ano', label: '1º Ano' },
    { value: '2ano', label: '2º Ano' },
    { value: '3ano', label: '3º Ano' },

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
      const reader = new FileReader();

      // Quando o arquivo terminar de ser lido, converte para Base64
      reader.onload = () => {
        this.form.fotoUrl = reader.result as string; // Resultado é data:image/...
        this.previewUrl = this.form.fotoUrl;
      };

      // Lê o arquivo gerando uma URL em Base64
      reader.readAsDataURL(file);
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
    if (!this.isFormValid) {
      alert('Por favor, preencha todos os campos obrigatórios antes de salvar.');
      return;
    }
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

  aplicaMascaraTelefone(event: any) {
    let valor = event.target.value.replace(/\D/g, ''); 
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }

    let formato = valor;
    if (valor.length > 2 && valor.length <= 6) {
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    } else if (valor.length > 6 && valor.length <= 10) { 
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2, 6)}-${valor.substring(6)}`;
    } else if (valor.length === 11) { 
      formato = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    }

    event.target.value = formato;
    this.form.telefoneResponsavel = formato;
  }
}
