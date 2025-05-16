import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { DespesaProgramada, DespesaProgramadaService } from "../../services/despesa-programada.service";
import { DespesaRecorrente, DespesaRecorrenteService } from "../../services/despesa-recorrente.service";
import { forkJoin } from "rxjs";
import { map } from "rxjs/operators";

interface FluxoCaixaItem {
  data: Date;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida_programada" | "saida_recorrente";
  pago?: boolean; // Apenas para despesas programadas
}

@Component({
  selector: "app-fluxo-caixa",
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: "./fluxo-caixa.component.html",
  styleUrl: "./fluxo-caixa.component.css",
})
export class FluxoCaixaComponent implements OnInit {
  private despesaProgramadaService = inject(DespesaProgramadaService);
  private despesaRecorrenteService = inject(DespesaRecorrenteService);
  // private proventoService = inject(ProventoService); // Futuramente para entradas

  fluxoCaixaItens = signal<FluxoCaixaItem[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filtros para o período do fluxo de caixa
  dataInicio = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  dataFim = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  saldoInicial = signal<number>(0); // Poderia vir de uma conta/saldo

  saldoFinal = computed(() => {
    let saldo = this.saldoInicial();
    this.fluxoCaixaItens().forEach(item => {
      if (item.tipo === "entrada") {
        saldo += item.valor;
      } else if (item.tipo === "saida_programada" && item.pago) {
        saldo -= item.valor;
      } else if (item.tipo === "saida_recorrente") { // Assumindo que recorrentes são sempre "saídas" no período
        saldo -= item.valor;
      }
    });
    return saldo;
  });

  totalEntradas = computed(() => {
    return this.fluxoCaixaItens()
      .filter(item => item.tipo === "entrada")
      .reduce((acc, item) => acc + item.valor, 0);
  });

  totalSaidasProgramadasPagas = computed(() => {
    return this.fluxoCaixaItens()
      .filter(item => item.tipo === "saida_programada" && item.pago)
      .reduce((acc, item) => acc + item.valor, 0);
  });

  totalSaidasRecorrentes = computed(() => {
    return this.fluxoCaixaItens()
      .filter(item => item.tipo === "saida_recorrente")
      .reduce((acc, item) => acc + item.valor, 0);
  });

  constructor() {}

  ngOnInit(): void {
    this.loadFluxoCaixa();
  }

  loadFluxoCaixa(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.fluxoCaixaItens.set([]);

    const anoInicio = this.dataInicio().getFullYear();
    const mesInicio = this.dataInicio().getMonth() + 1; // Mês é 0-indexed
    const anoFim = this.dataFim().getFullYear();
    const mesFim = this.dataFim().getMonth() + 1;

    // Para simplificar, vamos pegar todas as despesas programadas do período (mês/ano)
    // e todas as recorrentes ativas.
    // Uma lógica mais complexa seria necessária para projetar despesas recorrentes futuras
    // baseadas em sua frequência e dia/mês de vencimento dentro do período selecionado.

    forkJoin({
      despesasProgramadas: this.despesaProgramadaService.getDespesasProgramadas({ ano: anoInicio /* idealmente um range */ }),
      despesasRecorrentes: this.despesaRecorrenteService.getDespesasRecorrentes({ ativa: true }),
      // proventos: this.proventoService.getProventos({ dataInicio: this.dataInicio(), dataFim: this.dataFim() }) // Futuro
    }).pipe(
      map(({ despesasProgramadas, despesasRecorrentes /*, proventos */ }) => {
        const itens: FluxoCaixaItem[] = [];

        // Mapear Despesas Programadas
        despesasProgramadas.forEach((dp: DespesaProgramada) => {
          const dataVenc = new Date(dp.dataVencimento);
          if (dataVenc >= this.dataInicio() && dataVenc <= this.dataFim()) {
            itens.push({
              data: dataVenc,
              descricao: dp.descricao,
              valor: dp.valor,
              tipo: "saida_programada",
              pago: dp.pago
            });
          }
        });

        // Mapear Despesas Recorrentes (simplificado - apenas adiciona se ativa)
        // Lógica de projeção de vencimentos seria mais complexa aqui
        despesasRecorrentes.forEach((dr: DespesaRecorrente) => {
          // Simulação simples: se for mensal, adiciona uma ocorrência no mês atual do filtro
          if (dr.frequencia === "Mensal" && dr.diaDoMesVencimento) {
            const dataRecorrente = new Date(this.dataInicio().getFullYear(), this.dataInicio().getMonth(), dr.diaDoMesVencimento);
             if (dataRecorrente >= this.dataInicio() && dataRecorrente <= this.dataFim()) {
                itens.push({
                    data: dataRecorrente,
                    descricao: `${dr.descricao} (Recorrente)`,
                    valor: dr.valorEstimado,
                    tipo: "saida_recorrente"
                });
            }
          }
          // Adicionar outras lógicas de frequência (Anual, etc.)
        });
        
        // Mapear Proventos (Entradas) - Futuro
        /*
        proventos.forEach(p => {
          itens.push({
            data: new Date(p.dataRecebimento),
            descricao: `Provento: ${p.ativoTicker}`,
            valor: p.valorRecebido,
            tipo: "entrada"
          });
        });
        */

        // Ordenar por data
        return itens.sort((a, b) => a.data.getTime() - b.data.getTime());
      })
    ).subscribe({
      next: (mappedItens) => {
        this.fluxoCaixaItens.set(mappedItens);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set("Falha ao carregar dados para o fluxo de caixa.");
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  onPeriodoChange(): void {
    // Recalcular dataFim se necessário ou apenas recarregar
    this.loadFluxoCaixa();
  }

  // Funções para mudar mês/ano do filtro
  proximoMes(): void {
    const novaDataInicio = new Date(this.dataInicio().getFullYear(), this.dataInicio().getMonth() + 1, 1);
    this.dataInicio.set(novaDataInicio);
    this.dataFim.set(new Date(novaDataInicio.getFullYear(), novaDataInicio.getMonth() + 1, 0));
    this.loadFluxoCaixa();
  }

  mesAnterior(): void {
    const novaDataInicio = new Date(this.dataInicio().getFullYear(), this.dataInicio().getMonth() - 1, 1);
    this.dataInicio.set(novaDataInicio);
    this.dataFim.set(new Date(novaDataInicio.getFullYear(), novaDataInicio.getMonth() + 1, 0));
    this.loadFluxoCaixa();
  }
}

