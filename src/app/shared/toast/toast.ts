import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { LucideX, LucideAlertCircle, LucideCheckCircle, LucideInfo } from '@lucide/angular';

@Component({
  selector: 'app-toast',
  imports: [LucideX, LucideAlertCircle, LucideCheckCircle, LucideInfo],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast implements OnChanges {
  @Input() isOpen = false;
  @Input() message = '';
  @Input() type: 'error' | 'success' | 'info' = 'error';
  @Input() duration = 5000;
  @Output() closed = new EventEmitter<void>();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.startTimer();
    }
  }

  close(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.closed.emit();
  }

  private startTimer(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.close(), this.duration);
  }
}
