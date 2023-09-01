import { Injectable } from '@angular/core';
import { firstValueFrom, forkJoin, map, Observable, throwError } from 'rxjs';

import { catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { MarinadeTVL } from '../models/marinadeTVL';
import { MarinadeDS } from '../models/marinadeDirectStake';
import { Votes } from '../models/votes';

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

  private formatDate(date: Date){
    function padTo2Digits(num:any) {
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
  public getVotes(pool: string,date?: string):Observable<{ directStake:Votes,voteStake:Votes,  directStakeRatio:number, voteStakeRatio:number,totalPoolSize: number}>{
    let searchBy = ''
    if (date) {
      const selectedDate = this.formatDate(new Date(date))// .toISOString().split("T")[0]
      const oneDayAgo = this.getPreviousDay(new Date(date))
      console.log(date,  selectedDate, oneDayAgo)
      searchBy = `all?startDate=${oneDayAgo}&endDate=${selectedDate}`
    } else {
      searchBy = 'latest'
    }

    const createVotesArr = (snapshot: MarinadeDS, validators: any, ratio: number, source: 'SOL' | 'MNDE', msolPrice?: number): Votes => {
      let pointer;

      if (date) {
        pointer = snapshot.snapshots[0] as MarinadeDS
      } else {
        pointer = snapshot
      }
      let updateSnapshot = pointer.records.filter(r =>r.amount).map(record => {
        const findValidatorName = validators.find((v: any) => v.vote_identity == record.validatorVoteAccount).name;
       
        const amount = msolPrice ? Number(record.amount) * msolPrice : record.amount
        const directStake = amount * ratio
        // console.log(record.tokenOwner, amount, amount * ratio)
        return { ...record, validatorName: findValidatorName, amount, directStake, source }
      })
      let votes: Votes = {
        snapshotCreatedAt: null,
        records: updateSnapshot,
        voteRecordsCreatedAt: pointer.voteRecordsCreatedAt,
        // snapshots: null // only on ranges query
      }
      return votes
    }
    let dataSet: {} = {}
    if(pool === 'marinade'){
      dataSet = {
        directStakeSnapshot: this.apiService.get(`${this.marinadeSnapshotAPI}/votes/msol/${searchBy}`),
        voteStakeSnapshot: this.apiService.get(`${this.marinadeSnapshotAPI}/votes/vemnde/${searchBy}`)
      }
    }else{
      dataSet = {
        directStakeSnapshot: this.apiService.get(`${this.solblazeSnapshotAPI}`)
      }
    }
    return forkJoin(dataSet).pipe(
      switchMap(async (snapshot: { directStakeSnapshot: MarinadeDS, voteStakeSnapshot: MarinadeDS }) => {
        const totalPoolSize = await firstValueFrom(this.getPoolSize());
        const validators = await firstValueFrom(this.apiService.get(this.stakeWizApi))
        const msolPrice = await firstValueFrom(this.apiService.get(`${this.marinadeAPI}/msol/price_sol`))
        const voteStakeRatio = await this.calcRatio(totalPoolSize, snapshot.voteStakeSnapshot)
        const directStakeRatio = await this.calcRatio(totalPoolSize, snapshot.directStakeSnapshot, msolPrice);
        const voteStake = createVotesArr(snapshot.voteStakeSnapshot, validators, voteStakeRatio, 'MNDE')
        const directStake = createVotesArr(snapshot.directStakeSnapshot, validators, directStakeRatio, 'SOL', msolPrice)
        // console.log(directStake, voteStake, directStakeRatio, voteStakeRatio, totalPoolSize)
        return {directStake, voteStake, directStakeRatio, voteStakeRatio , totalPoolSize};
      }),
      catchError((error) => this._formatErrors(error))
    );
  }


  private async calcRatio(stakePool: number, dataset: MarinadeDS, convertRatio: number = 1): Promise<number> {
    let stakeRatio = 0
    try {
      const mSOL_total_allocated_stake = stakePool * 0.2;
      console.log(mSOL_total_allocated_stake)
      const recordNoEmpty = dataset.records.filter((record: any) => record.amount)
      const totalDirectStake = recordNoEmpty.reduce(
        (accumulator: any, currentValue: any) => accumulator + Number(currentValue.amount * convertRatio),
        0
        );
        const singleVote = Number(dataset.records.filter(record => record.amount * convertRatio)[0].amount)

      // how much % each stake control out of the total ds
      const singleVoteControlInPercentage = singleVote / totalDirectStake
      // how much total SOL the validator will recive 

      const totalVotesForTheValidator = singleVoteControlInPercentage * mSOL_total_allocated_stake;
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
