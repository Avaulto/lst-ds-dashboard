import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Votes } from '../models/votes.model';

@Injectable({
  providedIn: 'root',
})
export class MarinadeService {
  protected marinadeSnapshotAPI: string =
    'https://snapshots-api.marinade.finance/v1';
  constructor(private apiService: ApiService) {}

  private _formatErrors(error: any) {
    console.warn(error);
    return throwError(() => error);
  }

  public getVotes(): Observable<Votes> {
    return this.apiService.get(`${this.marinadeSnapshotAPI}/votes/msol/latest`).pipe(
      map((data) => {
        return data;
      }),
      catchError((error) => this._formatErrors(error))
    );
  }

  public getMSOL_balance(pubkey: string): Observable<any> {
    return this.apiService
      .get(`${this.marinadeSnapshotAPI}/snapshot/latest/msol/${pubkey}`)
      .pipe(
        map((data) => {
          return data;
        }),
        catchError((error) => this._formatErrors(error))
      );
  }
}
