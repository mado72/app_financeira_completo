import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of, tap } from "rxjs";

export interface DespesaRecorrente {
  _id?: string;
  descricao: string;
  valorEstimado: number;
  frequencia: string; // "Mensal", "Anual", etc.
  diaDoMesVencimento?: number; // Para frequência mensal
  mesVencimento?: number; // Para frequência anual
  categoria: string;
  ativa: boolean;
  observacoes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DespesaRecorrenteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/despesas-recorrentes';
  
  despesasRecorrentes = signal<DespesaRecorrente[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  getDespesasRecorrentes(filters: any = {}): Observable<DespesaRecorrente[]> {
    this.isLoading.set(true);
    
    // Construir query params baseado nos filtros
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const url = `${this.apiUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return this.http.get<DespesaRecorrente[]>(url).pipe(
      tap(despesas => {
        this.despesasRecorrentes.set(despesas);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('Erro ao buscar despesas recorrentes:', err);
        this.error.set('Falha ao carregar despesas recorrentes.');
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  getDespesaRecorrente(id: string): Observable<DespesaRecorrente | null> {
    return this.http.get<DespesaRecorrente>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error('Erro ao buscar despesa recorrente:', err);
        return of(null);
      })
    );
  }

  createDespesaRecorrente(despesa: DespesaRecorrente): Observable<DespesaRecorrente | null> {
    return this.http.post<DespesaRecorrente>(this.apiUrl, despesa).pipe(
      tap(novaDespesa => {
        const despesasAtuais = this.despesasRecorrentes();
        this.despesasRecorrentes.set([...despesasAtuais, novaDespesa]);
      }),
      catchError(err => {
        console.error('Erro ao criar despesa recorrente:', err);
        return of(null);
      })
    );
  }

  updateDespesaRecorrente(id: string, despesa: Partial<DespesaRecorrente>): Observable<DespesaRecorrente | null> {
    return this.http.put<DespesaRecorrente>(`${this.apiUrl}/${id}`, despesa).pipe(
      tap(despesaAtualizada => {
        const despesasAtuais = this.despesasRecorrentes();
        const index = despesasAtuais.findIndex(d => d._id === id);
        if (index !== -1) {
          const novaLista = [...despesasAtuais];
          novaLista[index] = despesaAtualizada;
          this.despesasRecorrentes.set(novaLista);
        }
      }),
      catchError(err => {
        console.error('Erro ao atualizar despesa recorrente:', err);
        return of(null);
      })
    );
  }

  deleteDespesaRecorrente(id: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        const despesasAtuais = this.despesasRecorrentes();
        this.despesasRecorrentes.set(despesasAtuais.filter(d => d._id !== id));
        return true;
      }),
      catchError(err => {
        console.error('Erro ao deletar despesa recorrente:', err);
        return of(false);
      })
    );
  }

  // Método específico para ativar/desativar
  toggleAtiva(id: string, ativa: boolean): Observable<DespesaRecorrente | null> {
    return this.updateDespesaRecorrente(id, { ativa });
  }
}
