import { readFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { CampoPlano, ConteudoPlano, PerfilPlano, TipoPlano, PlanoError } from '../models/plano.model';
import { DocumentParserService, escapeHtml, sanitizeDocument } from './document-parser.service';

const definitions: Record<TipoPlano, Array<[string, string, boolean]>> = {
  pei: [
    ['componenteCurricular', 'Componente Curricular:', true],
    ['conteudosHabilidades', 'Quais conteúdos e habilidades', true],
    ['estrategias', 'Quais estratégias, intervenções', true],
    ['instrumentos', 'Quais instrumentos', true],
    ['atividades', 'Quais vídeos, livros', true],
  ],
  paee: [
    ['nivelApoio', 'd) Nível de Apoio', false],
    ['observacoes', 'Observações:', false],
    ['estudoCaso', 'II- Informações identificadas', true],
    ['apoiosServicos', 'III - Apoios, Recursos e Serviços', true],
    ['motivosApoio', 'Descrever os motivos', true],
    ['habilidades', 'Descrever as habilidades', true],
    ['estrategias', 'Descrever quais estratégias', true],
    ['planejamento', 'Descreva o planejamento bimestral', true],
    ['professorRegente', 'Em relação ao Professor Regente', true],
    ['ensinoColaborativo', 'Em relação ao Projeto Ensino Colaborativo', true],
    ['equipeGestora', 'Em relação à equipe gestora', true],
    ['materiais', 'Descreva os materiais pedagógicos', true],
    ['pdde', 'Indicar materiais e equipamentos', true],
    ['barreiras', 'Quais medidas a escola', true],
  ],
};

export class PlanoTemplateService {
  private readonly templates = new Map<TipoPlano, Promise<{ fields: CampoPlano[]; signatures: string[]; supportHint: string; supportOptions: string[] }>>();
  private readonly crest = readFile(new URL('../../templates/brasao-sp.jpeg', import.meta.url)).then(buffer => buffer.toString('base64'));
  constructor(private readonly parser = new DocumentParserService()) {}

  async template(type: TipoPlano) {
    let pending = this.templates.get(type);
    if (!pending) {
      pending = this.readTemplate(type);
      this.templates.set(type, pending);
      pending.catch(() => this.templates.delete(type));
    }
    return pending;
  }

  private async readTemplate(type: TipoPlano) {
    const buffer = await readFile(new URL(`../../templates/${type}.docx`, import.meta.url));
    const document = await this.parser.parse(buffer, 'docx');
    const paragraphs = parse(document.html).querySelectorAll('p, li').map(p => p.textContent.trim());
    const fields = definitions[type].map(([id, prefix, required]) => {
      const label = paragraphs.find(text => text.startsWith(prefix));
      if (!label) throw new Error(`Campo ${id} não encontrado no modelo ${type}.`);
      return { id, label: label.replace(/_+/g, '').trim(), required };
    });
    const signatures = paragraphs.filter(text => /^(Nome.*Assinatura|Assinatura dos Professores|CIÊNCIA DO RESPONSÁVEL)/i.test(text));
    const supportStart = paragraphs.findIndex(text => text.startsWith('III - Apoios'));
    const supportEnd = paragraphs.findIndex(text => text.startsWith('Descrever os motivos'));
    const supportOptions: string[] = [];
    const supportHint = type === 'paee' ? paragraphs.slice(supportStart + 1, supportEnd).filter(Boolean).map(text => {
      if (!/^\(\s*\)/.test(text)) return `<p>${escapeHtml(text)}</p>`;
      const id = `servico-${supportOptions.length + 1}`;
      supportOptions.push(id);
      return `<p data-plan-option="${id}">${escapeHtml(text)}</p>`;
    }).join('') : '';
    return { fields, signatures, supportHint, supportOptions };
  }

  async render(type: TipoPlano, content: ConteudoPlano, bimestre: string, ano: number) {
    const template = await this.template(type);
    const title = type === 'pei' ? 'PLANO EDUCACIONAL INDIVIDUALIZADO – PEI' : 'PLANO DE ATENDIMENTO EDUCACIONAL ESPECIALIZADO / PAEE';
    const subtitle = type === 'pei' ? '<p style="text-align: center; font-size: 14pt"><strong>Registro de Adaptação/Flexibilidade Curricular</strong></p>' : '';
    const p = content.perfil;
    const profile = type === 'paee'
      ? `<h2>I - Informações do estudante</h2><h3>1- Dados pessoais e escolares</h3><p>a) Identificação do estudante</p>${this.line('Nome Completo', p.nome)}${this.line('Data de Nascimento', p.nascimento)}${this.line('Sexo', p.genero)}<p>b) Escolaridade</p>${this.line('Escola', p.escola)}${this.line('Turno', p.turno)}${this.line('Turma', p.turma)}${this.line('Ano/Série', p.serie)}<p>c) Estudante elegível aos serviços da Educação Especial</p>${this.line('Deficiência / diagnóstico', p.diagnostico)}`
      : `${this.line('Nome do Estudante', p.nome)}<p>Nome do Professor Regente: __________________________________</p><p>Nome do Professor Especializado da Educação Especial: __________________________________</p>${this.line('Turma / Ano/Série', [p.turma, p.serie].filter(Boolean).join(' / '))}${this.line('Deficiência / diagnóstico', p.diagnostico)}`;
    const letterhead = `<div data-plan-letterhead="true"><table><tbody><tr><td><img src="data:image/jpeg;base64,${await this.crest}" width="85" height="81" alt="Brasão do Estado de São Paulo"></td><td>${['GOVERNO DO ESTADO DE SÃO PAULO', 'SECRETARIA DE ESTADO DA EDUCAÇÃO', 'UNIDADE REGIONAL DE ENSINO DE ITU', `EE ${p.escola || '______________________________________'}`].map(text => `<p style="text-align: center"><strong>${escapeHtml(text)}</strong></p>`).join('')}</td></tr></tbody></table></div>`;
    const header = `<div data-plan-fixed="header">${letterhead}<div data-plan-title="true"><h1 style="text-align: center; font-size: 14pt">${title}</h1>${subtitle}<p style="text-align: center; font-size: 14pt"><strong>Anexo ${type === 'pei' ? 'IV' : 'III'} da Resolução SEDUC nº 129/2025</strong></p></div><p data-plan-period="true"><strong>Período: ${escapeHtml(bimestre)}º Bimestre · Ano letivo: ${ano}</strong></p>${profile}${this.line('Preferências', p.preferencias)}${this.line('Interesses', p.interesses)}</div>`;
    const fields = [...template.fields, ...(content.fields.importado ? [{ id: 'importado', label: 'Conteúdo importado — revise e distribua nas seções do modelo', required: false }] : [])];
    const selected = (content.selectedSupports ?? []).filter(id => template.supportOptions.includes(id));
    const supportHint = parse(template.supportHint);
    for (const option of supportHint.querySelectorAll('[data-plan-option]')) {
      if (selected.includes(option.getAttribute('data-plan-option')!)) option.set_content(option.innerHTML.replace(/^\(\s*\)/, '(X)'));
    }
    const body = fields.map(field => `<div data-plan-field="${field.id}"${field.id === 'apoiosServicos' ? ` data-plan-selected="${selected.join(',')}"` : ''}><h3>${escapeHtml(field.label)}${field.required ? ' *' : ''}</h3>${field.id === 'apoiosServicos' ? `<div data-plan-hint="true">${supportHint.toString()}</div>` : ''}<div data-plan-content="true">${content.fields[field.id] || '<p></p>'}</div></div>`).join('');
    const footer = `<div data-plan-fixed="footer">${type === 'paee' ? '<h2 style="text-align: center">Assinaturas:</h2>' : ''}${template.signatures.map(text => `<div data-plan-signature="true"><p style="text-align: center">________________________________________________</p><p style="text-align: center">${escapeHtml(text)}</p></div>`).join('')}</div>`;
    return { htmlContent: header + body + footer, fields };
  }

  private line(label: string, value: string) {
    return `<p><strong>${label}:</strong> ${escapeHtml(value || 'Não informado').replace(/\n/g, '<br>')}</p>`;
  }

  async extractFields(type: TipoPlano, html: string, finalizing = false): Promise<Record<string, string>> {
    if (typeof html !== 'string' || html.length > 20 * 1024 * 1024) throw new PlanoError(400, 'Conteúdo inválido ou maior que 20 MB.');
    const template = await this.template(type);
    const allowed = new Set([...template.fields.map(field => field.id), 'importado']);
    const fields: Record<string, string> = {};
    const document = parse(sanitizeDocument(html));
    const outside = document.childNodes.filter(node => {
      const element = node as { getAttribute?: (name: string) => string | undefined };
      return node.textContent.trim() && !element.getAttribute?.('data-plan-field') && !element.getAttribute?.('data-plan-fixed');
    });
    if (outside.length) throw new PlanoError(422, 'Digite as respostas dentro dos campos do modelo. Há texto fora dos campos que precisa ser movido antes de salvar.');
    for (const element of document.querySelectorAll('[data-plan-field]')) {
      const id = element.getAttribute('data-plan-field') ?? '';
      if (!allowed.has(id) || id in fields) throw new PlanoError(400, 'O documento contém campos desconhecidos ou duplicados.');
      if (element.querySelector('[data-plan-field]')) throw new PlanoError(400, 'Campos do plano não podem ser aninhados.');
      const content = element.querySelector('[data-plan-content]');
      if (!content) throw new PlanoError(400, 'Estrutura do campo inválida.');
      fields[id] = sanitizeDocument(content.innerHTML);
    }
    if (finalizing) {
      const selected = await this.extractSelectedSupports(type, html);
      const missing = template.fields.filter(field => field.required && !(field.id === 'apoiosServicos' && selected.length) && !parse(fields[field.id] || '').textContent.replace(/[_\s\u00a0]/g, ''));
      if (missing.length) throw new PlanoError(422, `Preencha os campos obrigatórios antes de finalizar: ${missing.map(field => field.label).join('; ')}`);
    }
    for (const field of template.fields) fields[field.id] ??= '<p></p>';
    return fields;
  }

  async extractSelectedSupports(type: TipoPlano, html: string): Promise<string[]> {
    if (type !== 'paee') return [];
    const value = parse(sanitizeDocument(html)).querySelector('[data-plan-field="apoiosServicos"]')?.getAttribute('data-plan-selected') ?? '';
    const selected = value ? value.split(',') : [];
    const { supportOptions } = await this.template(type);
    if (selected.some(id => !supportOptions.includes(id)) || new Set(selected).size !== selected.length) {
      throw new PlanoError(400, 'O documento contém opções de apoio inválidas ou duplicadas.');
    }
    return selected;
  }

  async importFields(type: TipoPlano, html: string) {
    if (parse(html).querySelector('[data-plan-field]')) return this.extractFields(type, html);
    const { fields: schema } = await this.template(type);
    const fields: Record<string, string> = {};
    let current: string | null = null;
    for (const block of parse(html).childNodes) {
      const text = block.textContent.trim();
      const field = schema.find(field => text.startsWith(field.label.replace(/\s*\*$/, '')));
      if (field) {
        current = field.id;
        fields[current] = '';
        if (current === 'componenteCurricular') fields[current] = `<p>${escapeHtml(text.slice(field.label.length).replace(/_/g, '').trim())}</p>`;
      } else if (current && !/^(Nome.*Assinatura|Assinatura dos Professores|Assinaturas:|CIÊNCIA)/i.test(text)) {
        if ((text || block.toString().includes('<img')) && !/^[_\s]+$/.test(text) && !text.startsWith('Assinalar:') && !/^\(\s*\)\s*1/.test(text)) fields[current] += block.toString();
      } else { current = null; }
    }
    if (!Object.keys(fields).length) fields.importado = html;
    else {
      const captured = Object.values(fields).join('');
      const otherImages = parse(html).querySelectorAll('img').filter(image => !captured.includes(image.toString()));
      if (otherImages.length) fields.importado = otherImages.map(image => `<p>${image.toString()}</p>`).join('');
    }
    return fields;
  }

}

export function perfilAluno(aluno: Record<string, any>): PerfilPlano {
  let diagnoses = aluno.diagnostico || '';
  try {
    const parsed = typeof diagnoses === 'string' ? JSON.parse(diagnoses) : diagnoses;
    if (Array.isArray(parsed)) diagnoses = parsed.map(d => [d.diagnostico || d['diagnóstico'], d.descricao].filter(Boolean).join(': ')).join('; ');
  } catch { /* Diagnóstico legado em texto livre. */ }
  let interests = aluno.interesses || '';
  try { const parsed = JSON.parse(interests); if (Array.isArray(parsed)) interests = parsed.join(', '); } catch { /* Texto livre. */ }
  const turma = aluno.turma ?? {};
  const escola = turma.escola ?? {};
  const birth = aluno.data_de_nascimento;
  return {
    nome: aluno.nome_completo || '', nascimento: birth ? String(birth).split('T')[0].split('-').reverse().join('/') : '',
    genero: aluno.genero || '', escola: escola.nome || escola.nome_escola || escola.nome_da_escola || '', turno: turma.periodo || '',
    turma: turma.nome || '', serie: turma.serie || aluno.serie || '', diagnostico: String(diagnoses),
    preferencias: aluno.preferencias || '', interesses: String(interests),
  };
}
