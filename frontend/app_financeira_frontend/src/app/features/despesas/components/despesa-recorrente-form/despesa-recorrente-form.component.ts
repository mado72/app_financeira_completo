import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { DespesaRecorrente, DespesaRecorrenteService } from "../../services/despesa-recorrente.service";

@Component({
  selector: "app-despesa-recorrente-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./despesa-recorrente-form.component.html",
  styleUrl: "./despesa-recorrente-form.component.css",
})
export class DespesaRecorrenteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private despesaService = inject(DespesaRecorrenteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  despesaForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  despesaId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // TODO: Carregar de um enum/serviço compartilhado
  frequenciasDisponiveis = signal<string[]>(["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual", "Semanal", "Quinzenal"]);
  categoriasDisponiveis = signal<string[]>(["Moradia", "Transporte", "Alimentação", "Saúde", "Educação", "Lazer", "Vestuário", "Assinaturas", "Impostos", "Outras"]); 

  ngOnInit(): void {
    this.despesaForm = this.fb.group({
      descricao: ["", Validators.required],
      valorEstimado: [null, [Validators.required, Validators.min(0.01)]],
      frequencia: ["Mensal", Validators.required],
      diaDoMesVencimento: [null, [Validators.min(1), Validators.max(31)]],
      mesVencimento: [null, [Validators.min(1), Validators.max(12)]],
      categoria: ["Outras"],
      ativa: [true],
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

    // Lógica para mostrar/esconder campos de dia/mês baseado na frequência
    this.despesaForm.get("frequencia")?.valueChanges.subscribe((freq: string) => {
      const diaControl = this.despesaForm.get("diaDoMesVencimento");
      const mesControl = this.despesaForm.get("mesVencimento");

      if (freq === "Mensal" || freq === "Bimestral" || freq === "Trimestral" || freq === "Semestral" || freq === "Quinzenal") {
        diaControl?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
        mesControl?.clearValidators();
        mesControl?.setValue(null);
      } else if (freq === "Anual") {
        diaControl?.clearValidators();
        diaControl?.setValue(null);
        mesControl?.setValidators([Validators.required, Validators.min(1), Validators.max(12)]);
      } else { // Semanal ou Outra
        diaControl?.clearValidators();
        diaControl?.setValue(null);
        mesControl?.clearValidators();
        mesControl?.setValue(null);
      }
      diaControl?.updateValueAndValidity();
      mesControl?.updateValueAndValidity();
    });
  }

  loadDespesaParaEdicao(id: string): void {
    this.isLoading.set(true);
    this.despesaService.getDespesaRecorrente(id).subscribe({
      next: (despesa: DespesaRecorrente | null) => {
        if (despesa) {
          this.despesaForm.patchValue(despesa);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.error.set(`Falha ao carregar despesa recorrente para edição: ${err.message}`);
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

    const despesaData = this.despesaForm.value as DespesaRecorrente;

    if (this.isEditMode() && this.despesaId()) {
      this.despesaService.updateDespesaRecorrente(this.despesaId()!, despesaData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/despesas/recorrentes"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao atualizar despesa recorrente: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    } else {
      this.despesaService.createDespesaRecorrente(despesaData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/despesas/recorrentes"]);
        },
        error: (err: any) => {
          this.error.set(`Falha ao criar despesa recorrente: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    }
  }

  voltar(): void {
    this.location.back();
  }

  // Helpers
  get descricao() { return this.despesaForm.get("descricao"); }
  get valorEstimado() { return this.despesaForm.get("valorEstimado"); }
  get frequencia() { return this.despesaForm.get("frequencia"); }
  get diaDoMesVencimento() { return this.despesaForm.get("diaDoMesVencimento"); }
  get mesVencimento() { return this.despesaForm.get("mesVencimento"); }
  get categoria() { return this.despesaForm.get("categoria"); }
}

