import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { PlanField, PlanFixed } from './plan-nodes';
import { PlanoService } from './services/plano.service';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { DocumentoEditor } from './documento-editor';
import { EditorStateService } from './services/editor-state.service';
import { EditablePlano, PlanoSummary } from './models/plano.model';
import { PlanosAluno } from '../../alunos/detalhe-aluno/planos-aluno/planos-aluno';

const planoExample: EditablePlano = {
  id: 'versao-atual', type: 'pei', alunoId: 'aluno-a', bimestre: '1', anoLetivo: 2026,
  name: 'PEI do aluno', status: 'rascunho', rootId: 'raiz', parentId: null,
  originalFormat: 'docx', warnings: [], fields: [{ id: 'estrategias', label: 'Estratégias', required: true }],
  htmlContent: '<div data-plan-fixed="header"><h1>PEI</h1><p data-plan-period="true"><strong>Período: 1º Bimestre · Ano letivo: 2026</strong></p><p>Perfil salvo do aluno</p></div><div data-plan-field="estrategias"><h3>Estratégias</h3><div data-plan-content="true"><p>Resposta</p></div></div><div data-plan-fixed="footer"><p>Assinatura</p></div>',
};

async function setupEditor(id = 'novo') {
  const loaded = { ...planoExample, id };
  const service = {
    template: vi.fn().mockResolvedValue(loaded), get: vi.fn().mockResolvedValue(loaded),
    save: vi.fn().mockResolvedValue(planoExample), download: vi.fn().mockResolvedValue(undefined),
  };
  TestBed.configureTestingModule({
    imports: [DocumentoEditor],
    providers: [provideHttpClient(), provideRouter([]),
      { provide: PlanoService, useValue: service },
      { provide: ActivatedRoute, useValue: { snapshot: {
        paramMap: convertToParamMap({ id, alunoId: 'aluno-a', tipo: 'pei' }), queryParamMap: convertToParamMap({}),
      } } },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(DocumentoEditor);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, state: TestBed.inject(EditorStateService), service, navigate };
}

describe('Planos educacionais', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

  it('salva, volta para o aluno correto e não marca alterações ao reativar o editor', async () => {
    const { component, state, service, navigate } = await setupEditor();
    component.onNameChange('PEI atualizado');
    expect(state.hasUnsavedChanges()).toBe(true);
    expect(await component.save()).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(service.save).toHaveBeenCalledWith('aluno-a', 'pei', expect.objectContaining({ name: 'PEI atualizado', saveMode: 'version' }));
    expect(navigate).toHaveBeenCalledWith(['/alunos', 'aluno-a'], { replaceUrl: true });
    expect(state.hasUnsavedChanges()).toBe(false);
    expect(component.canDeactivate()).toBe(true);
    expect(component.exitDialogOpen()).toBe(false);
    expect(component['editor']?.isEditable).toBe(true);
  });

  for (const mode of ['overwrite', 'version'] as const) {
    it(`altera bimestre e ano de um plano salvo usando ${mode} e preserva respostas e perfil`, async () => {
      const { fixture, component, state, service, navigate } = await setupEditor('versao-atual');
      const bimestre = fixture.nativeElement.querySelector('.plan-controls select') as HTMLSelectElement;
      const ano = fixture.nativeElement.querySelector('.plan-controls input[type="number"]') as HTMLInputElement;
      expect(bimestre.disabled).toBe(false);
      expect(ano.disabled).toBe(false);
      bimestre.value = '3';
      bimestre.dispatchEvent(new Event('change'));
      ano.value = '2027';
      ano.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.bimestre()).toBe('3');
      expect(component.anoLetivo()).toBe(2027);
      expect(state.hasUnsavedChanges()).toBe(true);
      const html = component['editor']!.getHTML();
      expect(html).toContain('Período: 3º Bimestre · Ano letivo: 2027');
      expect(html).toContain('Perfil salvo do aluno');
      expect(html).toContain('<p>Resposta</p>');
      expect(service.template).not.toHaveBeenCalled();
      expect(component.canExport()).toBe(false);
      service.save.mockResolvedValue({ ...planoExample, bimestre: '3', anoLetivo: 2027, htmlContent: html });
      const saving = component.save();
      component.onSaveModeChoice(mode);
      expect(await saving).toBe(true);
      expect(service.save).toHaveBeenCalledWith('aluno-a', 'pei', expect.objectContaining({ bimestre: '3', anoLetivo: 2027, baseVersionId: 'versao-atual', saveMode: mode, htmlContent: html }));
      expect(state.hasUnsavedChanges()).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/alunos', 'aluno-a'], { replaceUrl: true });
    });

    it(`oferece sobrescrever ou criar versão e envia a escolha ${mode}`, async () => {
      const { fixture, component, state, service, navigate } = await setupEditor('versao-atual');
      component.onNameChange('Nome editado');
      const saving = component.save();
      fixture.detectChanges();
      const dialog = fixture.nativeElement.querySelector('[aria-labelledby="salvar-plano-title"]') as HTMLElement;
      expect(dialog.textContent).toContain('Sobrescrever documento atual');
      expect(dialog.textContent).toContain('Criar nova versão');
      expect(service.save).not.toHaveBeenCalled();
      component.onSaveModeChoice(mode);
      expect(await saving).toBe(true);
      expect(service.save).toHaveBeenCalledWith('aluno-a', 'pei', expect.objectContaining({ baseVersionId: 'versao-atual', saveMode: mode }));
      expect(state.hasUnsavedChanges()).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/alunos', 'aluno-a'], { replaceUrl: true });
    });
  }

  it('cancelar a escolha mantém as alterações sem salvar nem navegar', async () => {
    const { component, state, service, navigate } = await setupEditor('versao-atual');
    component.onNameChange('Nome editado');
    const saving = component.save();
    component.onSaveModeChoice(null);
    expect(await saving).toBe(false);
    expect(state.hasUnsavedChanges()).toBe(true);
    expect(service.save).not.toHaveBeenCalled(); expect(navigate).not.toHaveBeenCalled();
  });

  it('documento já salvo sem novas alterações fecha sem criar outra versão', async () => {
    const { component, service, navigate } = await setupEditor('versao-atual');
    expect(await component.save()).toBe(true);
    expect(service.save).not.toHaveBeenCalled();
    expect(component.saveDialogOpen()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/alunos', 'aluno-a'], { replaceUrl: true });
  });

  it('falha da API preserva o texto e mantém o editor aberto', async () => {
    const { component, state, service, navigate } = await setupEditor();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service.save.mockRejectedValue({ error: { erro: 'Falha ao gravar' } });
    component.onNameChange('Nome editado');
    const before = component['editor']!.getHTML();
    expect(await component.save()).toBe(false);
    expect(component.errorMessage()).toBe('Falha ao gravar');
    expect(state.hasUnsavedChanges()).toBe(true);
    expect(component['editor']!.getHTML()).toBe(before);
    expect(component['editor']?.isEditable).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('salvar pelo aviso de saída conclui o guard sem abrir outra navegação', async () => {
    const { component, state, navigate } = await setupEditor('versao-atual');
    component.onNameChange('Nome editado');
    const leaving = component.canDeactivate();
    expect(component.exitDialogOpen()).toBe(true);
    const saving = component.onExitSave();
    expect(component.exitDialogOpen()).toBe(false);
    expect(component.saveDialogOpen()).toBe(true);
    component.onSaveModeChoice('version');
    await saving;
    expect(await leaving).toBe(true);
    expect(state.hasUnsavedChanges()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('paginação visual não suja o documento e rascunhos salvos podem ser exportados', async () => {
    const { fixture, component, state, service } = await setupEditor('versao-atual');
    const signatures = fixture.nativeElement.querySelector('[data-plan-fixed="footer"]') as HTMLElement;
    signatures.style.paddingTop = '200px';
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(state.hasUnsavedChanges()).toBe(false);
    expect(component.canExport()).toBe(true);
    const exportButtons = Array.from(fixture.nativeElement.querySelectorAll('.plan-export-actions button')) as HTMLButtonElement[];
    expect(exportButtons.map(button => button.textContent?.trim())).toEqual(['Exportar PDF', 'Exportar Word (DOCX)']);
    expect(fixture.nativeElement.textContent).not.toContain('Importar PDF/DOCX');
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    await component.exportPlano('pdf');
    expect(service.download).toHaveBeenCalledWith('aluno-a', 'pei', 'versao-atual', 'pdf', 'PEI do aluno - Versão 1');
    component.onNameChange('Alterado');
    expect(component.canExport()).toBe(false);
  });

  it('mantém somente visualizar e editar na listagem, com exportação dentro do editor', async () => {
    const plans: PlanoSummary[] = ['rascunho', 'finalizado'].map((status, index) => ({
      id: `versao-${index}`, type: 'pei', alunoId: 'aluno-a', bimestre: '1', anoLetivo: 2026,
      name: `Plano ${index}`, status: status as PlanoSummary['status'], rootId: `raiz-${index}`, parentId: null, createdAt: '2026-10-06T12:00:00Z',
    }));
    TestBed.configureTestingModule({ imports: [PlanosAluno], providers: [provideRouter([]),
      { provide: PlanoService, useValue: { list: vi.fn().mockResolvedValue(plans) } },
    ] });
    const fixture = TestBed.createComponent(PlanosAluno);
    fixture.componentRef.setInput('alunoId', 'aluno-a');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Exportar');
    expect(fixture.nativeElement.textContent.match(/Visualizar/g)).toHaveLength(2);
    expect(fixture.nativeElement.textContent.match(/Editar/g)).toHaveLength(2);
  });

  it('identifica as versões e mantém a mais recente ao sobrescrever uma versão antiga', async () => {
    const plans: PlanoSummary[] = [
      { ...planoExample, id: 'antiga', versionNumber: 1, createdAt: '2026-02-01T12:00:00Z', modifiedAt: '2026-10-06T12:00:00Z' },
      { ...planoExample, id: 'atual', versionNumber: 2, parentId: 'antiga', createdAt: '2026-06-01T12:00:00Z' },
    ];
    TestBed.configureTestingModule({ imports: [PlanosAluno], providers: [provideRouter([]),
      { provide: PlanoService, useValue: { list: vi.fn().mockResolvedValue(plans) } },
    ] });
    const fixture = TestBed.createComponent(PlanosAluno);
    fixture.componentRef.setInput('alunoId', 'aluno-a');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.visiblePlans().map(plan => plan.id)).toEqual(['atual']);
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Versão 2');
    fixture.componentInstance.showHistory.set(true);
    fixture.detectChanges();
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    expect(rows.map(row => row.textContent)).toEqual([
      expect.stringContaining('Versão 1'), expect.stringContaining('Versão 2'),
    ]);
    fixture.componentInstance.bimestreFilter.set('1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Versão 2');
  });

  it('combina filtros de tipo, bimestre e ano e permite limpar a busca', async () => {
    const plans: PlanoSummary[] = [
      { ...planoExample, id: 'pei-atual', rootId: 'pei-atual', name: 'PEI atual', bimestre: '2', anoLetivo: 2027, createdAt: '2027-06-01T12:00:00Z' },
      { ...planoExample, id: 'paee-atual', rootId: 'paee-atual', type: 'paee', name: 'PAEE atual', bimestre: '2', anoLetivo: 2027, createdAt: '2027-06-01T12:00:00Z' },
      { ...planoExample, id: 'paee-anterior', rootId: 'paee-anterior', type: 'paee', name: 'PAEE anterior', bimestre: '1', anoLetivo: 2026, createdAt: '2026-02-01T12:00:00Z' },
    ];
    TestBed.configureTestingModule({ imports: [PlanosAluno], providers: [provideRouter([]),
      { provide: PlanoService, useValue: { list: vi.fn().mockResolvedValue(plans) } },
    ] });
    const fixture = TestBed.createComponent(PlanosAluno);
    fixture.componentRef.setInput('alunoId', 'aluno-a');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const filters = Array.from(fixture.nativeElement.querySelectorAll('.plan-filters select')) as HTMLSelectElement[];
    const filter = async (index: number, value: string) => {
      filters[index].value = value;
      filters[index].dispatchEvent(new Event('change'));
      fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    };
    const ids = () => fixture.componentInstance.visiblePlans().map(plan => plan.id);
    expect(Array.from(filters[2].options).map(option => option.value)).toEqual(['', '2027', '2026']);
    await filter(0, 'paee');
    expect(ids()).toEqual(['paee-atual', 'paee-anterior']);
    await filter(1, '2');
    expect(ids()).toEqual(['paee-atual']);
    await filter(2, '2027');
    expect(ids()).toEqual(['paee-atual']);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('PAEE atual');
    await filter(2, '2026');
    expect(ids()).toEqual([]);
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Nenhum plano encontrado com os filtros selecionados.');
    (fixture.nativeElement.querySelector('.clear-filters') as HTMLButtonElement).click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(ids()).toEqual(['pei-atual', 'paee-atual', 'paee-anterior']);
    expect(filters.map(select => select.value)).toEqual(['', '', '']);
    expect(fixture.nativeElement.querySelector('.clear-filters')).toBeNull();

    const search = fixture.nativeElement.querySelector('#plans-search') as HTMLInputElement;
    search.value = 'anterior';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(ids()).toEqual(['paee-anterior']);
    expect(fixture.componentInstance.hasFilters()).toBe(true);
  });

  it('filtra versões antigas somente com histórico ativo e reinicia filtros ao trocar de aluno', async () => {
    const plans: PlanoSummary[] = [
      { ...planoExample, id: 'atual', name: 'Atual', bimestre: '2', anoLetivo: 2027, parentId: 'antiga', createdAt: '2027-06-01T12:00:00Z' },
      { ...planoExample, id: 'antiga', name: 'Antiga', bimestre: '1', anoLetivo: 2026, createdAt: '2026-02-01T12:00:00Z' },
    ];
    const list = vi.fn().mockResolvedValue(plans);
    TestBed.configureTestingModule({ imports: [PlanosAluno], providers: [provideRouter([]), { provide: PlanoService, useValue: { list } }] });
    const fixture = TestBed.createComponent(PlanosAluno);
    fixture.componentRef.setInput('alunoId', 'aluno-a');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const component = fixture.componentInstance;
    component.typeFilter.set('pei'); component.bimestreFilter.set('1'); component.yearFilter.set('2026');
    expect(component.visiblePlans()).toEqual([]);
    (fixture.nativeElement.querySelector('.history-toggle input') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(component.visiblePlans().map(plan => plan.id)).toEqual(['antiga']);
    component.clearFilters();
    expect(component.showHistory()).toBe(true);
    expect(component.visiblePlans()).toHaveLength(2);
    component.yearFilter.set('2026');
    list.mockResolvedValue([]);
    fixture.componentRef.setInput('alunoId', 'aluno-b');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(list).toHaveBeenLastCalledWith('aluno-b');
    expect(component.hasFilters()).toBe(false);
    expect(component.showHistory()).toBe(false);
    expect(component.years()).toEqual([]);
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Nenhum PEI ou PAEE registrado para este aluno.');
  });

  it('mantém a identificação em leitura e serializa a resposta sem duplicar a pergunta', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const editor = new Editor({
      element, extensions: [StarterKit, PlanFixed, PlanField],
      content: '<div data-plan-fixed="header"><div data-plan-letterhead="true"><p>GOVERNO DO ESTADO DE SÃO PAULO</p></div><div data-plan-title="true"><h1 style="text-align: center; font-size: 14pt">PEI</h1></div><p>Nome: Maria</p></div><div data-plan-field="estrategias"><h3>Estratégias *</h3><div data-plan-hint="true"><p>Orientação do modelo</p></div><div data-plan-content="true"><p>Jogos acessíveis</p></div></div><div data-plan-fixed="footer"><div data-plan-signature="true"><p style="text-align: center">Assinatura</p></div></div>',
    });
    try {
      expect(element.querySelector('[data-plan-fixed]')?.getAttribute('contenteditable')).toBe('false');
      expect(element.querySelector('[data-plan-field] > h3')?.getAttribute('contenteditable')).toBe('false');
      expect(element.querySelector('[data-plan-content]')?.textContent).toBe('Jogos acessíveis');
      const html = editor.getHTML();
      expect((html.match(/data-plan-field="estrategias"/g) || []).length).toBe(1);
      expect(html).toContain('data-plan-content="true"');
      expect(html).toContain('Orientação do modelo');
      expect(html).toContain('Jogos acessíveis');
      expect(html).toContain('data-plan-letterhead="true"');
      expect(html).toContain('data-plan-title="true"');
      expect(html).toContain('data-plan-signature="true"');
      expect(element.querySelector('[data-plan-fixed="footer"]')?.getAttribute('contenteditable')).toBe('false');
      editor.setEditable(false);
      expect(editor.isEditable).toBe(false);
    } finally { editor.destroy(); element.remove(); }
  });

  it('permite marcar apoios, desfazer, reabrir e bloqueia escolhas em modo leitura', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const changed = vi.fn();
    const editor = new Editor({
      element, extensions: [StarterKit, PlanField], onUpdate: changed,
      editorProps: { handleScrollToSelection: () => true }, // O ambiente DOM do teste não calcula a posição visual da seleção.
      content: '<div data-plan-field="apoiosServicos" data-plan-selected=""><h3>Apoios *</h3><div data-plan-hint="true"><p>Escolha os serviços</p><p data-plan-option="servico-1">( ) Recursos Pedagógicos</p><p data-plan-option="servico-2">( ) Libras</p></div><div data-plan-content="true"><p>Observação existente</p></div></div>',
    });
    const checkbox = (id: string) => element.querySelector<HTMLInputElement>(`input[data-plan-checkbox="${id}"]`)!;
    try {
      expect(element.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
      checkbox('servico-1').focus();
      checkbox('servico-1').click();
      expect(changed).toHaveBeenCalled();
      expect(checkbox('servico-1').checked).toBe(true);
      expect(document.activeElement).toBe(checkbox('servico-1'));
      expect(editor.getHTML()).toContain('data-plan-selected="servico-1"');
      expect(editor.getHTML()).toContain('(X) Recursos Pedagógicos');
      expect(editor.getHTML()).not.toContain('<input');
      expect(editor.commands.undo()).toBe(true);
      expect(checkbox('servico-1').checked).toBe(false);
      expect(editor.commands.redo()).toBe(true);
      expect(checkbox('servico-1').checked).toBe(true);
      checkbox('servico-2').click();
      const savedHtml = editor.getHTML();
      editor.commands.setContent(savedHtml);
      expect(checkbox('servico-1').checked).toBe(true);
      expect(checkbox('servico-2').checked).toBe(true);
      expect(element.querySelector('[data-plan-content]')?.textContent).toBe('Observação existente');
      checkbox('servico-1').click();
      expect(editor.getHTML()).toContain('data-plan-selected="servico-2"');
      expect(editor.getHTML()).toContain('( ) Recursos Pedagógicos');
      editor.setEditable(false);
      expect(checkbox('servico-2').disabled).toBe(true);
      checkbox('servico-2').click();
      expect(checkbox('servico-2').checked).toBe(true);
    } finally { editor.destroy(); element.remove(); }
  });

  it('propaga falha ao salvar e envia a versão base e o aluno corretos', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(PlanoService);
    const http = TestBed.inject(HttpTestingController);
    const promise = service.save('aluno-a', 'paee', {
      name: 'PAEE', bimestre: '2', anoLetivo: 2026, status: 'rascunho',
      htmlContent: '<p>Resposta</p>', baseVersionId: 'versao-anterior', originalFormat: 'docx',
    });
    const failed = expect(promise).rejects.toMatchObject({ status: 500 });
    const request = http.expectOne('http://localhost:3000/api/alunos/aluno-a/planos/paee');
    expect(request.request.body.baseVersionId).toBe('versao-anterior');
    expect(request.request.body.status).toBe('rascunho');
    request.flush({ erro: 'Falha no banco' }, { status: 500, statusText: 'Server Error' });
    await failed; http.verify();
  });

  it('busca o histórico exclusivamente pelo aluno e recebe o arquivo exportado como blob', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(PlanoService); const http = TestBed.inject(HttpTestingController);
    const list = service.list('aluno-a');
    http.expectOne('http://localhost:3000/api/alunos/aluno-a/planos').flush([]);
    expect(await list).toEqual([]);
    const download = service.export('aluno-a', 'pei', 'versao', 'pdf');
    const request = http.expectOne('http://localhost:3000/api/alunos/aluno-a/planos/pei/versao/exportar');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual({ format: 'pdf' });
    const pdf = new Blob(['%PDF-'], { type: 'application/pdf' }); request.flush(pdf);
    expect(await download).toBe(pdf); http.verify();
  });
});
