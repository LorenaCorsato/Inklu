import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';
import { ModalCrop } from '../modal-crop/modal-crop';

export interface AlunoForm {
  id?: any; // <--- Alterado para any
  nomeCompleto: string;
  fotoUrl: string | null;
  dataNascimento: string;
  genero: string;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  serieAno: string;
  turmaSala: string;
  diagnostico: string;
  status?: number; 
}

@Component({
  selector: 'app-modal-aluno',
  imports: [FormsModule, LucideX, ModalCrop],
  templateUrl: './modal-aluno.html',
  styleUrl: './modal-aluno.scss',
})
export class ModalAluno implements OnChanges {
  @Input() isOpen = false;
  @Input() alunoEdicao: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AlunoForm>();

  isEditMode = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      if (this.alunoEdicao) {
        this.isEditMode = true;
        this.form = {
          id: this.alunoEdicao.id, 
          nomeCompleto: this.alunoEdicao.nome,
          fotoUrl: this.alunoEdicao.fotoUrl || null,
          serieAno: this.series.find(s => s.label === this.alunoEdicao.ano)?.value || '',
          diagnostico: this.diagnosticos.find(d => d.label === this.alunoEdicao.deficiencia)?.value || '',
          genero: this.generos.find(g => g.label === this.alunoEdicao.genero)?.value || '',
          dataNascimento: this.alunoEdicao.originalData?.data_de_nascimento || '',
          nomeResponsavel: this.alunoEdicao.originalData?.nome_responsavel || '',
          telefoneResponsavel: this.alunoEdicao.originalData?.telefone_responsavel || '',
          turmaSala: this.alunoEdicao.originalData?.turma || '',
          status: 1, 
          
        };
        this.previewUrl = this.form.fotoUrl;
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

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
    id: undefined,
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
  isCropModalOpen = false;
  tempImageSrc: string | null = null;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.tempImageSrc = reader.result as string;
        this.isCropModalOpen = true;
        input.value = '';
        this.cdr.detectChanges();
      };

      reader.readAsDataURL(file);
    }
  }

  onCropComplete(croppedImage: string) {
    this.form.fotoUrl = croppedImage;
    this.previewUrl = croppedImage;
    this.isCropModalOpen = false;
    this.tempImageSrc = null;
    this.cdr.detectChanges();
  }

  onCropClosed() {
    this.isCropModalOpen = false;
    this.tempImageSrc = null;
    this.cdr.detectChanges();
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
      id: undefined, 
      nomeCompleto: '',
      fotoUrl: null,
      dataNascimento: '',
      genero: '',
      nomeResponsavel: '',
      telefoneResponsavel: '',
      serieAno: '',
      turmaSala: '',
      diagnostico: '',
      status: 1,
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