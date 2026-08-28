import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  LucideX,
  LucideUploadCloud,
  LucideTrash2,
  LucideXCircle,
  LucideAlertTriangle,
} from '@lucide/angular';

export interface DocumentoFile {
  name: string;
  size: number;
  type: string;
  data: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

@Component({
  selector: 'app-modal-documento',
  imports: [CommonModule, LucideX, LucideUploadCloud, LucideTrash2, LucideXCircle, LucideAlertTriangle],
  templateUrl: './modal-documento.html',
  styleUrl: './modal-documento.scss',
})
export class ModalDocumento {
  @Input() isOpen = false;
  @Input() alunoId: number | string | null | undefined;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  files: DocumentoFile[] = [];
  isDragOver = false;
  maxFileSize = 1024 * 1024 * 1024; // 1 GB
  errorMessage: string | null = null;
  isSaving = false;

  constructor(private http: HttpClient) {}

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    if (this.isSaving) return;
    this.files = [];
    this.closed.emit();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
    input.value = '';
  }

  browseFiles() {
    const input = document.getElementById('doc-file-input') as HTMLInputElement;
    input?.click();
  }

  private addFiles(fileList: FileList) {
    this.errorMessage = null;
    const invalidFiles: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!this.isAllowedType(file)) {
        invalidFiles.push(file.name);
        continue;
      }
      if (file.size > this.maxFileSize) continue;

      const docFile: DocumentoFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: '',
        progress: 0,
        status: 'uploading',
      };
      this.files.push(docFile);
      this.readFile(docFile, file);
    }

    if (invalidFiles.length > 0) {
      this.errorMessage = `Formato não permitido: ${invalidFiles.join(', ')}. Use apenas PDF, JPG, PNG ou DOCX.`;
    }
  }

  private isAllowedType(file: File): boolean {
    if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  }

  clearError() {
    this.errorMessage = null;
  }

  private readFile(documento: DocumentoFile, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      documento.data = reader.result as string;
      documento.progress = 100;
      documento.status = 'done';
    };
    reader.onerror = () => {
      documento.status = 'error';
      this.errorMessage = `Não foi possível ler o arquivo ${file.name}.`;
    };
    reader.readAsDataURL(file);
  }

  save() {
    if (this.isSaving) return;

    if (!this.alunoId) {
      this.errorMessage = 'Aluno não identificado.';
      return;
    }

    const filesToSave = this.files.filter(file => file.status === 'done' && file.data);
    if (filesToSave.length === 0) {
      this.errorMessage = 'Aguarde o carregamento dos arquivos.';
      return;
    }

    this.isSaving = true;
    let savedCount = 0;
    filesToSave.forEach(file => {
      this.http.post(`http://localhost:3000/api/arquivos/alunos/${this.alunoId}`, {
        nomeArquivo: file.name,
        tipoArquivo: file.type || 'application/octet-stream',
        arquivo: file.data,
      }).subscribe({
        next: () => {
          savedCount++;
          if (savedCount === filesToSave.length) {
            this.isSaving = false;
            alert('Documentos salvos com sucesso!');
            this.saved.emit();
            this.close();
          }
        },
        error: (error) => {
          console.error('Erro ao salvar documento:', error);
          this.isSaving = false;
          this.errorMessage = `Não foi possível salvar ${file.name}.`;
        },
      });
    });
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  formatSizeWithTotal(file: DocumentoFile): string {
    if (file.status === 'uploading') {
      return `${this.formatSize(file.size * file.progress / 100)} of ${this.formatSize(file.size)}`;
    }
    return this.formatSize(file.size);
  }

  getFileIcon(file: DocumentoFile): string {
    if (file.type.includes('pdf')) return 'PDF';
    if (file.type.includes('zip') || file.type.includes('compressed')) return 'ZIP';
    return 'FILE';
  }
}
