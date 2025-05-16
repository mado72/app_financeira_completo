import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe, Location } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AtivoService, Ativo, Cotacao, AtivoComCotacao } from "../../services/ativo.service";

@Component({
  selector: "app-ativo-detail",
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: "./ativo-detail.component.html",
  styleUrl: "./ativo-detail.component.css",
})
export class AtivoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ativoService = inject(AtivoService);
  private location = inject(Location);

  ativoComCotacao = signal<AtivoComCotacao | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Expor Object.keys e Object.entries para o template
  objectKeys = Object.keys;
  objectEntries = Object.entries;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadAtivoDetalhes(id);
    }
  }

  loadAtivoDetalhes(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.ativoService.getAtivo(id).subscribe({
      next: (data) => {
        this.ativoComCotacao.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Falha ao carregar detalhes do ativo: ${err.message}`);
        this.isLoading.set(false);
        console.error(err);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }
  
  // Adicionar método para calcular valor total do ativo (Quantidade * Preço Atual)
  calcularValorTotal(ativo: Ativo, cotacao: Cotacao | null): number | null {
    if (cotacao && cotacao.price !== null && cotacao.price !== undefined) {
      return ativo.quantidade * cotacao.price;
    }
    return null;
  }

  // Adicionar método para calcular lucro/prejuízo (Valor Total - (Quantidade * Preço Médio))
  calcularLucroPrejuizo(ativo: Ativo, cotacao: Cotacao | null): number | null {
    const valorTotal = this.calcularValorTotal(ativo, cotacao);
    if (valorTotal !== null) {
      const custoTotal = ativo.quantidade * ativo.precoMedioCompra;
      return valorTotal - custoTotal;
    }
    return null;
  }

  // Adicionar método para calcular percentual de lucro/prejuízo
  calcularPercentualLucroPrejuizo(ativo: Ativo, cotacao: Cotacao | null): number | null {
    const lucroPrejuizo = this.calcularLucroPrejuizo(ativo, cotacao);
    if (lucroPrejuizo !== null) {
      const custoTotal = ativo.quantidade * ativo.precoMedioCompra;
      if (custoTotal === 0) return null; // Evitar divisão por zero
      return (lucroPrejuizo / custoTotal) * 100;
    }
    return null;
  }
}

