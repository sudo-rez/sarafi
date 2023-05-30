import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../../services/api.service';
import { SearchService } from '../../../../services/search.service';
import { QueryService } from '../../../../services/query.service';
import { Wallet } from 'src/app/interfaces/wallet';

interface getWalletListResponse {
  result: Array<Wallet>,
  page: number,
  total_pages: number
}

interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number
}

@Component({
  selector: 'app-admin-wallet-list',
  templateUrl: './admin-wallet-list.component.html',
  styles: []
})

export class AdminWalletListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService
  ) {
    this.getWallets();
    search.set("walletList", (terms: string): void => {
      this.filters.search = terms;
      this.getWallets(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'created_at',
    ...this.query.params()
  }

  public wallets: Array<Wallet> = [];
  public totalPages: number = 1;
  public getWallets(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("w/l", "GET", { params: this.filters }, (res: getWalletListResponse): void => {
      this.wallets = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getWallets(1);
  }
  public walletToCharge :Wallet = null
  public chargeWallet(wallet:Wallet){
    this.walletToCharge = wallet
  }
  public chargeBack(flag ){
    if (flag) {
      this.walletToCharge = null
      this.newWalletCreate = false
      this.getWallets()
    }
  }
  public newWalletCreate = false
  public newWallet(flag){
    if (flag)this.newWalletCreate = true
  }
  public walletToHistory :Wallet = null
  public walletHistory(wallet:Wallet){
    this.walletToHistory = wallet
  }
  public historyBack(flag ){
    if (flag) {
      this.walletToHistory = null
    }
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.search.remove("walletList");
    this._api.remove("w/l");
  }
}
