import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { Txn } from 'src/app/interfaces/txn';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Brand } from 'src/app/interfaces/brand';

interface getTxnsResponse {
  // TODO: Fix after api change
  result: Array<Txn>,
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
  selector: 'app-txn-list',
  templateUrl: './txn-list.component.html',
  styles: []
})

export class TxnListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService :UserService,
    private _fb: FormBuilder,
    public _translate:TranslateService,
    private _notify: NotificationsService,

  ) {
    this._migrateForm();
    this.getTxns();
    this.getBrands();
    search.set("txnList", (terms: string): void => {
      this.filters.search = terms;
      this.getTxns(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: '-created_at',
    ...this.query.params()
  }

  public datePickerConfig = {
    drops: 'down',
    format: 'jYYYY/jMM/jDD HH:mm'
}

  public txns: Array<Txn> = [];
  public totalPages: number = 1;
  public getTxns(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("txn/l", "GET", { params: this.filters }, (res: getTxnsResponse): void => {
      this.txns = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }
  public brands: Array<Brand> = [];
  public getBrands(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("brand/l", "GET", {}, (res: any): void => {
      this.brands = res.result || [];
    });
  }
  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getTxns(1);
  }
  public openAdvanceSearch:boolean = false
  public toggleAdvanceSearch() {
    this.openAdvanceSearch = !this.openAdvanceSearch
  }
  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "account": [""],
      "request_id": [""],
      "source": [""],
      "destination": [""],
      "amount_s": [0],
      "amount_e": [0],
      "created_at_s": [],
      "created_at_e": [],
      "brand": [""],
      "message": [""],
    });
  }
  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
    this._api.set(`txn/l`, "POST", {
      id: "advanceSearch",
      body: form.value,
      params: this.filters 
    }, (res: getTxnsResponse): void => {
      this.txns = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this._translate.get("notify.txn.filter").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
    });
  }
  ngOnInit() { }

  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("txn/l");
  }
}
