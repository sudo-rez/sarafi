import { Component, OnInit, Input } from '@angular/core';
import { Brand } from 'src/app/interfaces/brand';

import { UserService } from '../../services/user.service';
import { ApiService } from 'src/app/services/api.service';
import { Wallet } from 'src/app/interfaces/wallet';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: []
})
export class SidebarComponent implements OnInit {
  @Input() public navHeight: number = 0;

  constructor(
    public userService: UserService,
    public _api:ApiService
  ) { }

  public activeGroup: string = "root";

  public toggleGroup(group: string): void {
    this.activeGroup = this.activeGroup == group ? 'root' : group;
  }
  public brand : Brand = null
  public wallet :Wallet = null
  ngOnInit() {
    this.userService.updateUserBrand()
    this.getWallet()
   }
   public getWallet(){
    this._api.set("w/current","GET",{},(res)=>{
      this.wallet = res?.wallet
    })
   }


  public logout(event): void {
    event.preventDefault();
    this.userService.logout();
  }
}
