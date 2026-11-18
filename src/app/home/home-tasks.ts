export interface HomeTask {
  id: string;
  kind: string;
  title: string;
  description: string;
  minutes: number;
  due: Date;
}

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function atDay(year: number, month: number, day: number, h = 9, m = 0): Date {
  return new Date(year, month, day, h, m, 0, 0);
}

export function seedHomeTasks(base = new Date()): HomeTask[] {
  const y = base.getFullYear();
  const mo = base.getMonth();
  const d = base.getDate();
  const tasks: HomeTask[] = [
    { id: 't1', kind: 'Tarefa', title: 'Avaliação da aluna Sofia', description: 'Você precisa finalizar a avaliação da aluna Sofia para o PAEE e PEI', minutes: 30, due: atDay(y, mo, d + 1, 14) },
    { id: 't2', kind: 'Tarefa', title: 'Revisar atividade de leitura da Marina', description: 'Ajustar o texto e conferir se as instruções estão claras para a estudante.', minutes: 20, due: atDay(y, mo, d, 14) },
    { id: 't3', kind: 'Tarefa', title: 'Atualizar o plano de apoio do Theo', description: 'Registrar os avanços da semana e combinar os próximos objetivos.', minutes: 45, due: atDay(y, mo, d + 2, 10) },
    { id: 't4', kind: 'Tarefa', title: 'Preparar material de matemática da Luiza', description: 'Separar exercícios com apoio visual para a aula de frações.', minutes: 25, due: atDay(y, mo, d + 3, 16) },
    { id: 't5', kind: 'Tarefa', title: 'Enviar resumo da semana para a família do Caio', description: 'Reunir os registros de participação e compartilhar com a responsável.', minutes: 15, due: atDay(y, mo, d + 4, 12) },
    { id: 't6', kind: 'Tarefa', title: 'Adaptar prova de ciências do 4º ano', description: 'Ampliar fonte e incluir apoio visual nas questões.', minutes: 40, due: atDay(y, mo, d + 6, 9) },
    { id: 't7', kind: 'Tarefa', title: 'Reunião com coordenação pedagógica', description: 'Alinhar metas do bimestre para a turma inclusiva.', minutes: 60, due: atDay(y, mo, d + 7, 11) },
    { id: 't8', kind: 'Tarefa', title: 'Organizar portfólio da turma', description: 'Arquivar atividades adaptadas concluídas no mês.', minutes: 35, due: atDay(y, mo, d + 9, 15) },
    { id: 't9', kind: 'Tarefa', title: 'Planejar aula de arte sensorial', description: 'Preparar materiais táteis para a atividade de sexta-feira.', minutes: 50, due: atDay(y, mo, d + 10, 8) },
    { id: 't10', kind: 'Tarefa', title: 'Revisar PEI do 1º semestre', description: 'Conferir metas atingidas e atualizar o documento.', minutes: 55, due: atDay(y, mo, d + 12, 13) },
    { id: 't11', kind: 'Tarefa', title: 'Formação sobre desenho universal', description: 'Assistir ao módulo online e anotar práticas aplicáveis.', minutes: 90, due: atDay(y, mo, d + 14, 17) },
    { id: 't12', kind: 'Tarefa', title: 'Devolutiva para responsáveis', description: 'Preparar resumo individual de progresso dos alunos.', minutes: 45, due: atDay(y, mo, d + 15, 10) },
  ];
  return tasks.sort((a, b) => a.due.getTime() - b.due.getTime());
}
