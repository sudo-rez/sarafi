import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { SearchService } from '../../services/search.service';
import { QueryService } from '../../services/query.service';
import {  Account, Pans } from 'src/app/interfaces/account';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Brand } from 'src/app/interfaces/brand';

interface getAccountResponse {
  // TODO: Fix after api change
  result: Array<Account>,
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
  selector: 'app-accounts',
  templateUrl: './account.component.html',
  styles: []
})

export class AccountComponents implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService :UserService,
    private _fb: FormBuilder,
    public _translate:TranslateService,
    private _notify: NotificationsService,

  ) {
    this.getAccounts();
    search.set("accountList", (terms: string): void => {
      this.filters.search = terms;
      this.getAccounts();
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: '-created_at',
    ...this.query.params()
  }

  public accounts: Array<Account> = [];
  public totalPages: number = 1;

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getAccounts();
  }
  public getAccountsByPage(page: number): void {
    this.filters.page = page;
    this.getAccounts();
  }
  public getAccounts(): void {
    this._api.set(`account`, "GET", {
      id: "advanceSearch",
      params: this.filters 
    }, (res: getAccountResponse): void => {
      this.accounts = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
    });
  }
  public pans(pans:Array<Pans>):string{
    return pans.map((pan:Pans)=>pan.card).join(", ");
  }
  public toggleSapcActive(account:Account):void{
    this._api.set(`account/toggle/sapc/`+account.id, "GET", {
      id: "sapc",
      params: {
        sapc_active: !account.sapc_active
      }
    }, (res: any): void => {
      account.sapc_active = !account.sapc_active;
      this._notify.success(this._translate.instant("notify.operation-success.title"), this._translate.instant("notify.operation-success.message"));
    });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("txn/l");
  }
}
