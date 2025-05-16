import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, map, of, tap } from "rxjs";

export interface DespesaProgramada {
  _id?: string;
  descricao: string;
  valor: number;
  dataVencimento: string | Date;
  categoria: string;
  pago: boolean;
  observacoes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DespesaProgramadaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/despesas-programadas';
  
  despesasProgramadas = signal<DespesaProgramada[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  getDespesasProgramadas(filters: any = {}): Observable<DespesaProgramada[]> {
    this.isLoading.set(true);
    
    // Construir query params baseado nos filtros
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const url = `${this.apiUrl}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return this.http.get<DespesaProgramada[]>(url).pipe(
      tap(despesas => {
        this.despesasProgramadas.set(despesas);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('Erro ao buscar despesas programadas:', err);
        this.error.set('Falha ao carregar despesas programadas.');
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  getDespesaProgramada(id: string): Observable<DespesaProgramada | null> {
    return this.http.get<DespesaProgramada>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error('Erro ao buscar despesa programada:', err);
        return of(null);
      })
    );
  }

  createDespesaProgramada(despesa: DespesaProgramada): Observable<DespesaProgramada | null> {
    return this.http.post<DespesaProgramada>(this.apiUrl, despesa).pipe(
      tap(novaDespesa => {
        const despesasAtuais = this.despesasProgramadas();
        this.despesasProgramadas.set([...despesasAtuais, novaDespesa]);
      }),
      catchError(err => {
        console.error('Erro ao criar despesa programada:', err);
        return of(null);
      })
    );
  }

  updateDespesaProgramada(id: string, despesa: Partial<DespesaProgramada>): Observable<DespesaProgramada | null> {
    return this.http.put<DespesaProgramada>(`${this.apiUrl}/${id}`, despesa).pipe(
      tap(despesaAtualizada => {
        const despesasAtuais = this.despesasProgramadas();
        const index = despesasAtuais.findIndex(d => d._id === id);
        if (index !== -1) {
          const novaLista = [...despesasAtuais];
          novaLista[index] = despesaAtualizada;
          this.despesasProgramadas.set(novaLista);
        }
      }),
      catchError(err => {
        console.error('Erro ao atualizar despesa programada:', err);
        return of(null);
      })
    );
  }

  deleteDespesaProgramada(id: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        const despesasAtuais = this.despesasProgramadas();
        this.despesasProgramadas.set(despesasAtuais.filter(d => d._id !== id));
        return true;
      }),
      catchError(err => {
        console.error('Erro ao deletar despesa programada:', err);
        return of(false);
      })
    );
  }

  // Método específico para marcar como paga/não paga
  togglePagamento(id: string, pago: boolean): Observable<DespesaProgramada | null> {
    return this.updateDespesaProgramada(id, { pago });
  }
}
