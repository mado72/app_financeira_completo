import { Component, Input, OnChanges, SimpleChanges, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxChartsModule, Color, ScaleType } from "@swimlane/ngx-charts";
import { AtivoComCotacao } from "../../services/ativo.service";

export interface ChartData {
  name: string;
  value: number;
  //Pode adicionar mais campos se necessário, como extra para tooltips
}

@Component({
  selector: "app-ativo-allocation-chart",
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: "./ativo-allocation-chart.component.html",
  styleUrl: "./ativo-allocation-chart.component.css",
})
export class AtivoAllocationChartComponent implements OnChanges {
  @Input() ativosComCotacao: AtivoComCotacao[] = [];

  chartData = signal<ChartData[]>([]);
  isLoading = signal<boolean>(true);

  // Opções do Gráfico de Pizza (Pie Chart)
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: any = "below"; // Pode ser right, below, etc.
  
  // Esquema de cores personalizado (azul e verde como base)
  colorScheme: Color = {
    name: "customFinancial",
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      "#007bff", // Azul primário
      "#28a745", // Verde sucesso
      "#17a2b8", // Azul info
      "#34d399", // Verde esmeralda
      "#0d6efd", // Azul mais escuro
      "#20c997", // Verde azulado
      "#6610f2", // Indigo
      "#1abc9c", // Verde água (do header)
      // Adicionar mais cores conforme necessário
    ],
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["ativosComCotacao"] && this.ativosComCotacao) {
      this.processDataForChart();
    }
  }

  private processDataForChart(): void {
    this.isLoading.set(true);
    if (!this.ativosComCotacao || this.ativosComCotacao.length === 0) {
      this.chartData.set([]);
      this.isLoading.set(false);
      return;
    }

    const allocationMap = new Map<string, number>();

    this.ativosComCotacao.forEach(item => {
      if (item.ativo && item.cotacao && typeof item.cotacao.price === "number") {
        const valorDoAtivo = item.ativo.quantidade * item.cotacao.price;
        const tipoAtivo = item.ativo.tipo || "Outros";
        allocationMap.set(tipoAtivo, (allocationMap.get(tipoAtivo) || 0) + valorDoAtivo);
      }
    });

    const dataForChart: ChartData[] = [];
    allocationMap.forEach((value, name) => {
      if (value > 0) { // Apenas incluir se o valor for positivo
        dataForChart.push({ name, value });
      }
    });
    
    this.chartData.set(dataForChart);
    this.isLoading.set(false);
  }

  onSelect(data: any): void {
    console.log("Item clicked", JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log("Activate", JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log("Deactivate", JSON.parse(JSON.stringify(data)));
  }
}

