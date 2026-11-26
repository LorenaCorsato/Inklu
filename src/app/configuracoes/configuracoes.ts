import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideBell,
  LucideChevronRight,
  LucideFileText,
  LucideHelpCircle,
  LucideHome,
  LucideLock,
  LucideMoon,
  LucideSettings,
  LucideShield,
  LucideSun,
  LucideUser,
} from '@lucide/angular';
import { ThemeService, ThemeMode } from '../services/theme.service';

type SettingsSection = 'geral' | 'conta' | 'seguranca' | 'suporte' | 'termos';

interface SettingsMenuItem {
  id: SettingsSection;
  label: string;
  icon: 'home' | 'user' | 'shield' | 'help' | 'file';
}

@Component({
  selector: 'app-configuracoes',
  imports: [
    CommonModule,
    LucideBell,
    LucideChevronRight,
    LucideFileText,
    LucideHelpCircle,
    LucideHome,
    LucideLock,
    LucideMoon,
    LucideSettings,
    LucideShield,
    LucideSun,
    LucideUser,
  ],
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.scss',
})
export class Configuracoes {
  activeSection: SettingsSection = 'geral';

  private readonly rota = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor(readonly theme: ThemeService) {
    // Permite chegar direto a uma seção pela URL — é assim que o link
    // "Ajuda" da navbar abre a seção Suporte.
    this.rota.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parametros) => {
        const secao = parametros.get('secao');
        if (this.ehSecao(secao)) this.activeSection = secao;
      });
  }

  readonly menuItems: SettingsMenuItem[] = [
    { id: 'geral', label: 'Geral', icon: 'home' },
    { id: 'conta', label: 'Conta', icon: 'user' },
    { id: 'seguranca', label: 'Segurança', icon: 'shield' },
    { id: 'suporte', label: 'Suporte', icon: 'help' },
    { id: 'termos', label: 'Termos e Privacidade', icon: 'file' },
  ];

  setSection(section: SettingsSection): void {
    this.activeSection = section;
  }

  onThemeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ThemeMode;
    this.theme.setMode(value);
  }

  private ehSecao(valor: string | null): valor is SettingsSection {
    return this.menuItems.some((item) => item.id === valor);
  }
}
