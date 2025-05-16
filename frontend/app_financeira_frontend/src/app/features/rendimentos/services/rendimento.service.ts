import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interface para os dados de rendimento (ajustar conforme o backend)
export interface Rendimento {
  _id?: string;
  data: Date;
  valor: number;
  tipo: string; // Ex: 'DIVIDENDO', 'JCP', 'ALUGUEL_FII', 'RENDIMENTO_RF'
  ativoTicker?: string; // Ticker do ativo que gerou o rendimento (opcional)
  descricao?: string; // Descrição adicional (opcional)
}

// Interface para os dados do gráfico (exemplo)
export interface DadosGraficoRendimentos {
  name: string; // Mês/Ano ou Data
  value: number; // Valor total dos rendimentos
}

@Injectable({
  providedIn: 'root'
})
export class RendimentoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/rendimentos'; // Ajustar URL da API do backend

  // Signals para o estado
  rendimentos = signal<Rendimento[]>([]);
  dadosGrafico = signal<DadosGraficoRendimentos[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() { }

  // Buscar todos os rendimentos (com filtros opcionais)
  getRendimentos(filtros?: any): Observable<Rendimento[]> {
    this.isLoading.set(true);
    this.error.set(null);
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined && filtros[key] !== null) {
          params = params.append(key, filtros[key]);
        }
      });
    }

    return this.http.get<Rendimento[]>(this.apiUrl, { params }).pipe(
      tap(data => {
        this.rendimentos.set(data);
        this.processarDadosParaGrafico(data); // Processar para o gráfico
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao carregar rendimentos.');
        this.isLoading.set(false);
        console.error(err);
        return of([]);
      })
    );
  }

  // Adicionar novo rendimento
  createRendimento(rendimento: Rendimento): Observable<Rendimento> {
    this.isLoading.set(true);
    return this.http.post<Rendimento>(this.apiUrl, rendimento).pipe(
      tap(novoRendimento => {
        this.rendimentos.update(atuais => [...atuais, novoRendimento]);
        this.processarDadosParaGrafico(this.rendimentos());
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao criar rendimento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }

  // Atualizar rendimento existente
  updateRendimento(id: string, rendimento: Partial<Rendimento>): Observable<Rendimento> {
    this.isLoading.set(true);
    return this.http.put<Rendimento>(`${this.apiUrl}/${id}`, rendimento).pipe(
      tap(rendimentoAtualizado => {
        this.rendimentos.update(atuais => 
          atuais.map(r => r._id === id ? { ...r, ...rendimentoAtualizado } : r)
        );
        this.processarDadosParaGrafico(this.rendimentos());
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao atualizar rendimento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }

  // Deletar rendimento
  deleteRendimento(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.rendimentos.update(atuais => atuais.filter(r => r._id !== id));
        this.processarDadosParaGrafico(this.rendimentos());
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao deletar rendimento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }

  // Processar dados de rendimentos para o formato do gráfico
  // Este é um exemplo, pode precisar de ajustes conforme os requisitos do gráfico
  private processarDadosParaGrafico(rendimentos: Rendimento[]): void {
    // Agrupar por mês/ano e somar valores
    const agrupado: { [key: string]: number } = {};
    rendimentos.forEach(r => {
      const data = new Date(r.data);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      agrupado[chave] = (agrupado[chave] || 0) + r.valor;
    });

    const dadosFormatados: DadosGraficoRendimentos[] = Object.keys(agrupado)
      .map(chave => ({
        name: chave, // Pode formatar para 'MM/YYYY' se preferir
        value: agrupado[chave]
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Ordenar por data
    
    this.dadosGrafico.set(dadosFormatados);
  }
}

