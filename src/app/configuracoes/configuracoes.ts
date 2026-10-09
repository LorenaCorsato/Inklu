import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  LucideBell,
  LucideChevronRight,
  LucideFileText,
  LucideGlobe,
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

  constructor(readonly theme: ThemeService) {}

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
}
