import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

// Interface para os dados de Provento
export interface Provento {
  _id?: string;
  ativoTicker: string; // Ticker do ativo que gerou o provento
  dataCom: Date; // Data COM
  dataPagamento: Date;
  tipo: 'DIVIDENDO' | 'JCP' | 'ALUGUEL_FII' | 'RENDIMENTO_RF' | 'OUTRO';
  valorBrutoPorUnidade: number;
  quantidadeNaDataCom: number; // Quantidade de ativos que o usuário possuía na Data COM
  valorTotalBruto?: number; // Calculado: valorBrutoPorUnidade * quantidadeNaDataCom
  valorTotalLiquido?: number; // Considerar impostos para JCP, etc. (simplificado por agora)
  impostoRetido?: number; // Valor do imposto retido (ex: IR sobre JCP)
  observacao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProventoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/proventos'; // Ajustar URL da API do backend

  // Signals para o estado
  proventos = signal<Provento[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() { }

  // Buscar todos os proventos (com filtros opcionais)
  getProventos(filtros?: any): Observable<Provento[]> {
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

    return this.http.get<Provento[]>(this.apiUrl, { params }).pipe(
      tap(data => {
        // Calcular valores derivados no frontend se não vierem do backend
        const proventosCalculados = data.map(p => ({
          ...p,
          valorTotalBruto: p.valorBrutoPorUnidade * p.quantidadeNaDataCom,
          // Lógica de valor líquido e imposto pode ser mais complexa
          valorTotalLiquido: p.tipo === 'JCP' 
            ? (p.valorBrutoPorUnidade * p.quantidadeNaDataCom) * 0.85 // Exemplo de IR de 15% para JCP
            : (p.valorBrutoPorUnidade * p.quantidadeNaDataCom),
          impostoRetido: p.tipo === 'JCP' 
            ? (p.valorBrutoPorUnidade * p.quantidadeNaDataCom) * 0.15 // Exemplo de IR de 15% para JCP
            : 0,
        }));
        this.proventos.set(proventosCalculados);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao carregar proventos.');
        this.isLoading.set(false);
        console.error(err);
        return of([]);
      })
    );
  }

  // Buscar um provento específico pelo ID
  getProvento(id: string): Observable<Provento | null> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.get<Provento>(`${this.apiUrl}/${id}`).pipe(
      map(p => {
        const proventoCalculado = {
          ...p,
          valorTotalBruto: p.valorBrutoPorUnidade * p.quantidadeNaDataCom,
          valorTotalLiquido: p.tipo === 'JCP' 
            ? (p.valorBrutoPorUnidade * p.quantidadeNaDataCom) * 0.85 
            : (p.valorBrutoPorUnidade * p.quantidadeNaDataCom),
          impostoRetido: p.tipo === 'JCP' 
            ? (p.valorBrutoPorUnidade * p.quantidadeNaDataCom) * 0.15 
            : 0,
        };
        this.isLoading.set(false);
        return proventoCalculado;
      }),
      catchError(err => {
        this.error.set('Falha ao carregar o provento.');
        this.isLoading.set(false);
        console.error(err);
        return of(null);
      })
    );
  }

  // Adicionar novo provento
  createProvento(provento: Provento): Observable<Provento> {
    this.isLoading.set(true);
    return this.http.post<Provento>(this.apiUrl, provento).pipe(
      tap(novoProvento => {
        const proventoCalculado = {
          ...novoProvento,
          valorTotalBruto: novoProvento.valorBrutoPorUnidade * novoProvento.quantidadeNaDataCom,
          valorTotalLiquido: novoProvento.tipo === 'JCP' 
            ? (novoProvento.valorBrutoPorUnidade * novoProvento.quantidadeNaDataCom) * 0.85 
            : (novoProvento.valorBrutoPorUnidade * novoProvento.quantidadeNaDataCom),
          impostoRetido: novoProvento.tipo === 'JCP' 
            ? (novoProvento.valorBrutoPorUnidade * novoProvento.quantidadeNaDataCom) * 0.15 
            : 0,
        };
        this.proventos.update(atuais => [...atuais, proventoCalculado]);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao criar provento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }

  // Atualizar provento existente
  updateProvento(id: string, proventoData: Partial<Provento>): Observable<Provento> {
    this.isLoading.set(true);
    return this.http.put<Provento>(`${this.apiUrl}/${id}`, proventoData).pipe(
      tap(proventoAtualizado => {
        const calculado = {
          ...proventoAtualizado,
          valorTotalBruto: proventoAtualizado.valorBrutoPorUnidade * proventoAtualizado.quantidadeNaDataCom,
          valorTotalLiquido: proventoAtualizado.tipo === 'JCP' 
            ? (proventoAtualizado.valorBrutoPorUnidade * proventoAtualizado.quantidadeNaDataCom) * 0.85 
            : (proventoAtualizado.valorBrutoPorUnidade * proventoAtualizado.quantidadeNaDataCom),
          impostoRetido: proventoAtualizado.tipo === 'JCP' 
            ? (proventoAtualizado.valorBrutoPorUnidade * proventoAtualizado.quantidadeNaDataCom) * 0.15 
            : 0,
        };
        this.proventos.update(atuais => 
          atuais.map(p => p._id === id ? { ...p, ...calculado } : p)
        );
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao atualizar provento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }

  // Deletar provento
  deleteProvento(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.proventos.update(atuais => atuais.filter(p => p._id !== id));
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Falha ao deletar provento.');
        this.isLoading.set(false);
        console.error(err);
        throw err;
      })
    );
  }
}

