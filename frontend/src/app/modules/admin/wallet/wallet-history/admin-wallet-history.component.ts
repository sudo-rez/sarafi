import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../../services/api.service';
import { Wallet, WalletHistory } from 'src/app/interfaces/wallet';

interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number,
  wallet:string
}

@Component({
  selector: 'admin-wallet-history',
  templateUrl: './admin-wallet-history.component.html',
  styles: [],
  animations: [
    trigger('toggle-modal', [
      state('invisible', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('visible', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('invisible <=> visible', animate('100ms ease-in'))
    ])
  ]
})

export class AdminWalletHistoryComponent implements OnInit {
  @Input() set open(wallet: Wallet) {    
    if (!wallet) return;
    this.wallet = wallet
    this.filters.wallet = wallet._id
    this._openModal();
  };
  @Output() flag = new EventEmitter<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,

  ) {
  }
  public wallet :Wallet = null
  ngOnInit() { 
    
  }

  public modalState: 'invisible' | 'visible' = 'invisible';
  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: '-created_at',
    wallet:"",
  }
  private _openModal(): void {
    this.getWalletHistory();
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.flag.emit(true)

  }
  public histories: Array<WalletHistory> = [];
  public totalPages: number = 1;
  public getWalletHistory(pageNumber: number = this.filters.page){
    this.filters.page = pageNumber;
    this._api.set("w/h", "GET", { params: this.filters }, (res): void => {
      this.histories = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages
    });
  }
 
  ngOnDestroy() {
  }
}
