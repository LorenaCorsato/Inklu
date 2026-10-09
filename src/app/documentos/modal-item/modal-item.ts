import { Component, computed, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { LucideX } from '@lucide/angular';

export type ItemDialogMode = 'rename' | 'edit' | 'move';
export type ItemDialogKind = 'folder' | 'file';

export interface ItemDialogDestination {
  id: string | null;
  label: string;
}

export interface ItemDialogResult {
  name: string;
  description: string;
  destinationId: string | null;
}

@Component({
  selector: 'app-modal-item',
  imports: [LucideX],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './modal-item.html',
  styleUrl: './modal-item.scss',
})
export class ModalItem implements OnChanges {
  @Input() isOpen = false;
  @Input() mode: ItemDialogMode = 'rename';
  @Input() itemKind: ItemDialogKind = 'file';
  @Input() itemName = '';
  @Input() itemDescription = '';
  @Input() destinations: ItemDialogDestination[] = [];
  @Input() destinationId: string | null = null;
  @Input() locationLabel = 'Documentos';
  @Output() saved = new EventEmitter<ItemDialogResult>();
  @Output() closed = new EventEmitter<void>();

  readonly name = signal('');
  readonly description = signal('');
  readonly destination = signal<string | null>(null);

  readonly title = computed(() => {
    if (this.mode === 'move') return `Mover ${this.itemKind === 'folder' ? 'pasta' : 'arquivo'}`;
    if (this.mode === 'edit') return 'Editar arquivo';
    return `Renomear ${this.itemKind === 'folder' ? 'pasta' : 'arquivo'}`;
  });

  readonly submitLabel = computed(() => (this.mode === 'move' ? 'Mover' : 'Salvar'));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.name.set(this.itemName);
      this.description.set(this.itemDescription);
      this.destination.set(this.destinationId);
    }
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  onDestinationChange(event: Event): void {
    this.destination.set((event.target as HTMLSelectElement).value || null);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(event: Event): void {
    event.preventDefault();

    const name = this.name().trim();
    if (this.mode !== 'move' && !name) return;

    this.saved.emit({
      name,
      description: this.description().trim(),
      destinationId: this.destination(),
    });
  }
}
