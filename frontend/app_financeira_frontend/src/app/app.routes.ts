import { Routes } from "@angular/router";
import { AtivoListComponent } from "./features/ativos/components/ativo-list/ativo-list.component";
import { AtivoFormComponent } from "./features/ativos/components/ativo-form/ativo-form.component";
import { AtivoDetailComponent } from "./features/ativos/components/ativo-detail/ativo-detail.component";
import { DespesaProgramadaListComponent } from "./features/despesas/components/despesa-programada-list/despesa-programada-list.component";
import { DespesaProgramadaFormComponent } from "./features/despesas/components/despesa-programada-form/despesa-programada-form.component";
import { DespesaRecorrenteListComponent } from "./features/despesas/components/despesa-recorrente-list/despesa-recorrente-list.component";
import { DespesaRecorrenteFormComponent } from "./features/despesas/components/despesa-recorrente-form/despesa-recorrente-form.component";
import { FluxoCaixaComponent } from "./features/despesas/components/fluxo-caixa/fluxo-caixa.component";
import { GraficoCrescimentoRendimentosComponent } from "./features/rendimentos/components/grafico-crescimento-rendimentos/grafico-crescimento-rendimentos.component";
import { ProventoListComponent } from "./features/proventos/components/provento-list.component";
import { ProventoFormComponent } from "./features/proventos/components/provento-form.component";

export const routes: Routes = [
    { path: "", redirectTo: "/ativos", pathMatch: "full" }, 
    { path: "ativos", component: AtivoListComponent, title: "Meus Ativos" },
    { path: "ativos/novo", component: AtivoFormComponent, title: "Adicionar Ativo" },
    { path: "ativos/editar/:id", component: AtivoFormComponent, title: "Editar Ativo" },
    { path: "ativos/detalhe/:id", component: AtivoDetailComponent, title: "Detalhes do Ativo" },
    {
        path: "despesas", 
        title: "Gerenciar Despesas",
        children: [
            { path: "", redirectTo: "programadas", pathMatch: "full" },
            { path: "programadas", component: DespesaProgramadaListComponent, title: "Despesas Programadas" },
            { path: "programadas/nova", component: DespesaProgramadaFormComponent, title: "Nova Despesa Programada" },
            { path: "programadas/editar/:id", component: DespesaProgramadaFormComponent, title: "Editar Despesa Programada" },
            { path: "recorrentes", component: DespesaRecorrenteListComponent, title: "Despesas Recorrentes" },
            { path: "recorrentes/nova", component: DespesaRecorrenteFormComponent, title: "Nova Despesa Recorrente" },
            { path: "recorrentes/editar/:id", component: DespesaRecorrenteFormComponent, title: "Editar Despesa Recorrente" },
            { path: "fluxo-caixa", component: FluxoCaixaComponent, title: "Fluxo de Caixa" }
        ]
    },
    { path: "rendimentos/grafico-crescimento", component: GraficoCrescimentoRendimentosComponent, title: "Gráfico de Crescimento de Rendimentos" },
    { path: "proventos", component: ProventoListComponent, title: "Meus Proventos" },
    { path: "proventos/novo", component: ProventoFormComponent, title: "Adicionar Provento" },
    { path: "proventos/editar/:id", component: ProventoFormComponent, title: "Editar Provento" }
    // { path: "**", redirectTo: "/ativos" } // Rota curinga, opcional
];
