import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'inklu-theme-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQuery: MediaQueryList | null = null;

  readonly mode = signal<ThemeMode>(this.loadInitial());
  readonly isDark = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => this.applySystem());

    effect(() => {
      this.mode();
      this.apply();
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.save(mode);
  }

  private apply(): void {
    const mode = this.mode();
    if (mode === 'system') {
      this.applySystem();
    } else {
      this.setDark(mode === 'dark');
    }
  }

  private applySystem(): void {
    if (this.mode() !== 'system') return;
    this.setDark(this.mediaQuery?.matches ?? false);
  }

  private setDark(dark: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }

  private save(mode: ThemeMode): void {
    localStorage.setItem(STORAGE_KEY, mode);
  }

  private loadInitial(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {}
    return 'system';
  }
}
