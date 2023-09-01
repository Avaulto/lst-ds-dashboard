import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-vote-item',
  templateUrl: './vote-item.component.html',
  styleUrls: ['./vote-item.component.scss']
})
export class VoteItemComponent {
  @Input() voter: any = null
  @Input() poolSize = 0
  public addrUtil(addr: string): { addr: string , addrShort: string } {
    // @ts-ignore
   return { addr, addrShort: addr?.substring(0, 4) + '...' + addr.substring(addr.length - 4, addr.length[addr.length]) }
 }

 ngOnInit(): void {
  console.log(this.poolSize)
  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  //Add 'implements OnInit' to the class.
  // this.voter.walletOwner = this.addrUtil(this.voter.walletOwner).addrShort
 }
}
