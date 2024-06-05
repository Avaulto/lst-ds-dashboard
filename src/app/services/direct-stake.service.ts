import { Injectable } from '@angular/core';
import { firstValueFrom, forkJoin, map, Observable, throwError } from 'rxjs';

import { catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { MarinadeTVL } from '../models/marinadeTVL';
import { MarinadeDS } from '../models/marinadeDirectStake';
import { Votes, Record } from '../models/votes';
import { SolblazeDS } from '../models/solblazeDirectStake';

@Injectable({
  providedIn: 'root',
})
export class DirectStakeService {
  protected solblazeSnapshotAPI: string =
    'https://stake.solblaze.org/api/v1/cls_boost';
  protected marinadeSnapshotAPI: string =
    'https://snapshots-api.marinade.finance/v1';
  protected stakeWizApi: string = 'https://api.stakewiz.com/validators';
  constructor(private apiService: ApiService) { }
  protected marinadeAPI: string = 'https://api.marinade.finance';

  private _formatErrors(error: any) {
    console.warn(error);
    return throwError(() => error);
  }

  private getPreviousDay(date = new Date()) {
    const previous = new Date(date.getTime());
    previous.setDate(date.getDate() - 1);

    return this.formatDate(previous);
  }

  private formatDate(date: Date) {
    function padTo2Digits(num: any) {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date: Date) {
      return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-');
    }
    return formatDate(date)
  }
  public getVotes(pool: string, date: string = ''): Observable<{ directStake: Votes, voteStake: Votes, directStakeRatio: number, voteStakeRatio: number, totalPoolSize: number }> {
    let dataSet: any;
    console.log(pool)
    if (pool === 'marinade') {
      dataSet = this.marinadeDS(date)
    }
    if (pool === 'the-vault') {
      console.log('fetch vsol');
      
      dataSet = this.vSOLDS(date)
    }
    if (pool === 'solblaze') {
      dataSet = this.solblazeDS()
    }
    return dataSet
  }
  private createVotesArr(snapshot: MarinadeDS, validators: any, ratio: number, source: 'SOL' | 'MNDE' | 'BLZE', convertRatio?: number): Votes {


    let records = snapshot.records.filter(r => r.amount).map(record => {

      const findValidatorName = validators.find((v: any) => v.vote_identity == record.validatorVoteAccount)?.name || '';

      const amount = convertRatio ? Number(record.amount) * convertRatio : record.amount
      const directStake = amount * ratio
      // console.log(record.tokenOwner, amount, amount * ratio)
      return { ...record, validatorName: findValidatorName, amount, directStake, source }
    })
    let votes: Votes = {
      snapshotCreatedAt: null,
      records,
      voteRecordsCreatedAt: snapshot.voteRecordsCreatedAt,
      // snapshots: null // only on ranges query
    }
    return votes
  }
  private marinadeDS(date: string) {
    let searchBy = ''
    if (date) {
      const selectedDate = this.formatDate(new Date(date))// .toISOString().split("T")[0]
      const oneDayAgo = this.getPreviousDay(new Date(date))
      searchBy = `all?startDate=${oneDayAgo}&endDate=${selectedDate}`
    } else {
      searchBy = 'latest'
    }



    return forkJoin({
      directStakeSnapshot: this.apiService.get(`${this.marinadeSnapshotAPI}/votes/msol/${searchBy}`),
      voteStakeSnapshot: this.apiService.get(`${this.marinadeSnapshotAPI}/votes/vemnde/${searchBy}`)
    }).pipe(
      switchMap(async (snapshot: { directStakeSnapshot: MarinadeDS, voteStakeSnapshot: MarinadeDS }) => {

        let snapshotDSPointer;
        let snapshotVotesPointer;
        if (date) {
          snapshotDSPointer = snapshot.directStakeSnapshot.snapshots[0] as MarinadeDS
          snapshotVotesPointer = snapshot.voteStakeSnapshot.snapshots[0] as MarinadeDS
        } else {
          snapshotDSPointer = snapshot.directStakeSnapshot
          snapshotVotesPointer = snapshot.voteStakeSnapshot
        }
        const totalPoolSize = await firstValueFrom(this.getPoolSize());
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        const msolPrice = await firstValueFrom(this.apiService.get(`${this.marinadeAPI}/msol/price_sol`))
        const voteStakeRatio = await (await firstValueFrom(this.apiService.get('https://native-staking-referral.marinade.finance/v1/rewards/all/season-2?pubkey=7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh'))).governor.latestSolPerDirectedVemnde
        const directStakeRatio = await this.calcRatio(totalPoolSize * 0.2, snapshotDSPointer, msolPrice);
        const voteStake = this.createVotesArr(snapshotVotesPointer, validators, voteStakeRatio, 'MNDE')
        const directStake = this.createVotesArr(snapshotDSPointer, validators, directStakeRatio, 'SOL', msolPrice)
        // console.log(directStake, voteStake, directStakeRatio, voteStakeRatio, totalPoolSize)
        return { directStake, voteStake, directStakeRatio, voteStakeRatio, totalPoolSize };
      }),
      catchError((error) => this._formatErrors(error))
    );
  }
  vSOLDS(date: string){
    const getDate = date ? this.getPreviousDay(new Date(date)) : null
    return forkJoin({
      directStakeSnapshot: this.apiService.get(`https://api.solanahub.app/api/vSOL/get-vSOL-direct-stake?date=${getDate}`),
    }).pipe(
      switchMap(async (snapshot: any) => {
        console.log(snapshot);
        
        let snapshotDSPointer;
        let snapshotVotesPointer;
        if (date) {
          snapshotDSPointer = snapshot.directStakeSnapshot.snapshots[0] as MarinadeDS
          snapshotVotesPointer = snapshot.voteStakeSnapshot.snapshots[0] as MarinadeDS
        } else {
          snapshotDSPointer = snapshot.directStakeSnapshot
          snapshotVotesPointer = snapshot.voteStakeSnapshot
        }
        const totalPoolSize = 123
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        const vsolPrice = 1
        const directStakeRatio = 1
        const directStake = this.createVotesArr(snapshotDSPointer, validators, directStakeRatio, 'SOL', vsolPrice)
        // console.log(directStake, voteStake, directStakeRatio, voteStakeRatio, totalPoolSize)
        return { directStake, voteStake: {}, directStakeRatio, voteStakeRatio: 0, totalPoolSize };
      }),
      catchError((error) => this._formatErrors(error))
    );
  }
  solblazeDS(): Observable<{ directStake: Votes, voteStake: Votes, directStakeRatio: number, voteStakeRatio: number, totalPoolSize: number }> {
    return this.apiService.get(`${this.solblazeSnapshotAPI}`).pipe(
      switchMap(async (snapshot: SolblazeDS) => {
        const bsolPrice = await (await fetch(`https://stake.solblaze.org/api/v1/conversion`)).json()
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        let records: Record[] = []
        Object.keys(snapshot.applied_stakes).map((r, i) => {
          let re = Object.keys(snapshot.applied_stakes[r]).map((v, i) => {

            const validatorVoteAccount = r as any; // Object.keys(snapshot.applied_stakes) as any;
            const tokenOwner = Object.keys(snapshot.applied_stakes[r])[i] as any;
            const amount: number = snapshot.applied_stakes[r][tokenOwner as any] * bsolPrice.conversion.bsol_to_sol;
            const validatorName = validators.find((v: any) => v.vote_identity == validatorVoteAccount)?.name || ''

            const directStake = amount * snapshot.boost.conversion
            let record: Record = {
              amount,
              tokenOwner,
              validatorName,
              validatorVoteAccount,
              directStake,
              source: 'SOL'
            }
            records.push(record)
            return record;
          })
          // console.log(re)
        })
        // const aggigateVote = this.createVotesArr(records)
        let votes: Votes = {
          snapshotCreatedAt: null,
          records,
          voteRecordsCreatedAt: '0',
          conversionRate: snapshot.boost.conversion,
          // snapshots: null // only on ranges query
        }
        // return votes
        return { directStake: votes, voteStake: {} as Votes, directStakeRatio: snapshot.boost.conversion, voteStakeRatio: 0, totalPoolSize: snapshot.boost.pool };

      }),
      map((data) => {
        return data;
      }),
      // catchError((error) => this._formatErrors(error))
    );
  }
  private async calcRatio(SOL_total_allocated_stake: number, dataset: MarinadeDS, convertRatio: number = 1): Promise<number> {
    let stakeRatio = 0
    try {
      // remove empties
      const recordNoEmpty = dataset.records.filter((record: any) => record.amount)

      // accumulate all stake into total stake
      const totalDirectStake = recordNoEmpty.reduce(
        (accumulator: any, currentValue: any) => accumulator + Number(currentValue.amount * convertRatio),
        0
      );
      // take 1 example vote as pointer to "single share in the pool"
      const singleVote = Number(dataset.records.filter(record => record.amount * convertRatio)[0].amount)

      // how much % each stake control out of the total ds
      const singleVoteControlInPercentage = singleVote / totalDirectStake
      // how much total SOL the validator will recive 

      const totalVotesForTheValidator = singleVoteControlInPercentage * SOL_total_allocated_stake;
      stakeRatio = totalVotesForTheValidator / singleVote
    } catch (error) {
      console.error(error)
    }
    return stakeRatio
  }
  public getPoolSize(): Observable<number> {
    return this.apiService
      .get(`${this.marinadeAPI}/tlv`)
      .pipe(
        map((data: MarinadeTVL) => {
          return data.staked_sol + data.marinade_native_stake_sol;
        }),
        catchError((error) => this._formatErrors(error))
      );
  }

}
