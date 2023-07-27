import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, map, Observable, throwError } from 'rxjs';

import { catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Votes } from '../models/votes.model';
import { MarinadeTVL } from '../models/marinadeTVL.interface';

@Injectable({
  providedIn: 'root',
})
export class MarinadeService {
  protected marinadeSnapshotAPI: string =
    'https://snapshots-api.marinade.finance/v1';
    protected stakeWizApi: string = 'https://api.stakewiz.com/validators';
  constructor(private apiService: ApiService) {}
  protected marinadeAPI: string = 'https://api.marinade.finance';

  private _formatErrors(error: any) {
    console.warn(error);
    return throwError(() => error);
  }

  public getVotes(date?: string): Observable<Votes> {
    let searchBy = ''
    if(date){
      const selectedDate = new Date(date).toISOString().split("T")[0]
      const oneDayAgo = new Date(new Date().setDate(new Date(date).getDate() - 1)).toISOString().split("T")[0];
      searchBy = `all?startDate=${oneDayAgo}&endDate=${selectedDate}`
    }else{
      searchBy = 'latest'
    }
    return this.apiService.get(`${this.marinadeSnapshotAPI}/votes/msol/${searchBy}`).pipe(
      switchMap(async (snapshot:Votes) =>{
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        // console.log(validators)
        let pointer;
        if(date){
          pointer = snapshot.snapshots[0] as Votes
        }else{
          pointer = snapshot
        }
        let updateSnapshot = pointer.records.map(record => {
          const findValidatorName = validators.find((v:any) => v.vote_identity == record.validatorVoteAccount).name 
          return {...record, validatorName:findValidatorName}
        })
        return {...pointer,records:updateSnapshot}
      }),
      map((data) => {
        return data;
      }),
      catchError((error) => this._formatErrors(error))
    );
  }

  public getPoolSize(): Observable<number>{
    return this.apiService
      .get(`${this.marinadeAPI}/tlv`)
      .pipe(
        map((data: MarinadeTVL) => {
          return data.total_sol;
        }),
        catchError((error) => this._formatErrors(error))
      );
  }
}
