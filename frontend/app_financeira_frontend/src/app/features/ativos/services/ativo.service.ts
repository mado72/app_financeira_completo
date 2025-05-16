import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError, of } from "rxjs";
import { catchError, tap, map } from "rxjs/operators";

// Interfaces para tipagem (podem ser movidas para arquivos .model.ts)
export interface Ativo {
  _id?: string;
  nome: string;
  ticker: string;
  tipo: string;
  quantidade: number;
  precoMedioCompra: number;
  dataAquisicao?: string;
  detalhes?: Record<string, string>;
  // Adicionar outros campos conforme o modelo do backend
}

export interface Cotacao {
  symbol?: string;
  displayName?: string;
  price: number | null;
  previousClose?: number;
  currency?: string;
  marketState?: string;
  lastUpdated?: string;
  isFallback: boolean;
  source?: string; // "cache", "api", "fallback (API error)", etc.
  error?: string;
}

export interface AtivoComCotacao {
  ativo: Ativo;
  cotacao: Cotacao | null;
}

export interface ApiResponse<T> {
  status: string;
  results?: number;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: "root",
})
export class AtivoService {
  private http = inject(HttpClient);
  private apiUrl = "/api/ativos"; // URL base da API de ativos

  // Signals para gerenciar o estado dos ativos e tipos de ativos
  private ativosSignal = signal<Ativo[]>([]);
  private tiposAtivoSignal = signal<string[]>([]);

  // Expor os signals como apenas leitura (ou criar métodos para interagir)
  public readonly ativos$ = this.ativosSignal.asReadonly();
  public readonly tiposAtivo$ = this.tiposAtivoSignal.asReadonly();

  constructor() {
    this.loadInitialAtivos(); // Carregar ativos ao iniciar o serviço
    this.loadTiposAtivo();    // Carregar tipos de ativo
  }

  private loadInitialAtivos(): void {
    this.http.get<ApiResponse<{ ativos: Ativo[] }>>(`${this.apiUrl}`)
      .pipe(
        map(response => response.data.ativos),
        catchError(this.handleError<Ativo[]>("loadInitialAtivos", []))
      )
      .subscribe(ativos => this.ativosSignal.set(ativos));
  }

  private loadTiposAtivo(): void {
    this.http.get<ApiResponse<{ tipos: string[] }>>(`${this.apiUrl}/config/tipos`)
      .pipe(
        map(response => response.data.tipos),
        catchError(this.handleError<string[]>("loadTiposAtivo", []))
      )
      .subscribe(tipos => this.tiposAtivoSignal.set(tipos));
  }

  getAtivos(): Observable<Ativo[]> {
    // Retorna o valor atual do signal ou busca novamente se necessário
    // Para este exemplo, vamos retornar o signal diretamente, mas poderia ter lógica de refresh
    return of(this.ativosSignal()); // Ou fazer uma nova chamada HTTP se a lógica exigir
  }

  getAtivo(id: string): Observable<AtivoComCotacao> {
    return this.http.get<ApiResponse<AtivoComCotacao>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError<AtivoComCotacao>(`getAtivo id=${id}`))
      );
  }

  createAtivo(ativo: Ativo): Observable<Ativo> {
    return this.http.post<ApiResponse<{ ativo: Ativo }>>(`${this.apiUrl}`, ativo)
      .pipe(
        map(response => response.data.ativo),
        tap(novoAtivo => {
          this.ativosSignal.update(ativos => [...ativos, novoAtivo]);
        }),
        catchError(this.handleError<Ativo>("createAtivo"))
      );
  }

  updateAtivo(id: string, ativo: Partial<Ativo>): Observable<Ativo> {
    return this.http.patch<ApiResponse<{ ativo: Ativo }>>(`${this.apiUrl}/${id}`, ativo)
      .pipe(
        map(response => response.data.ativo),
        tap(ativoAtualizado => {
          this.ativosSignal.update(ativos => 
            ativos.map(a => (a._id === id ? ativoAtualizado : a))
          );
        }),
        catchError(this.handleError<Ativo>("updateAtivo"))
      );
  }

  deleteAtivo(id: string): Observable<null> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data), // Geralmente é null para delete bem-sucedido (204)
        tap(() => {
          this.ativosSignal.update(ativos => ativos.filter(a => a._id !== id));
        }),
        catchError(this.handleError<null>("deleteAtivo"))
      );
  }
  
  getTiposDeAtivo(): Observable<string[]> {
     return of(this.tiposAtivoSignal()); // Retorna o valor atual do signal
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Poderia enviar o erro para uma infraestrutura de logging remota
      // Por enquanto, apenas loga no console

      // Deixar a app continuar rodando retornando um resultado vazio ou específico para o erro.
      return throwError(() => new Error(error.error?.message || error.message || `Falha na operação ${operation}`));
    };
  }
}

