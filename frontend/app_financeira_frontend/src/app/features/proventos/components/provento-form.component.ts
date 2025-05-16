import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, Location, CurrencyPipe, DatePipe } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ProventoService, Provento } from "../services/provento.service";
import { AtivoService, Ativo } from "../../ativos/services/ativo.service"; // Para buscar tickers
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-provento-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: "./provento-form.component.html",
  styleUrls: ["./provento-form.component.css"],
})
export class ProventoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proventoService = inject(ProventoService);
  private ativoService = inject(AtivoService); // Para carregar tickers
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  proventoForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  proventoId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  ativosDisponiveis = signal<Ativo[]>([]); // Para o select de tickers
  tiposDeProvento = signal<string[]>(["DIVIDENDO", "JCP", "ALUGUEL_FII", "RENDIMENTO_RF", "OUTRO"]);

  ngOnInit(): void {
    this.proventoForm = this.fb.group({
      ativoTicker: ["", Validators.required],
      dataCom: [new Date().toISOString().split("T")[0], Validators.required],
      dataPagamento: [new Date().toISOString().split("T")[0], Validators.required],
      tipo: ["DIVIDENDO", Validators.required],
      valorBrutoPorUnidade: [null, [Validators.required, Validators.min(0.00001)]],
      quantidadeNaDataCom: [null, [Validators.required, Validators.min(1)]],
      observacao: [""]
    });

    this.loadAtivosDisponiveis();

    this.route.paramMap.subscribe(params => {
      const id = params.get("id");
      if (id) {
        this.isEditMode.set(true);
        this.proventoId.set(id);
        this.loadProventoParaEdicao(id);
      }
    });
  }

  async loadAtivosDisponiveis(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Usar o signal diretamente se já estiver populado ou buscar do serviço
      let ativos = this.ativoService.ativos$();
      if (ativos.length === 0) {
        await firstValueFrom(this.ativoService.getAtivos());
        ativos = this.ativoService.ativos$();
      }
      this.ativosDisponiveis.set(ativos);
    } catch (err: any) {
      this.error.set("Falha ao carregar lista de ativos para seleção.");
      console.error(err);
    } finally {
      this.isLoading.set(false); // Garante que o loading seja desativado
    }
  }

  loadProventoParaEdicao(id: string): void {
    this.isLoading.set(true);
    this.proventoService.getProvento(id).subscribe({
      next: (provento: Provento | null) => {
        if (provento) {
          this.proventoForm.patchValue({
            ...provento,
            dataCom: provento.dataCom ? new Date(provento.dataCom).toISOString().split("T")[0] : null,
            dataPagamento: provento.dataPagamento ? new Date(provento.dataPagamento).toISOString().split("T")[0] : null,
          });
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.error.set(`Falha ao carregar provento para edição: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.proventoForm.invalid) {
      this.error.set("Formulário inválido. Verifique os campos.");
      Object.values(this.proventoForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);

    const proventoData = this.proventoForm.value as Provento;

    if (this.isEditMode() && this.proventoId()) {
      this.proventoService.updateProvento(this.proventoId()!, proventoData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/proventos"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao atualizar provento: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    } else {
      this.proventoService.createProvento(proventoData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/proventos"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao criar provento: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    }
  }

  voltar(): void {
    this.location.back();
  }

  // Helpers para acesso fácil aos controles do formulário no template
  get ativoTicker() { return this.proventoForm.get("ativoTicker"); }
  get dataCom() { return this.proventoForm.get("dataCom"); }
  get dataPagamento() { return this.proventoForm.get("dataPagamento"); }
  get tipo() { return this.proventoForm.get("tipo"); }
  get valorBrutoPorUnidade() { return this.proventoForm.get("valorBrutoPorUnidade"); }
  get quantidadeNaDataCom() { return this.proventoForm.get("quantidadeNaDataCom"); }
}

