import { Component, input, output } from '@angular/core';
import {
  LucideEllipsis,
  LucideFolderInput,
  LucidePencilLine,
  LucideSquarePen,
  LucideTrash2,
} from '@lucide/angular';
import type { DocumentoArquivo } from '../../services/documentos.service';
import type { FileCategory } from '../documentos';

@Component({
  selector: 'app-arquivo-card',
  imports: [LucideEllipsis, LucideFolderInput, LucidePencilLine, LucideSquarePen, LucideTrash2],
  host: { style: 'display: contents' },
  templateUrl: './arquivo-card.html',
  styleUrl: './arquivo-card.scss',
})
export class ArquivoCard {
  readonly file = input.required<DocumentoArquivo>();
  readonly origin = input<string>('Documentos');
  readonly dateTime = input<string>('');
  readonly category = input<FileCategory>('other');
  readonly editable = input<boolean>(false);
  readonly menuOpen = input<boolean>(false);
  readonly layout = input<'grid' | 'list'>('grid');

  readonly open = output<string>();
  readonly menuToggle = output<{ id: string; event: Event }>();
  readonly rename = output<string>();
  readonly edit = output<DocumentoArquivo>();
  readonly move = output<string>();
  readonly remove = output<string>();
}
