import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { DespesaRecorrente, DespesaRecorrenteService } from "../../services/despesa-recorrente.service";

import { FormsModule } from "@angular/forms"; // Import FormsModule

@Component({
  selector: "app-despesa-recorrente-list",
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule], // Add FormsModule here
  templateUrl: "./despesa-recorrente-list.component.html",
  styleUrl: "./despesa-recorrente-list.component.css",
})
export class DespesaRecorrenteListComponent implements OnInit {
  private despesaService = inject(DespesaRecorrenteService);

  despesasRecorrentes = this.despesaService.despesasRecorrentes;
  isLoading = this.despesaService.isLoading;
  error = this.despesaService.error;

  filtroAtiva = signal<boolean | undefined>(true); // Por padrão, mostrar apenas ativas

  constructor() {}

  ngOnInit(): void {
    this.loadDespesas();
  }

  loadDespesas(): void {
    const filtros = { ativa: this.filtroAtiva() };
    const activeFilters = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== undefined));
    this.despesaService.getDespesasRecorrentes(activeFilters).subscribe();
  }

  onFiltroChange(): void {
    this.loadDespesas();
  }

  confirmarDelecao(id?: string): void {
    if (!id) return;
    if (confirm("Tem certeza que deseja excluir esta despesa recorrente?")) {
      this.despesaService.deleteDespesaRecorrente(id).subscribe({
        next: () => console.log("Despesa recorrente deletada com sucesso"),
        error: (err: any) => console.error("Erro ao deletar despesa recorrente", err),
      });
    }
  }

  toggleAtiva(despesa: DespesaRecorrente): void {
    if (!despesa._id) return;
    this.despesaService.updateDespesaRecorrente(despesa._id, { ativa: !despesa.ativa }).subscribe({
        next: () => console.log(`Despesa recorrente ${despesa.ativa ? 'desativada' : 'ativada'}`),
        error: (err: any) => console.error("Erro ao alterar status da despesa recorrente", err)
    });
  }
}

