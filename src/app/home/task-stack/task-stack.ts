import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideClock3,
} from '@lucide/angular';
import { HomeTask } from '../home-tasks';

interface ExitingTask {
  uid: number;
  task: HomeTask;
  dir: 'next' | 'prev';
}

@Component({
  selector: 'app-task-stack',
  imports: [CommonModule, LucideCalendarDays, LucideChevronLeft, LucideChevronRight, LucideClock3],
  templateUrl: './task-stack.html',
  styleUrl: './task-stack.scss',
})
export class TaskStack {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Tarefas já ordenadas pela data limite. */
  readonly tasks = input<HomeTask[]>([]);

  protected readonly taskIndex = signal(0);
  protected readonly animDir = signal<'next' | 'prev' | null>(null);
  protected readonly enteringId = signal<HomeTask['id'] | null>(null);
  protected readonly exitingCards = signal<ExitingTask[]>([]);

  protected readonly dragging = signal(false);
  protected readonly dragOffsetX = signal(0);

  private uidCounter = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private readonly timers = new Set<number>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timers.forEach((id) => window.clearTimeout(id));
      this.timers.clear();
    });
  }

  protected readonly safeIndex = computed(() => {
    const len = this.tasks().length;
    return len === 0 ? 0 : Math.min(this.taskIndex(), len - 1);
  });

  protected readonly visibleStack = computed(() =>
    this.tasks().slice(this.safeIndex(), this.safeIndex() + 3),
  );

  protected readonly canPrev = computed(() => this.safeIndex() > 0);
  protected readonly canNext = computed(() => this.safeIndex() < this.tasks().length - 1);

  protected next(): void {
    if (!this.canNext()) return;
    this.navigateTo(this.safeIndex() + 1, 'next');
  }

  protected prev(): void {
    if (!this.canPrev()) return;
    this.navigateTo(this.safeIndex() - 1, 'prev');
  }

  protected jumpBy(offset: number): void {
    if (offset <= 0) return;
    const target = Math.min(this.safeIndex() + offset, this.tasks().length - 1);
    if (target === this.safeIndex()) return;
    this.navigateTo(target, 'next');
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a')) return;

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragging.set(true);
    this.dragOffsetX.set(0);

    (event.currentTarget as HTMLElement | null)?.setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) return;

    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;

    // Preserva rolagem vertical no mobile caso o gesto seja vertical
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10 && Math.abs(dx) < 10) {
      this.onPointerCancel();
      return;
    }

    const blocked = (dx < 0 && !this.canNext()) || (dx > 0 && !this.canPrev());
    this.dragOffsetX.set(blocked ? dx * 0.25 : dx);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging()) return;

    const dx = event.clientX - this.dragStartX;
    this.dragging.set(false);
    this.dragOffsetX.set(0);

    if (dx < -60 && this.canNext()) {
      this.next();
    } else if (dx > 60 && this.canPrev()) {
      this.prev();
    }
  }

  protected onPointerCancel(): void {
    this.dragging.set(false);
    this.dragOffsetX.set(0);
  }

  protected dueLabel(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  protected goTask(): void {
    void this.router.navigate(['/tarefas']);
  }

  private navigateTo(targetIndex: number, dir: 'next' | 'prev'): void {
    const list = this.tasks();
    const currentTask = list[this.safeIndex()];
    const nextTask = list[targetIndex];
    if (!currentTask || !nextTask) return;

    const uid = ++this.uidCounter;
    this.exitingCards.update((cards) => [...cards, { uid, task: currentTask, dir }]);

    this.animDir.set(dir);
    this.taskIndex.set(targetIndex);
    this.enteringId.set(nextTask.id);

    const exitTimer = window.setTimeout(() => {
      this.exitingCards.update((cards) => cards.filter((c) => c.uid !== uid));
      this.timers.delete(exitTimer);
    }, 300);
    this.timers.add(exitTimer);

    const enterTimer = window.setTimeout(() => {
      if (this.enteringId() === nextTask.id) {
        this.enteringId.set(null);
      }
      this.timers.delete(enterTimer);
    }, 380);
    this.timers.add(enterTimer);
  }
}