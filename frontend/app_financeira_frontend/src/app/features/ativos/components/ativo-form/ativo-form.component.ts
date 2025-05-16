import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AtivoService, Ativo } from "../../services/ativo.service";
import { TIPOS_ATIVO } from "../../../../shared/constants/tipos-ativo.constants";

@Component({
  selector: "app-ativo-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./ativo-form.component.html",
  styleUrl: "./ativo-form.component.css",
})
export class AtivoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ativoService = inject(AtivoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  ativoForm!: FormGroup;
  isEditMode = signal<boolean>(false);
  ativoId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  tiposDeAtivo = signal<string[]>(TIPOS_ATIVO); // Carregar os tipos do backend ou de um enum compartilhado

  ngOnInit(): void {
    this.ativoForm = this.fb.group({
      nome: ["", Validators.required],
      ticker: ["", Validators.required],
      tipo: ["", Validators.required],
      quantidade: [null, [Validators.required, Validators.min(0)]],
      precoMedioCompra: [null, [Validators.required, Validators.min(0)]],
      dataAquisicao: [new Date().toISOString().split("T")[0]], // Formato YYYY-MM-DD
      detalhes: this.fb.group({ // Exemplo, pode ser mais dinâmico
        // Adicionar campos de detalhes conforme necessidade
      })
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get("id");
      if (id) {
        this.isEditMode.set(true);
        this.ativoId.set(id);
        this.loadAtivoParaEdicao(id);
      }
    });
    // Carregar tipos de ativo do serviço se não estiverem hardcoded
    // this.ativoService.getTiposDeAtivo().subscribe(tipos => this.tiposDeAtivo.set(tipos));
  }

  loadAtivoParaEdicao(id: string): void {
    this.isLoading.set(true);
    this.ativoService.getAtivo(id).subscribe({
      next: (ativoComCotacao) => {
        const ativo = ativoComCotacao.ativo;
        this.ativoForm.patchValue({
          ...ativo,
          dataAquisicao: ativo.dataAquisicao ? new Date(ativo.dataAquisicao).toISOString().split("T")[0] : null,
          // Detalhes precisam ser tratados especificamente se for um sub-formulário
        });
        // Se `detalhes` for um FormArray ou FormGroup, precisará de patchValue específico
        if (ativo.detalhes) {
            // this.ativoForm.get("detalhes")?.patchValue(ativo.detalhes); // Simplificado
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Falha ao carregar ativo para edição: ${err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.ativoForm.invalid) {
      this.error.set("Formulário inválido. Verifique os campos.");
      Object.values(this.ativoForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);

    const ativoData = this.ativoForm.value as Ativo;

    if (this.isEditMode() && this.ativoId()) {
      this.ativoService.updateAtivo(this.ativoId()!, ativoData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/ativos"]); // Ou para a página de detalhes
        },
        error: (err) => {
          this.error.set(`Falha ao atualizar ativo: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    } else {
      this.ativoService.createAtivo(ativoData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(["/ativos"]);
        },
        error: (err) => {
          this.error.set(`Falha ao criar ativo: ${err.message}`);
          this.isLoading.set(false);
        }
      });
    }
  }

  voltar(): void {
    this.location.back();
  }

  // Helpers para acesso fácil aos controles do formulário no template
  get nome() { return this.ativoForm.get("nome"); }
  get ticker() { return this.ativoForm.get("ticker"); }
  get tipo() { return this.ativoForm.get("tipo"); }
  get quantidade() { return this.ativoForm.get("quantidade"); }
  get precoMedioCompra() { return this.ativoForm.get("precoMedioCompra"); }
  get dataAquisicao() { return this.ativoForm.get("dataAquisicao"); }
}

