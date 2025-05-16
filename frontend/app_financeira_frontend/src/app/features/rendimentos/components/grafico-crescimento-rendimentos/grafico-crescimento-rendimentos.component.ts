import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxChartsModule, ScaleType } from "@swimlane/ngx-charts"; // Importar ngx-charts
import { RendimentoService, DadosGraficoRendimentos } from "../../services/rendimento.service";

@Component({
  selector: "app-grafico-crescimento-rendimentos",
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: "./grafico-crescimento-rendimentos.component.html",
  styleUrls: ["./grafico-crescimento-rendimentos.component.css"],
})
export class GraficoCrescimentoRendimentosComponent implements OnInit {
  private rendimentoService = inject(RendimentoService);

  // Signals do serviço
  dadosGrafico = this.rendimentoService.dadosGrafico;
  isLoading = this.rendimentoService.isLoading;
  error = this.rendimentoService.error;

  // Configurações do gráfico (podem ser ajustadas)
  view: [number, number] = [700, 400]; // Largura x Altura
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = "Mês/Ano";
  yAxisLabel: string = "Total Rendimentos";
  timeline: boolean = false; // Para gráficos de linha com eixo de tempo
  colorScheme = {
    name: "customScheme",
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ["#5AA454", "#A10A28", "#C7B42C", "#AAAAAA"], // Cores personalizadas (verde, vermelho, amarelo, cinza)
  };

  // Dados formatados para o ngx-charts (precisa ser um array com um objeto dentro para bar chart)
  // ou diretamente o array para line chart.
  // Para um gráfico de barras verticais, esperamos algo como: [{ name: "Rendimentos", series: DadosGraficoRendimentos[] }]
  // Para um gráfico de linha, esperamos: DadosGraficoRendimentos[] diretamente se for uma única linha,
  // ou [{ name: "Rendimentos", series: DadosGraficoRendimentos[] }] se quisermos legenda para a linha.
  
  // Usaremos um computed signal para transformar os dados do serviço para o formato que o gráfico de linha espera
  // Se for uma única linha, o formato é: { name: string, series: { name: string, value: number }[] }[]
  // ou mais simples para uma única série: { name: string, value: number }[]
  // Para ngx-charts line-chart, o formato é: { name: "Nome da Série", series: [{name: "Ponto X1", value: Y1}, {name: "Ponto X2", value: Y2}] }[]
  
  // Vamos usar um gráfico de barras para o crescimento mensal de rendimentos
  // O formato esperado é: { name: "Mês/Ano", value: number }[]
  // Ou, se quisermos agrupar por tipo de rendimento no futuro, seria mais complexo.
  // Por agora, um gráfico de barras simples com o total mensal.
  
  // O `dadosGrafico` do serviço já está no formato { name: string, value: number }[], que é adequado para um bar-vertical.

  constructor() {}

  ngOnInit(): void {
    // Carregar os dados de rendimentos. O serviço já processa para o gráfico.
    // Se os dados não forem carregados por outro componente, podemos chamar aqui.
    // Exemplo: if (this.rendimentoService.rendimentos().length === 0) {
    //   this.rendimentoService.getRendimentos().subscribe();
    // }
    // Por enquanto, vamos assumir que os dados são carregados por um componente de lista de rendimentos ou similar.
    // Se este gráfico for a única visualização de rendimentos, descomente a carga aqui.
  }

  // Função para formatar os valores do eixo Y (opcional)
  formatYAxisTick(val: number): string {
    return `R$${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Métodos de evento para o gráfico
  onSelect(event: any): void {
    console.log('Item selecionado:', event);
  }

  onActivate(event: any): void {
    console.log('Item ativado:', event);
  }

  onDeactivate(event: any): void {
    console.log('Item desativado:', event);
  }
}

