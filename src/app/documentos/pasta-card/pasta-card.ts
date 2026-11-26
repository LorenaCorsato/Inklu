import { Component, input, output } from '@angular/core';
import {
  LucideEllipsis,
  LucideFilePlus,
  LucideFolderInput,
  LucidePencilLine,
  LucideTrash2,
  LucideUsers,
} from '@lucide/angular';
import type { DocumentoFolder } from '../../services/documentos.service';

@Component({
  selector: 'app-pasta-card',
  imports: [LucideEllipsis, LucideFilePlus, LucideFolderInput, LucidePencilLine, LucideTrash2, LucideUsers],
  host: { style: 'display: contents' },
  templateUrl: './pasta-card.html',
  styleUrl: './pasta-card.scss',
})
export class PastaCard {
  readonly folder = input.required<DocumentoFolder>();
  readonly summary = input<string>('');
  readonly shared = input<boolean>(false);
  readonly menuOpen = input<boolean>(false);

  readonly open = output<string>();
  readonly menuToggle = output<{ id: string; event: Event }>();
  readonly addFile = output<string>();
  readonly rename = output<string>();
  readonly move = output<string>();
  readonly remove = output<string>();
}
