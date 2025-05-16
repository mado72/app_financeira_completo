import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { AtivoService, Ativo, AtivoComCotacao } from "../../services/ativo.service";
import { FormsModule } from "@angular/forms"; // Para filtros, se necessário
import { firstValueFrom } from "rxjs"; // Importar firstValueFrom

@Component({
  selector: "app-ativo-list",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: "./ativo-list.component.html",
  styleUrl: "./ativo-list.component.css",
})
export class AtivoListComponent implements OnInit {
  private ativoService = inject(AtivoService);
  private router = inject(Router);

  // Usar o signal público do serviço
  ativos = this.ativoService.ativos$;
  
  // Signal para armazenar ativos com suas cotações para exibição
  ativosComCotacao = signal<AtivoComCotacao[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filtros (exemplo básico)
  filtroNome = signal<string>("");
  filtroTipo = signal<string>("");

  tiposDeAtivo = this.ativoService.tiposAtivo$;

  ativosFiltrados = computed(() => {
    const nome = this.filtroNome().toLowerCase();
    const tipo = this.filtroTipo();
    const todosAtivosComCotacao = this.ativosComCotacao();

    if (!todosAtivosComCotacao) return [];

    return todosAtivosComCotacao.filter(item => {
      const matchNome = item.ativo.nome.toLowerCase().includes(nome) || item.ativo.ticker.toLowerCase().includes(nome);
      const matchTipo = tipo ? item.ativo.tipo === tipo : true;
      return matchNome && matchTipo;
    });
  });

  ngOnInit(): void {
    this.carregarAtivosComCotacoes();
  }

  carregarAtivosComCotacoes(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const ativosSource = this.ativoService.ativos$();

    if (ativosSource.length === 0) {
        this.ativoService.getAtivos().subscribe({
            next: (novosAtivos: Ativo[]) => {
                if (novosAtivos.length > 0) {
                    this.processarAtivos(novosAtivos);
                } else {
                    this.isLoading.set(false);
                    this.ativosComCotacao.set([]);
                }
            },
            error: (err: any) => {
                this.error.set("Falha ao carregar lista de ativos inicial.");
                this.isLoading.set(false);
                console.error(err);
            }
        });
    } else {
        this.processarAtivos(ativosSource);
    }
  }

  private async processarAtivos(ativos: Ativo[]): Promise<void> { // Marcar como async
    if (!ativos || ativos.length === 0) {
        this.ativosComCotacao.set([]);
        this.isLoading.set(false);
        return;
    }

    const promessasCotacoes = ativos.map(async (ativo: Ativo) => { // Marcar callback como async
      try {
        // Usar firstValueFrom em vez de toPromise()
        const ativoComCotacaoDetalhe = await firstValueFrom(this.ativoService.getAtivo(ativo._id!));
        return ativoComCotacaoDetalhe;
      } catch (err: any) {
        console.error(`Falha ao buscar ativo com cotação para ${ativo.ticker}:`, err);
        return {
          ativo: ativo,
          cotacao: { price: null, isFallback: true, error: err.message || "Erro ao buscar cotação." }
        } as AtivoComCotacao;
      }
    });

    try {
      const resultados = await Promise.all(promessasCotacoes);
      this.ativosComCotacao.set(resultados.filter((r: AtivoComCotacao | undefined) => r !== undefined) as AtivoComCotacao[]);
      this.isLoading.set(false);
    } catch (err: any) {
      this.error.set("Falha ao processar cotações dos ativos.");
      this.isLoading.set(false);
      console.error(err);
    }
  }

  verDetalhes(id: string | undefined): void {
    if (id) {
      this.router.navigate(["/ativos/detalhe", id]);
    }
  }

  editarAtivo(id: string | undefined): void {
    if (id) {
      this.router.navigate(["/ativos/editar", id]);
    }
  }

  confirmarDelecao(id: string | undefined): void {
    if (!id) return;
    if (confirm("Tem certeza que deseja excluir este ativo?")) {
      this.ativoService.deleteAtivo(id).subscribe({
        next: () => {
          this.carregarAtivosComCotacoes(); 
          console.log("Ativo deletado com sucesso");
        },
        error: (err: any) => {
          this.error.set("Falha ao deletar ativo: " + err.message);
          console.error(err);
        },
      });
    }
}

  getCurrencyCode(item: AtivoComCotacao): string {
    if (item.cotacao?.currency) {
      return item.cotacao.currency;
    }
    if (item.ativo.detalhes && item.ativo.detalhes['MoedaOriginalCompra']) {
      return item.ativo.detalhes['MoedaOriginalCompra'] as string;
    }
    const internationalTypes = ['ACAO_INTERNACIONAL', 'ETF_INTERNACIONAL', 'REIT', 'CRIPTOMOEDA', 'MOEDA_ESTRANGEIRA'];
    if (internationalTypes.includes(item.ativo.tipo)) {
      return 'USD';
    }
    return 'BRL';
  }
}

