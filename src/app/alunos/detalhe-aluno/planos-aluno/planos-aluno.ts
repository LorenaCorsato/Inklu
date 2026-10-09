import { Component, OnChanges, Input, inject, signal, computed, linkedSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlanoService } from '../../../documentos/editor/services/plano.service';
import { PlanoSummary, TipoPlano } from '../../../documentos/editor/models/plano.model';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideEdit,
  LucideEye,
  LucideFunnel,
  LucidePlus,
  LucideRotateCcw,
  LucideX,
} from '@lucide/angular';


@Component({
  selector: 'app-planos-aluno',
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    LucideFunnel,
    LucidePlus,
    LucideEdit,
    LucideEye,
    LucideRotateCcw,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './planos-aluno.html', styleUrl: './planos-aluno.scss',
})
export class PlanosAluno implements OnChanges {
  @Input({ required: true }) alunoId!: string;
  private readonly service = inject(PlanoService);
  readonly plans = signal<PlanoSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showHistory = signal(false);
  readonly searchFilter = signal('');
  readonly typeFilter = signal<TipoPlano | ''>('');
  readonly bimestreFilter = signal('');
  readonly yearFilter = signal('');
  readonly years = computed(() => [...new Set(this.plans().map(plan => plan.anoLetivo))].sort((a, b) => b - a));
  readonly hasFilters = computed(() => !!(this.searchFilter().trim() || this.typeFilter() || this.bimestreFilter() || this.yearFilter()));
  readonly visiblePlans = computed(() => {
    const search = this.searchFilter().trim().toLocaleLowerCase();
    const plans = this.plans();
    const latestVersions = new Map<string, PlanoSummary>();
    for (const plan of plans) {
      const key = `${plan.type}:${plan.rootId}`;
      const current = latestVersions.get(key);
      if (!current || (plan.versionNumber ?? 0) > (current.versionNumber ?? 0)) latestVersions.set(key, plan);
    }
    const visible = this.showHistory() ? plans : plans.filter(plan => latestVersions.get(`${plan.type}:${plan.rootId}`) === plan);
    return visible.filter(plan => (!this.typeFilter() || plan.type === this.typeFilter())
      && (!this.bimestreFilter() || plan.bimestre === this.bimestreFilter())
      && (!this.yearFilter() || String(plan.anoLetivo) === this.yearFilter())
      && (!search || plan.name.toLocaleLowerCase().includes(search)));
  });
  readonly pageSize = 10;
  readonly currentPage = linkedSignal({ source: this.visiblePlans, computation: () => 1 });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.visiblePlans().length / this.pageSize)));
  readonly pageStart = computed(() => (this.currentPage() - 1) * this.pageSize);
  readonly paginatedPlans = computed(() => this.visiblePlans().slice(this.pageStart(), this.pageStart() + this.pageSize));
  readonly pageEnd = computed(() => this.pageStart() + this.paginatedPlans().length);

  changePage(page: number) {
    this.currentPage.set(Math.min(this.pageCount(), Math.max(1, page)));
  }

  ngOnChanges() { this.clearFilters(); this.showHistory.set(false); void this.load(); }
  clearFilters() {
    this.searchFilter.set(''); this.typeFilter.set(''); this.bimestreFilter.set(''); this.yearFilter.set('');
  }
  async load() {
    const id = this.alunoId;
    this.loading.set(true); this.error.set('');
    try { const plans = await this.service.list(id); if (id === this.alunoId) this.plans.set(plans); }
    catch { this.error.set('Não foi possível carregar os planos.'); }
    finally { this.loading.set(false); }
  }
}
