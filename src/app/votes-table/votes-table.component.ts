import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MarinadeService } from '../services/marinade.service';
import { Record, Votes } from '../models/votes';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SolblazeService } from '../services/solblaze.service';
import { ActivatedRoute } from '@angular/router';


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
  columnsToDisplay: string[] = ['Stake Amount', 'Validator', 'Direct Stake'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: any;
  loader: boolean = true;
  dataSource: any //= new MatTableDataSource(ELEMENT_DATA);
  snapshotCreatedAt: Date | any = null
  public stakeRatio: any = "";
  public totalDirectStake: number = 0
  constructor(
    private _liveAnnouncer: LiveAnnouncer,
     private _marinadeService: MarinadeService,
     private _solblazeService:SolblazeService,

     ) { }
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;

  public defaultPoolName = '';
  public queryURL: boolean = false;
  async ngAfterViewInit() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const pool = urlParams.get('pool')
    if(pool){
      this.defaultPoolName = pool
      this.queryURL = true;
    }else{
      this.defaultPoolName = 'marinade'
    }
   this.renderPoolData(this.defaultPoolName)
  }
  private async _handleVotes(votes: Votes, poolName: string){
    // const votes: Votes = await firstValueFrom(this._marinadeService.getVotes())
    const totalPoolSize = await firstValueFrom(this._marinadeService.getPoolSize());
    this.snapshotCreatedAt = votes.voteRecordsCreatedAt

    const totalDirectStake = votes.records.filter(record => record.amount).reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.amount),
      0
    );

    this.totalDirectStake = totalDirectStake;
    const extnedRecords: Record[] = votes.records.filter(record => record.amount).map(record => {
      let directStake;
      if(poolName === 'marinade'){
        directStake= this.calcMSOLVotePower(totalDirectStake, record.amount, totalPoolSize)
      }
      if(poolName === 'solblaze'){
        this.stakeRatio = votes.conversionRate
        directStake = record.amount * votes.conversionRate
      }
      return { ...record, amount: Number(record.amount),validatorName:record.validatorName, directStake }
    })
     
    const mergeAndEvaluate = this.mergeDuplicateVoteAccount(extnedRecords) .sort((a, b) => b['Stake Amount'] - a['Stake Amount'])
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
          // name: mergeDuplications[i].name,
          data: records.filter(s => s.validatorVoteAccount === validatorVoteAccount)
        }
      })
    const evaluteTotals = mergeDuplications.map(item => {
      const amount = item.data.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.amount),
        0
      );
      const directStake = item.data.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.directStake),
        0
      );
      return { 'Stake Amount': amount, 'Direct Stake': directStake, 'Validator': item.data[0].validatorName || item.data[0].validatorVoteAccount, breakDown: item.data }
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
  public calcMSOLVotePower(totalDirectStake: number, directStake: number, poolSize: number): number {
    console.log(totalDirectStake,directStake, poolSize)
    // how much % the DS control
    const voteControlPoolSize = 0.2;
    // how much SOL the votes control
    const totalControl = poolSize * voteControlPoolSize;
    // how much % each stake control out of the total ds
    const singleStakeControlInPercentage = directStake / totalDirectStake
    // how much total SOL the validator will recive 
    const totalSOLForTheValidator = singleStakeControlInPercentage * totalControl;
    this.stakeRatio = (totalSOLForTheValidator / directStake)
    // console.log(this.stakeRatio)
    return totalSOLForTheValidator
  }


  async searchByDate(ev:any){
    this.stakeRatio = "";
    const date = ev.value
    const votes: Votes = await firstValueFrom(this._marinadeService.getVotes(date))

    this._handleVotes(votes,'marinade')
  }

  public async renderPoolData(poolName: string){
    this.loader = true
    this.dataSource = []
    this.defaultPoolName = poolName
    if(poolName.toLowerCase() === 'marinade'){
      const votes: Votes = await firstValueFrom(this._marinadeService.getVotes())
      this._handleVotes(votes, 'marinade')
    }

    if(poolName.toLowerCase() === 'solblaze'){
      const votes: Votes = await firstValueFrom(this._solblazeService.getVotes())
      this._handleVotes(votes,'solblaze')
    }
  }
}
