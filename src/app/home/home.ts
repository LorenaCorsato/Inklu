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
      value: '6',
      iconClass: 'metric-icon--danger',
      icon: 'pending',
    },
    {
      label: 'Tarefas concluídas',
      value: '18',
      iconClass: 'metric-icon--success',
      icon: 'success',
    },
    {
      label: 'Docs. adaptados',
      value: '24',
      iconClass: 'metric-icon--primary',
      icon: 'primary',
    },
  ] as const;

  protected readonly tasks: TaskCard[] = [
    {
      title: 'Revisar atividade de leitura da Ana',
      description: 'Simplificar as instruções e destacar as palavras-chave antes de compartilhar com a família.',
      fileName: 'leitura_ana_3ano.docx',
      dueLabel: '27/10 às 10h',
      priority: 'Alta',
    },
    {
      title: 'Preparar apoio visual para o Lucas',
      description: 'Montar uma sequência visual para a rotina de atividades da manhã.',
      fileName: 'rotina_lucas.pdf',
      dueLabel: '27/10 às 14h',
      priority: 'Médio',
    },
    {
      title: 'Adaptar avaliação de matemática do Pedro',
      description: 'Organizar uma questão por página e incluir exemplos de apoio visual.',
      fileName: 'avaliacao_matematica_pedro.docx',
      dueLabel: '28/10 às 11h',
      priority: 'Médio',
    },
    {
      title: 'Atualizar plano de acompanhamento da Sofia',
      description: 'Registrar os objetivos trabalhados e as observações da última semana.',
      fileName: 'acompanhamento_sofia.docx',
      dueLabel: '29/10 às 16h',
      priority: 'Baixa',
    },
    {
      title: 'Revisar atividade de ciências do Miguel',
      description: 'Ajustar o texto e separar as etapas do experimento em instruções curtas.',
      fileName: 'experimento_miguel.pdf',
      dueLabel: '30/10 às 9h',
      priority: 'Alta',
    },
    {
      title: 'Compartilhar resumo com a família da Beatriz',
      description: 'Conferir o resumo de progresso e preparar uma versão acessível para envio.',
      fileName: 'resumo_beatriz.docx',
      dueLabel: '30/10 às 15h',
      priority: 'Baixa',
    },
  ];

  protected readonly recentDocuments: DocumentCard[] = [
    {
      title: 'Leitura guiada - conto popular',
      subject: 'Língua Portuguesa',
      timeAgo: 'Há 20 min',
      student: 'Ana',
    },
    {
      title: 'Rotina visual da manhã',
      subject: 'Apoio pedagógico',
      timeAgo: 'Há 1 hora',
      student: 'Lucas',
    },
    {
      title: 'Avaliação de matemática - unidade 4',
      subject: 'Matemática',
      timeAgo: 'Há 3 horas',
      student: 'Pedro',
    },
    {
      title: 'Resumo de acompanhamento semanal',
      subject: 'Plano individual',
      timeAgo: 'Ontem',
      student: 'Sofia',
    },
    {
      title: 'Experimento: ciclo da água',
      subject: 'Ciências',
      timeAgo: 'Ontem',
      student: 'Miguel',
    },
    {
      title: 'Resumo de progresso do bimestre',
      subject: 'Acompanhamento',
      timeAgo: 'Há 2 dias',
      student: 'Beatriz',
    },
  ];

  protected getPriorityClass(priority: Priority): string {
    return `priority--${priority.toLowerCase()}`;
  }
}
