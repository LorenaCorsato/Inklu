import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideCheckCheck,
  LucideClock3,
  LucideEllipsis,
  LucideFiles,
} from '@lucide/angular';
import { DocumentosService } from '../services/documentos.service';
import { SessaoStore } from '../auth/state/sessao.store';
import { HomeCalendar } from './home-calendar/home-calendar';
import { MONTHS_PT, seedHomeTasks } from './home-tasks';
import { TaskStack } from './task-stack/task-stack';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    LucideCheckCheck,
    LucideClock3,
    LucideEllipsis,
    LucideFiles,
    TaskStack,
    HomeCalendar,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly documentos = inject(DocumentosService);
  private readonly sessao = inject(SessaoStore);

  protected readonly now = signal(new Date());

  /** Primeiro nome do usuário logado; sem sessão mantém o perfil demo. */
  protected readonly primeiroNome = computed(
    () => this.sessao.usuario()?.nome?.trim().split(/\s+/)[0] || 'Sara',
  );

  protected readonly dateChip = computed(() => {
    const d = this.now();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} | ${hh}:${mm}`;
  });

  protected readonly greeting = computed(() => {
    const h = this.now().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  // Tarefas ordenadas, compartilhadas entre pilha e calendário.
  protected readonly tasks = signal(seedHomeTasks());
  protected readonly pendingCount = computed(() => this.tasks().length);
  protected readonly doneCount = computed(() => 3);
  protected readonly docsCount = computed(() => this.documentos.files().length);

  // ─── Documentos recentes (5 mais recentes) ───
  protected readonly recentFiles = computed(() =>
    [...this.documentos.files()]
      .sort((a, b) => +new Date(b.modifiedAt) - +new Date(a.modifiedAt))
      .slice(0, 5),
  );

  protected readonly recentDisplay = computed(() => {
    const real = this.recentFiles();
    if (real.length >= 5) {
      return real.map((f) => ({
        real: f as { id: string; name: string; size: number; type: string; modifiedAt: string } | null,
      }));
    }
    const out: { real: { id: string; name: string; size: number; type: string; modifiedAt: string } | null }[] =
      real.map((f) => ({ real: f }));
    while (out.length < 5) out.push({ real: null });
    return out;
  });

  protected sizeLabel(bytes: number): string {
    if (bytes >= 1_048_576) {
      const mb = bytes / 1_048_576;
      return `${mb >= 10 ? Math.round(mb) : mb.toFixed(mb % 1 ? 1 : 0)}mb`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))}kb`;
  }

  protected fileDateLabel(iso: string): string {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} | ${hh}:${mi}`;
  }

  protected typeLabel(mime: string, name: string): string {
    if (mime.includes('pdf') || name.endsWith('.pdf')) return 'Atividade';
    if (mime.includes('word') || name.endsWith('.docx')) return 'Avaliação';
    if (mime.includes('sheet') || name.endsWith('.xlsx')) return 'Planilha';
    if (mime.startsWith('image/')) return 'Imagem';
    return 'Documento';
  }

  protected subjectLabel(): string {
    return 'Matemática';
  }

  protected openDoc(id: string | null): void {
    if (id) void this.router.navigate(['/documentos/editor', id]);
    else void this.router.navigate(['/documentos']);
  }
}
