import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pools-menu',
  templateUrl: './pools-menu.component.html',
  styleUrls: ['./pools-menu.component.scss']
})
export class PoolsMenuComponent {
  @Output() onSelectPool: EventEmitter<string> = new EventEmitter();
  public selectedPool: string = 'marinade';

  public selectPool(poolName: string): void{
    this.selectedPool = poolName
    this.onSelectPool.emit(poolName)
    document.documentElement.setAttribute('data-theme', poolName)
  }
}
