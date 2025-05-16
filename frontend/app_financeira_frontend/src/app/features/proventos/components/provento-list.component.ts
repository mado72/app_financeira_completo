import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { ProventoService, Provento } from "../services/provento.service";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-provento-list",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: "./provento-list.component.html",
  styleUrls: ["./provento-list.component.css"],
})
export class ProventoListComponent implements OnInit {
  private proventoService = inject(ProventoService);
  private router = inject(Router);

  proventos = this.proventoService.proventos;
  isLoading = this.proventoService.isLoading;
  error = this.proventoService.error;

  // Filtros
  filtroTicker = signal<string>("");
  filtroTipoProvento = signal<string>("");
  filtroAnoPagamento = signal<number | undefined>(new Date().getFullYear());

  tiposDeProvento = signal<string[]>(["DIVIDENDO", "JCP", "ALUGUEL_FII", "RENDIMENTO_RF", "OUTRO"]);
  anosDisponiveis = computed(() => {
    const currentYear = new Date().getFullYear();
    // Poderia ser mais dinâmico baseado nos dados de proventos
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  });

  proventosFiltrados = computed(() => {
    const ticker = this.filtroTicker().toLowerCase();
    const tipo = this.filtroTipoProvento();
    const ano = this.filtroAnoPagamento();
    let dados = this.proventos();

    if (ticker) {
      dados = dados.filter(p => p.ativoTicker.toLowerCase().includes(ticker));
    }
    if (tipo) {
      dados = dados.filter(p => p.tipo === tipo);
    }
    if (ano) {
      dados = dados.filter(p => new Date(p.dataPagamento).getFullYear() === ano);
    }
    return dados;
  });

  totalProventosBruto = computed(() => {
    return this.proventosFiltrados().reduce((acc, p) => acc + (p.valorTotalBruto || 0), 0);
  });

  totalProventosLiquido = computed(() => {
    return this.proventosFiltrados().reduce((acc, p) => acc + (p.valorTotalLiquido || 0), 0);
  });

  constructor() {}

  ngOnInit(): void {
    this.loadProventos();
  }

  loadProventos(): void {
    const filtros = {
      // O backend pode não suportar todos esses filtros diretamente,
      // mas o serviço pode buscar todos e filtrar no frontend ou o backend pode ser adaptado.
      // Por simplicidade, o serviço atual busca todos e o computed signal filtra.
    };
    this.proventoService.getProventos(filtros).subscribe();
  }

  onFiltroChange(): void {
    // A reavaliação do computed signal `proventosFiltrados` já acontece automaticamente
    // quando `filtroTicker`, `filtroTipoProvento` ou `filtroAnoPagamento` mudam.
    // Se a carga de dados dependesse dos filtros no backend, chamaríamos `loadProventos` aqui.
  }

  editarProvento(id?: string): void {
    if (id) {
      this.router.navigate(["/proventos/editar", id]);
    }
  }

  confirmarDelecao(id?: string): void {
    if (!id) return;
    if (confirm("Tem certeza que deseja excluir este provento?")) {
      this.proventoService.deleteProvento(id).subscribe({
        next: () => {
          // A lista é atualizada automaticamente pelo signal no serviço
          console.log("Provento deletado com sucesso");
        },
        error: (err: any) => {
          this.error.set("Falha ao deletar provento: " + (err.message || JSON.stringify(err)));
          console.error(err);
        },
      });
    }
  }
}

