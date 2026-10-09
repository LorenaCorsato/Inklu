'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">inklu documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search">
    <input type="text" placeholder="Type to search">
    <button type="button"
        class="search-input-clear"
        aria-label="Clear search"
        data-search-input-clear>&times;</button>
</div>
` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="architecture.html" data-type="chapter-link">
                                        <span class="icon ion-ios-git-branch"></span>Architecture
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/TemplatePlaygroundModule.html" data-type="entity-link" >TemplatePlaygroundModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' : 'data-bs-target="#xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' :
                                        'id="xs-injectables-links-module-TemplatePlaygroundModule-a48e698b66bad8be9ff3b78b5db8e15ee6bb54bd2575fdb1bb61a34e76437cc54b2e161854c3d6c97b4c751d05ff3a43b70b87ceffd46d3c5bf53f6f161e3044"' }>
                                        <li class="link">
                                            <a href="injectables/HbsRenderService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HbsRenderService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemplateEditorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemplateEditorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ZipExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ZipExportService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AdicionarAluno.html" data-type="entity-link" >AdicionarAluno</a>
                            </li>
                            <li class="link">
                                <a href="components/Alunos.html" data-type="entity-link" >Alunos</a>
                            </li>
                            <li class="link">
                                <a href="components/App.html" data-type="entity-link" >App</a>
                            </li>
                            <li class="link">
                                <a href="components/Calendario.html" data-type="entity-link" >Calendario</a>
                            </li>
                            <li class="link">
                                <a href="components/CardAluno.html" data-type="entity-link" >CardAluno</a>
                            </li>
                            <li class="link">
                                <a href="components/Configuracoes.html" data-type="entity-link" >Configuracoes</a>
                            </li>
                            <li class="link">
                                <a href="components/DetalheAluno.html" data-type="entity-link" >DetalheAluno</a>
                            </li>
                            <li class="link">
                                <a href="components/Documentos.html" data-type="entity-link" >Documentos</a>
                            </li>
                            <li class="link">
                                <a href="components/EditarAluno.html" data-type="entity-link" >EditarAluno</a>
                            </li>
                            <li class="link">
                                <a href="components/Home.html" data-type="entity-link" >Home</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalAluno.html" data-type="entity-link" >ModalAluno</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalConfirmacao.html" data-type="entity-link" >ModalConfirmacao</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalConfirmarExclusao.html" data-type="entity-link" >ModalConfirmarExclusao</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalCrop.html" data-type="entity-link" >ModalCrop</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalDadosAdicionais.html" data-type="entity-link" >ModalDadosAdicionais</a>
                            </li>
                            <li class="link">
                                <a href="components/ModalDocumento.html" data-type="entity-link" >ModalDocumento</a>
                            </li>
                            <li class="link">
                                <a href="components/Navbar.html" data-type="entity-link" >Navbar</a>
                            </li>
                            <li class="link">
                                <a href="components/Tarefas.html" data-type="entity-link" >Tarefas</a>
                            </li>
                            <li class="link">
                                <a href="components/Toast.html" data-type="entity-link" >Toast</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AlunoController.html" data-type="entity-link" >AlunoController</a>
                            </li>
                            <li class="link">
                                <a href="classes/ArquivoController.html" data-type="entity-link" >ArquivoController</a>
                            </li>
                            <li class="link">
                                <a href="classes/TurmaController.html" data-type="entity-link" >TurmaController</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AlunoService.html" data-type="entity-link" >AlunoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HbsRenderService.html" data-type="entity-link" >HbsRenderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemplateEditorService.html" data-type="entity-link" >TemplateEditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThemeService.html" data-type="entity-link" >ThemeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TurmaService.html" data-type="entity-link" >TurmaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ZipExportService.html" data-type="entity-link" >ZipExportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Aluno.html" data-type="entity-link" >Aluno</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Aluno-1.html" data-type="entity-link" >Aluno</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlunoForm.html" data-type="entity-link" >AlunoForm</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlunoForm-1.html" data-type="entity-link" >AlunoForm</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlunoForm-2.html" data-type="entity-link" >AlunoForm</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Arquivo.html" data-type="entity-link" >Arquivo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ArquivoPayload.html" data-type="entity-link" >ArquivoPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompoDocConfig.html" data-type="entity-link" >CompoDocConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DadosAdicionais.html" data-type="entity-link" >DadosAdicionais</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DiagnosticoAluno.html" data-type="entity-link" >DiagnosticoAluno</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DiagnosticoItem.html" data-type="entity-link" >DiagnosticoItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DiagnosticoItem-1.html" data-type="entity-link" >DiagnosticoItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocumentCard.html" data-type="entity-link" >DocumentCard</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocumentoFile.html" data-type="entity-link" >DocumentoFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricCard.html" data-type="entity-link" >MetricCard</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResponsavelItem.html" data-type="entity-link" >ResponsavelItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResponsavelItem-1.html" data-type="entity-link" >ResponsavelItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SettingsMenuItem.html" data-type="entity-link" >SettingsMenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskCard.html" data-type="entity-link" >TaskCard</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Template.html" data-type="entity-link" >Template</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Turma.html" data-type="entity-link" >Turma</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
