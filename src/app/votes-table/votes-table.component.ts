import {LiveAnnouncer} from '@angular/cdk/a11y';
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MarinadeService } from '../services/marinade.service';
import { Votes } from '../models/votes.model';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];
/**
 * @title Table with sorting
 */
@Component({
  selector: 'votes-table',
  styleUrls: ['votes-table.component.scss'],
  templateUrl: 'votes-table.component.html',
})
export class VotesTableComponent implements AfterViewInit {
  displayedColumns: string[] = ['tokenOwner', 'amount', 'validatorVoteAccount','directStake'];
  dataSource: any //= new MatTableDataSource(ELEMENT_DATA);
  snapshotCreatedAt: Date | any= null
  constructor(private _liveAnnouncer: LiveAnnouncer, private _marinadeService:MarinadeService) {}
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;

 async ngAfterViewInit() {
   const votes:Votes = await firstValueFrom(this._marinadeService.getVotes())
   this.snapshotCreatedAt = new Date(votes.voteRecordsCreatedAt).toDateString()
   const totalPoolSize = await firstValueFrom(this._marinadeService.getPoolSize());

    const totalDirectStake =  votes.records.filter(record => record.amount).reduce(
      (accumulator, currentValue) => accumulator + Number(currentValue.amount),
      0
    );
   console.log(totalDirectStake)
   const control = votes.records.filter(record => record.amount).map(record => {
    return {...record, directStake: this.calcVotePower(totalDirectStake, record.amount, totalPoolSize).toFixed(2)}
   })
   this.dataSource = new MatTableDataSource(control)
   this.dataSource.paginator = this.paginator;
   this.dataSource.sort = this.sort;
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort | any) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

  }
  public stakeRatio: string ="";
  public calcVotePower(totalDirectStake: number, directStake: number, poolSize: number): number{
    // how much % the DS control
    const voteControlPoolSize = 0.2;
    // how much SOL the votes control
    const totalControl = poolSize * voteControlPoolSize;
    // how much % each stake control out of the total ds
    const singleStakeControlInPercentage = directStake / totalDirectStake 
    // how much total SOL the validator will recive 
    const totalSOLForTheValidator = singleStakeControlInPercentage * totalControl;
    this.stakeRatio = (totalSOLForTheValidator / directStake).toFixed(2)
    console.log(
      'total direct stake:', totalDirectStake, 
      'total stake to distribute:', totalControl,
      'direct stake:',directStake,
     'percentage in the pool:', singleStakeControlInPercentage,
     'how much sol the vote control:', totalSOLForTheValidator)
     return totalSOLForTheValidator
  }
}
