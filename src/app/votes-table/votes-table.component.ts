import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DirectStakeService } from '../services/direct-stake.service';
import { Record, Votes } from '../models/votes';
import { concat, firstValueFrom, lastValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
// @ts-nocheck

@Component({
  selector: 'votes-table',
  styleUrls: ['votes-table.component.scss'],
  templateUrl: 'votes-table.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class VotesTableComponent implements AfterViewInit {
  public today = new Date();
  public columnsToDisplay: string[] = ['Stake Amount', 'Validator', 'Total Stake'];
  public columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  public expandedElement: any;
  public loader: boolean = true;
  public dataSource: any //= new MatTableDataSource(ELEMENT_DATA);
  public snapshotCreatedAt: Date | any = null
  public dsGuideLink = {
    marinadeDocs:'https://docs.marinade.finance/marinade-products/directed-stake',
    marinadeCurrentStake:'https://solanabeach.io/address/4bZ6o3eUUNXhKuqjdCnCoPAoLgWiuLYixKaxoa8PpiKk/stakes',
    solblazeDocs:'https://stake-docs.solblaze.org/features/custom-liquid-staking',
    solblazeCurrentStake:'https://solanabeach.io/address/6WecYymEARvjG5ZyqkrVQ6YkhPfujNzWpSPwNKXHCbV2/stakes'
}
  public stakeRatio: number = 0
  public voteRatio: number = 0
  public totalDirectStake: number = 0
  public viewDirectStake: boolean = true
  public viewVoteStake: boolean = true
  public defaultPoolName = 'marinade';
  public poolIcon = ''
  public queryURL: boolean = false;
  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    private _directStakeService: DirectStakeService,


  ) { }
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;



  public dataToInclude() {

  }
  async ngAfterViewInit() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const pool = urlParams.get('pool')
    if (pool) {
      this.defaultPoolName = pool
      this.queryURL = true;
    } 
    this.renderPoolData(this.defaultPoolName)
    document.documentElement.setAttribute('data-theme', this.defaultPoolName)
  }

  private _handleVotes(votes: Votes) {
    // debugger
    this.loader = true
    // const votes: Votes = await firstValueFrom(this._directStakeService.getVotes())
    // const totalPoolSize = await firstValueFrom(this._directStakeService.getPoolSize());
    this.snapshotCreatedAt = votes.voteRecordsCreatedAt

    const totalDirectStake = votes.records.reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.directStake),
      0
    );
    this.totalDirectStake = totalDirectStake

    const mergeAndEvaluate = this.mergeDuplicateVoteAccount(votes.records).sort((a, b) => b['Total Stake'] - a['Total Stake'])
    this.dataSource = new MatTableDataSource(mergeAndEvaluate)
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.loader = false
  }

  private mergeDuplicateVoteAccount(records: Record[]) {
    const mergeDuplications = Array.from(new Set(records.map(s => s.validatorVoteAccount)))
      .map((validatorVoteAccount, i) => {
        return {
          validatorVoteAccount,
          data: records.filter(s => s.validatorVoteAccount === validatorVoteAccount)
        }
      })
    const evaluteTotals = mergeDuplications.map(item => {

      const totalDsAmount = item.data.filter(r => r.source === 'SOL').reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.amount),
        0
      );
      const totalVoteAmount = item.data.filter(r => r.source === 'MNDE').reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.amount),
        0
      );
      const voteAndStake = totalDsAmount + (totalVoteAmount * this.voteRatio)
      const directStake = item.data.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.directStake),
        0
      );

      return { 'Stake Amount': voteAndStake, 'Total Stake': directStake, 'Validator': item.data[0].validatorName || item.data[0].validatorVoteAccount, breakDown: item.data }
    })
    return evaluteTotals


  }
  /** Announce the change in sort state for assistive technology. */
  public announceSortChange(sortState: Sort | any): void {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

  }


  async searchByDate(ev: any) {
    this.stakeRatio = 0;
    this.loader = true
    const date = ev.value
    const votes: Votes = await (await firstValueFrom(this._directStakeService.getVotes(this.defaultPoolName, date))).directStake
    this._handleVotes(votes)
  }


  public stakeInfo:any = null
  public async renderPoolData(poolName: string) {
    this.stakeInfo = null
    this.dataSource = []
    this.defaultPoolName = poolName.toLowerCase()

    this.poolIcon = `assets/${this.defaultPoolName}-logo.png`
    this.stakeInfo = await firstValueFrom(this._directStakeService.getVotes(this.defaultPoolName))
    this.voteRatio = this.stakeInfo.voteStakeRatio
    this.stakeRatio = this.stakeInfo.directStakeRatio

    const allStake = [...this.stakeInfo.directStake.records];
    if(this.defaultPoolName === 'marinade'){
      allStake.push(...this.stakeInfo.voteStake.records)
    }
    const votes = {...this.stakeInfo.directStake}
    votes.records = allStake
    this._handleVotes(votes)
  }
  public reOrder(type: 'direct-stake' | 'votes', ev: any){
    if(type === 'direct-stake'){
      this.viewDirectStake = ev.checked
    }
    if(type === 'votes'){
      this.viewVoteStake = ev.checked
    }

    const allStake = [];
    this.viewDirectStake ? allStake.push( ...this.stakeInfo.directStake.records) : ''
    this.viewVoteStake ? allStake.push( ...this.stakeInfo.voteStake.records) : ''
    const votes = {...this.stakeInfo.directStake}
    votes.records = allStake

    this._handleVotes(votes)
  }
}
