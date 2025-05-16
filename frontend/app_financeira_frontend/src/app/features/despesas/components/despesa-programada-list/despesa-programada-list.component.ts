import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { DespesaProgramada, DespesaProgramadaService } from "../../services/despesa-programada.service";

import { FormsModule } from "@angular/forms"; // Import FormsModule

@Component({
  selector: "app-despesa-programada-list",
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule], // Add FormsModule here
  templateUrl: "./despesa-programada-list.component.html",
  styleUrl: "./despesa-programada-list.component.css",
})
export class DespesaProgramadaListComponent implements OnInit {
  private despesaService = inject(DespesaProgramadaService);

  // Signals from service
  despesasProgramadas = this.despesaService.despesasProgramadas;
  isLoading = this.despesaService.isLoading;
  error = this.despesaService.error;

  // Filtros locais
  filtroMes = signal<number | undefined>(undefined);
  filtroAno = signal<number | undefined>(new Date().getFullYear());
  filtroPago = signal<boolean | undefined>(undefined);

  anosDisponiveis = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear -1, currentYear, currentYear + 1]; // Exemplo simples
  });

  constructor() {}

  ngOnInit(): void {
    this.loadDespesas();
  }

  loadDespesas(): void {
    const filtros = {
      mes: this.filtroMes(),
      ano: this.filtroAno(),
      pago: this.filtroPago(),
    };
    // Remove undefined filters before sending
    const activeFilters = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v !== undefined));
    this.despesaService.getDespesasProgramadas(activeFilters).subscribe();
  }

  onFiltroChange(): void {
    this.loadDespesas();
  }

  confirmarDelecao(id?: string): void {
    if (!id) return;
    if (confirm("Tem certeza que deseja excluir esta despesa programada?")) {
      this.despesaService.deleteDespesaProgramada(id).subscribe({
        next: () => console.log("Despesa deletada com sucesso"),
        error: (err: any) => console.error("Erro ao deletar despesa", err),
      });
    }
  }

  marcarComoPaga(despesa: DespesaProgramada): void {
    if (!despesa._id) return;
    this.despesaService.updateDespesaProgramada(despesa._id, { pago: true }).subscribe({
        next: () => console.log("Despesa marcada como paga"),
        error: (err: any) => console.error("Erro ao marcar como paga", err)
    });
  }

  marcarComoNaoPaga(despesa: DespesaProgramada): void {
    if (!despesa._id) return;
    this.despesaService.updateDespesaProgramada(despesa._id, { pago: false }).subscribe({
        next: () => console.log("Despesa marcada como não paga"),
        error: (err: any) => console.error("Erro ao marcar como não paga", err)
    });
  }
}

