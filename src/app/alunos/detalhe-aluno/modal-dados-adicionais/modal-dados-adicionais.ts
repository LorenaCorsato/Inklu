import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

export interface DadosAdicionais {
  interesses: string[];
  preferencias: string;
}

@Component({
  selector: 'app-modal-dados-adicionais',
  imports: [CommonModule, FormsModule, LucideX],
  templateUrl: './modal-dados-adicionais.html',
  styleUrl: './modal-dados-adicionais.scss',
})
export class ModalDadosAdicionais {
  @Input() isOpen = false;
  @Input() dadosIniciais: DadosAdicionais | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<DadosAdicionais>();

  interesseInput = '';
  preferenciaTexto = '';

  interesses: string[] = [];

  ngOnInit() {
    if (this.dadosIniciais) {
      this.interesses = [...this.dadosIniciais.interesses];
      this.preferenciaTexto = this.dadosIniciais.preferencias;
    }
  }

  close() {
    this.closed.emit();
  }

  addInteresse() {
    const value = this.interesseInput.trim();
    if (value && !this.interesses.includes(value)) {
      this.interesses.push(value);
      this.interesseInput = '';
    }
  }

  removeInteresse(index: number) {
    this.interesses.splice(index, 1);
  }

  save() {
    this.saved.emit({
      interesses: [...this.interesses],
      preferencias: this.preferenciaTexto,
    });
    this.close();
  }
}
