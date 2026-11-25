import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { LucideX, LucideCheck, LucideInfo, LucideTriangleAlert } from '@lucide/angular';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  source: 'input' | 'service';
  mounted: boolean;
  expanded: boolean;
  leaving: boolean;
  slotCollapsing: boolean;
  hovered: boolean;
  startedAt: number;
  remaining: number;
  mountId: ReturnType<typeof setTimeout> | null;
  expandId: ReturnType<typeof setTimeout> | null;
  collapseId: ReturnType<typeof setTimeout> | null;
  slotId: ReturnType<typeof setTimeout> | null;
  finishId: ReturnType<typeof setTimeout> | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly trigger$ = new Subject<ToastOptions>();
  readonly events$ = this.trigger$.asObservable();

  show(message: string, type: ToastType = 'info', duration = 5000): void {
    this.trigger$.next({ message, type, duration });
  }

  success(message: string, duration = 5000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 5000): void {
    this.show(message, 'info', duration);
  }
}

@Component({
  selector: 'app-toast',
  imports: [LucideX, LucideCheck, LucideInfo, LucideTriangleAlert],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() message = '';
  @Input() type: ToastType = 'error';
  @Input() duration = 5000;
  @Input() maxToasts = 4;
  @Output() closed = new EventEmitter<void>();

  readonly toasts = signal<ToastItem[]>([]);

  private readonly toastService = inject(ToastService);
  private serviceSub: Subscription | null = null;
  private nextId = 0;

  ngOnInit(): void {
    this.serviceSub = this.toastService.events$.subscribe(({ message, type, duration }) => {
      this.enqueue(message, type ?? 'info', duration ?? this.duration, 'service');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.enqueue(this.message, this.type, this.duration, 'input');
      } else {
        this.closeBySource('input');
      }
      return;
    }

    // Se outro toast for disparado enquanto isOpen já está true, empilha o novo.
    if (this.isOpen && (changes['message'] || changes['type'])) {
      this.enqueue(this.message, this.type, this.duration, 'input');
    }
  }

  ngOnDestroy(): void {
    this.serviceSub?.unsubscribe();
    for (const toast of this.toasts()) {
      this.clearTimers(toast);
    }
  }

  /** Método público caso queira disparar diretamente via ViewChild. */
  show(message: string, type: ToastType = 'info', duration = this.duration): void {
    this.enqueue(message, type, duration, 'service');
  }

  close(id: number): void {
    this.requestClose(id);
  }

  onMouseEnter(id: number): void {
    const toast = this.find(id);
    if (!toast || toast.leaving) return;

    toast.hovered = true;
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
      toast.timeoutId = null;
      toast.remaining = Math.max(toast.remaining - (Date.now() - toast.startedAt), 0);
    }
  }

  onMouseLeave(id: number): void {
    const toast = this.find(id);
    if (!toast || toast.leaving) return;

    toast.hovered = false;
    if (toast.expanded && !toast.timeoutId) {
      this.armTimer(toast, toast.remaining > 0 ? toast.remaining : toast.duration);
    }
  }

  private enqueue(
    message: string,
    type: ToastType,
    duration: number,
    source: 'input' | 'service'
  ): void {
    if (!message) return;

    // Mantém a pilha dentro do limite fechando o mais antigo antes.
    const active = this.toasts().filter((t) => !t.leaving && !t.slotCollapsing);
    if (active.length >= this.maxToasts) {
      this.requestClose(active[0].id);
    }

    const id = ++this.nextId;
    const item: ToastItem = {
      id,
      message,
      type,
      duration,
      source,
      mounted: false,
      expanded: false,
      leaving: false,
      slotCollapsing: false,
      hovered: false,
      startedAt: 0,
      remaining: duration,
      mountId: null,
      expandId: null,
      collapseId: null,
      slotId: null,
      finishId: null,
      timeoutId: null,
    };

    this.toasts.update((list) => [...list, item]);

    // Frame seguinte: abre o espaço vertical na pilha para empurrar os anteriores suavemente.
    item.mountId = setTimeout(() => {
      this.patch(id, { mounted: true });
    }, 16);

    // Fase 2: expande a pílula e inicia o anel de progresso (independente do mouse).
    item.expandId = setTimeout(() => {
      const current = this.find(id);
      if (!current || current.leaving) return;

      this.patch(id, { expanded: true });
      if (!current.hovered) {
        this.armTimer(current, current.duration);
      }
    }, 300);
  }

  private closeBySource(source: 'input' | 'service'): void {
    for (const toast of this.toasts()) {
      if (toast.source === source && !toast.leaving) {
        this.requestClose(toast.id);
      }
    }
  }

  private requestClose(id: number): void {
    const toast = this.find(id);
    if (!toast || toast.leaving || toast.slotCollapsing) return;

    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
      toast.timeoutId = null;
    }
    if (toast.expandId) {
      clearTimeout(toast.expandId);
      toast.expandId = null;
    }

    const wasExpanded = toast.expanded;

    // Passo 1 da saída inversa: recolhe texto e X de volta para o círculo.
    this.patch(id, { expanded: false });

    const collapseDelay = wasExpanded ? 320 : 0;
    const exitDuration = 260;
    const slotDuration = 300;

    // Passo 2: pílula circular desaparece (inverso do toast-pop).
    toast.collapseId = setTimeout(() => {
      this.patch(id, { leaving: true });
    }, collapseDelay);

    // Passo 3: fecha o espaço ocupado na pilha para os demais deslizarem.
    toast.slotId = setTimeout(() => {
      this.patch(id, { slotCollapsing: true });
    }, collapseDelay + exitDuration - 40);

    // Passo 4: remove do DOM.
    toast.finishId = setTimeout(() => {
      const removedSource = this.find(id)?.source;
      this.clearTimers(toast);
      this.toasts.update((list) => list.filter((t) => t.id !== id));

      if (removedSource === 'input') {
        const hasInputLeft = this.toasts().some((t) => t.source === 'input');
        if (!hasInputLeft) {
          this.closed.emit();
        }
      }
    }, collapseDelay + exitDuration + slotDuration);
  }

  private armTimer(toast: ToastItem, ms: number): void {
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.remaining = ms;
    toast.startedAt = Date.now();
    toast.timeoutId = setTimeout(() => this.requestClose(toast.id), ms);
  }

  private find(id: number): ToastItem | undefined {
    return this.toasts().find((t) => t.id === id);
  }

  private patch(id: number, partial: Partial<ToastItem>): void {
    this.toasts.update((list) =>
      list.map((t) => (t.id === id ? Object.assign(t, partial) : t))
    );
  }

  private clearTimers(toast: ToastItem): void {
    if (toast.mountId) clearTimeout(toast.mountId);
    if (toast.expandId) clearTimeout(toast.expandId);
    if (toast.collapseId) clearTimeout(toast.collapseId);
    if (toast.slotId) clearTimeout(toast.slotId);
    if (toast.finishId) clearTimeout(toast.finishId);
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.mountId =
      toast.expandId =
      toast.collapseId =
      toast.slotId =
      toast.finishId =
      toast.timeoutId =
        null;
  }
}