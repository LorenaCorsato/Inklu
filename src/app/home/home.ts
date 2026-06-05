import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  LucideBookOpenText,
  LucideCalendarClock,
  LucideCheckCheck,
  LucideChevronDown,
  LucideClock3,
  LucideDiamond,
  LucideEllipsisVertical,
  LucideFileText,
  LucideFiles,
  LucideTriangleAlert,
  LucideUser,
} from '@lucide/angular';

type Priority = 'Alta' | 'Médio' | 'Baixa';

interface TaskCard {
  title: string;
  description: string;
  fileName: string;
  dueLabel: string;
  priority: Priority;
}

interface DocumentCard {
  title: string;
  subject: string;
  timeAgo: string;
  student: string;
}

interface MetricCard {
  label: string;
  value: string;
  iconClass: string;
  icon: 'pending' | 'success' | 'primary';
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    LucideBookOpenText,
    LucideCalendarClock,
    LucideCheckCheck,
    LucideChevronDown,
    LucideClock3,
    LucideDiamond,
    LucideEllipsisVertical,
    LucideFileText,
    LucideFiles,
    LucideTriangleAlert,
    LucideUser,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly metrics: MetricCard[] = [
    {
      label: 'Tarefas pendentes',
      value: '32',
      iconClass: 'metric-icon--danger',
      icon: 'pending',
    },
    {
      label: 'Tarefas concluídas',
      value: '4',
      iconClass: 'metric-icon--success',
      icon: 'success',
    },
    {
      label: 'Docs. adaptados',
      value: '32',
      iconClass: 'metric-icon--primary',
      icon: 'primary',
    },
  ] as const;

  protected readonly tasks: TaskCard[] = [
    {
      title: 'Fazer Relatórios para pais João',
      description: 'Realizar o relatório de aproveitamento para os pais do João e salvar em PDF.',
      fileName: 'pei_aluna.pdf',
      dueLabel: '12/06 às 12h30',
      priority: 'Médio',
    },
    {
      title: 'Fazer Relatórios para pais João',
      description: 'Revisar as observações, ajustar a linguagem e validar com coordenação.',
      fileName: 'pei_aluna.pdf',
      dueLabel: '12/06 às 12h30',
      priority: 'Alta',
    },
    {
      title: 'Fazer Relatórios para pais João',
      description: 'Atualizar o documento com adaptações de leitura e anexar exemplos de apoio.',
      fileName: 'pei_aluna.pdf',
      dueLabel: '12/06 às 12h30',
      priority: 'Baixa',
    },
    {
      title: 'Fazer Relatórios para pais João',
      description: 'Conferir status final e encaminhar para assinatura do responsável.',
      fileName: 'pei_aluna.pdf',
      dueLabel: '12/06 às 12h30',
      priority: 'Alta',
    },
  ];

  protected readonly recentDocuments: DocumentCard[] = [
    {
      title: 'Atividade_matematica_felipe_2b',
      subject: 'Matemática',
      timeAgo: 'Há 30 min',
      student: 'Felipe',
    },
    {
      title: 'Atividade_matematica_felipe_2b',
      subject: 'Matemática',
      timeAgo: 'Há 30 min',
      student: 'Felipe',
    },
    {
      title: 'Atividade_matematica_felipe_2b',
      subject: 'Matemática',
      timeAgo: 'Há 30 min',
      student: 'Felipe',
    },
    {
      title: 'Atividade_matematica_felipe_2b',
      subject: 'Matemática',
      timeAgo: 'Há 30 min',
      student: 'Felipe',
    },
  ];

  protected getPriorityClass(priority: Priority): string {
    return `priority--${priority.toLowerCase()}`;
  }
}
