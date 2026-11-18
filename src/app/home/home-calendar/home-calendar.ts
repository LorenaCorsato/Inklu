import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { HomeTask, MONTHS_PT } from '../home-tasks';

interface CalCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-home-calendar',
  imports: [CommonModule, LucideChevronLeft, LucideChevronRight],
  templateUrl: './home-calendar.html',
  styleUrl: './home-calendar.scss',
})
export class HomeCalendar {
  /** Tarefas usadas para os dots e o pill de cada dia. */
  readonly tasks = input<HomeTask[]>([]);

  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  protected readonly hoverDay = signal<string | null>(null);
  protected readonly touchDay = signal<string | null>(null);

  protected readonly monthLabel = computed(
    () => `${MONTHS_PT[this.viewMonth()]} ${this.viewYear()}`,
  );

  protected readonly cells = computed<CalCell[]>(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const startOffset = new Date(y, m, 1).getDay();
    const start = new Date(y, m, 1 - startOffset);
    const today = new Date();
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const all = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date, inMonth: date.getMonth() === m, isToday: sameDay(date, today) };
    });
    const needsSixth = startOffset + new Date(y, m + 1, 0).getDate() > 35;
    return needsSixth ? all : all.slice(0, 35);
  });

  protected prevMonth(): void {
    const m = this.viewMonth();
    if (m === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.set(m - 1);
    }
  }

  protected nextMonth(): void {
    const m = this.viewMonth();
    if (m === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.set(m + 1);
    }
  }

  protected dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  protected tasksOf(day: Date): HomeTask[] {
    return this.tasks().filter(
      (t) =>
        t.due.getFullYear() === day.getFullYear() &&
        t.due.getMonth() === day.getMonth() &&
        t.due.getDate() === day.getDate(),
    );
  }

  protected taskTime(t: HomeTask): string {
    return `${String(t.due.getHours()).padStart(2, '0')}:${String(t.due.getMinutes()).padStart(2, '0')}`;
  }

  protected showPill(cell: CalCell): boolean {
    if (this.tasksOf(cell.date).length === 0) return false;
    const k = this.dayKey(cell.date);
    return this.hoverDay() === k || this.touchDay() === k;
  }

  protected toggleTouch(cell: CalCell): void {
    if (this.tasksOf(cell.date).length === 0) return;
    const k = this.dayKey(cell.date);
    this.touchDay.set(this.touchDay() === k ? null : k);
  }
}
