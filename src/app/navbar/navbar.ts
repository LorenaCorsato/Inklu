import { Component, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideArrowLeftFromLine, LucideHome, LucideCalendarCheck, LucideUser, LucideCalendar, LucideFileText, LucideSettings, LucidePlus, LucideFolder, LucideBookOpen } from '@lucide/angular';
import {
  DocumentoFile,
  ModalDocumento,
} from '../alunos/detalhe-aluno/modal-documento/modal-documento';
import { DocumentosService } from '../services/documentos.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideArrowLeftFromLine, LucideHome, LucideCalendarCheck, LucideUser, LucideCalendar, LucideFileText, LucideSettings, LucidePlus, LucideFolder, LucideBookOpen, ModalDocumento],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly documentos = inject(DocumentosService);

  isCollapsed: boolean = false;
  isDocumentoModalOpen = false;

  /** Pastas oferecidas no modal de "Adicionar Documento" da navbar. */
  readonly folderOptions = this.documentos.folderOptions;

  @HostBinding('class.collapsed') get collapsed() {
    return this.isCollapsed;
  }

  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
  }

  openDocumentoModal() {
    this.isDocumentoModalOpen = true;
  }

  closeDocumentoModal() {
    this.isDocumentoModalOpen = false;
  }

  onDocumentoFilesAdded(files: DocumentoFile[]) {
    this.documentos.addFiles(files, files[0]?.folderId ?? null);
  }
}