import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MarinadeService } from '../services/marinade.service';
import { Record, Votes } from '../models/votes.model';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';


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
  columnsToDisplay: string[] = ['Stake Amount', 'Validator', 'Direct Stake'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: any;
  dataSource: any //= new MatTableDataSource(ELEMENT_DATA);
  snapshotCreatedAt: Date | any = null
  public stakeRatio: any = "";
  public totalDirectStake: number = 0
  constructor(private _liveAnnouncer: LiveAnnouncer, private _marinadeService: MarinadeService) { }
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;


  async ngAfterViewInit() {
    const votes: Votes = await firstValueFrom(this._marinadeService.getVotes())
    const totalPoolSize = await firstValueFrom(this._marinadeService.getPoolSize());
    this.snapshotCreatedAt = votes.voteRecordsCreatedAt

    const totalDirectStake = votes.records.filter(record => record.amount).reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.amount),
      0
    );
    this.totalDirectStake = totalDirectStake;
    const extnedRecords: Record[] = votes.records.filter(record => record.amount).map(record => {
      return { ...record, amount: Number(record.amount),validatorName:record.validatorName, directStake: this.calcVotePower(totalDirectStake, record.amount, totalPoolSize) }
    })
     
    const mergeAndEvaluate = this.mergeDuplicateVoteAccount(extnedRecords) .sort((a, b) => b['Stake Amount'] - a['Stake Amount'])
    this.dataSource = new MatTableDataSource(mergeAndEvaluate)
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
      console.log(mergeDuplications)
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
  public calcVotePower(totalDirectStake: number, directStake: number, poolSize: number): number {
    // how much % the DS control
    const voteControlPoolSize = 0.2;
    // how much SOL the votes control
    const totalControl = poolSize * voteControlPoolSize;
    // how much % each stake control out of the total ds
    const singleStakeControlInPercentage = directStake / totalDirectStake
    // how much total SOL the validator will recive 
    const totalSOLForTheValidator = singleStakeControlInPercentage * totalControl;
    this.stakeRatio = (totalSOLForTheValidator / directStake)
    // console.log(
    //   'total direct stake:', totalDirectStake,
    //   'total stake to distribute:', totalControl,
    //   'direct stake:', directStake,
    //   'percentage in the pool:', singleStakeControlInPercentage,
    //   'how much sol the vote control:', totalSOLForTheValidator)
    return totalSOLForTheValidator
  }
}
