import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, catchError, firstValueFrom, map, switchMap, throwError } from 'rxjs';
import { Votes, Record } from '../models/votes';
import { SolblazeDS } from '../models/solblazeDirectStake';

@Injectable({
  providedIn: 'root'
})
export class SolblazeService {

  protected solblazeSnapshotAPI: string =
    'https://stake.solblaze.org/api/v1/cls_boost';
  protected stakeWizApi: string = 'https://api.stakewiz.com/validators';
  constructor(private apiService: ApiService) { }
  private _formatErrors(error: any) {
    console.warn(error);
    return throwError(() => error);
  }
  getVotes(): Observable<Votes> {
    return this.apiService.get(`${this.solblazeSnapshotAPI}`).pipe(
      switchMap(async (snapshot: SolblazeDS) => {
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        // console.log(validators)
        // let updateSnapshot = snapshot.map(record => {
        //   const findValidatorName = validators.find((v: any) => v.vote_identity == record.validatorVoteAccount).name
        //   return { ...record, validatorName: findValidatorName }
        // })
        let records: Record[] = []
        Object.keys(snapshot.applied_stakes).map((r, i) => {
         let re = Object.keys(snapshot.applied_stakes[r]).map((v,i) =>{

            const validatorVoteAccount = r  as any; // Object.keys(snapshot.applied_stakes) as any;
            const tokenOwner =  Object.keys(snapshot.applied_stakes[r])[i] as any;
            const amount: number = snapshot.applied_stakes[r][tokenOwner as any];
            const validatorName = validators.find((v: any) => v.vote_identity == validatorVoteAccount)?.name || ''
            let record: Record = {
              amount,
              tokenOwner,
              validatorName,
              validatorVoteAccount,
              
            }
            records.push(record)
            return record;
          })
          // console.log(re)
        })

        let votes: Votes = {
          snapshotCreatedAt: null,
          records,
          voteRecordsCreatedAt: '0',
          conversionRate: snapshot.boost.conversion,
          // snapshots: null // only on ranges query
        }
        return votes

      }),
      map((data) => {
        return data;
      }),
      // catchError((error) => this._formatErrors(error))
    );
  }
}
