import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { LucideFiles } from '@lucide/angular';

/**
 * Ilha lateral com as páginas atuais do documento.
 *
 * Serve como guia de navegação: mostra a quantidade de páginas e destaca a
 * página visível, permitindo saltar para qualquer uma delas.
 */
@Component({
  selector: 'app-editor-pages',
  imports: [LucideFiles],
  templateUrl: './editor-pages.html',
  styleUrl: './editor-pages.scss',
})
export class EditorPages {
  private readonly pageCountSignal = signal(1);

  /** Quantidade de páginas; o setter mantém a lista reativa. */
  @Input() set pageCount(value: number) {
    this.pageCountSignal.set(Math.max(1, Math.floor(value) || 1));
  }

  /** Página atualmente visível (1-based). */
  @Input() currentPage = 1;

  @Output() pageSelect = new EventEmitter<number>();

  /** Lista [1..pageCount] usada no `@for` do template. */
  readonly pages = computed(() =>
    Array.from({ length: this.pageCountSignal() }, (_, index) => index + 1),
  );
}
