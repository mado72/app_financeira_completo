import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { DespesaProgramada, DespesaProgramadaService } from "../../services/despesa-programada.service";

@Component({
  selector: "app-despesa-programada-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./despesa-programada-form.component.html",
  styleUrl: "./despesa-programada-form.component.css",
})
export class DespesaProgramadaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private despesaService = inject(DespesaProgramadaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  despesaForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  despesaId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  // TODO: Carregar categorias de um serviço ou enum compartilhado
  categoriasDisponiveis = signal<string[]>(["Moradia", "Transporte", "Alimentação", "Saúde", "Educação", "Lazer", "Vestuário", "Assinaturas", "Outras"]); 

  ngOnInit(): void {
    this.despesaForm = this.fb.group({
      descricao: ["", Validators.required],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      dataVencimento: [new Date().toISOString().split("T")[0], Validators.required], // Formato YYYY-MM-DD
      categoria: ["Outras"],
      pago: [false],
      observacao: [""]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get("id");
      if (id) {
        this.isEditMode.set(true);
        this.despesaId.set(id);
        this.loadDespesaParaEdicao(id);
      }
    });
  }

  loadDespesaParaEdicao(id: string): void {
    this.isLoading.set(true);
    this.despesaService.getDespesaProgramada(id).subscribe({
      next: (despesa: DespesaProgramada | null) => {
        if (despesa) {
          this.despesaForm.patchValue({
            ...despesa,
            dataVencimento: despesa.dataVencimento ? new Date(despesa.dataVencimento).toISOString().split("T")[0] : null,
          });
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.error.set(`Falha ao carregar despesa para edição: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.despesaForm.invalid) {
      this.error.set("Formulário inválido. Verifique os campos.");
      Object.values(this.despesaForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);

    const despesaData = this.despesaForm.value as DespesaProgramada;

    if (this.isEditMode() && this.despesaId()) {
      this.despesaService.updateDespesaProgramada(this.despesaId()!, despesaData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/despesas/programadas"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao atualizar despesa: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    } else {
      this.despesaService.createDespesaProgramada(despesaData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/despesas/programadas"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao criar despesa: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    }
  }

  voltar(): void {
    this.location.back();
  }

  // Helpers para acesso fácil aos controles do formulário no template
  get descricao() { return this.despesaForm.get("descricao"); }
  get valor() { return this.despesaForm.get("valor"); }
  get dataVencimento() { return this.despesaForm.get("dataVencimento"); }
  get categoria() { return this.despesaForm.get("categoria"); }
}

