import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { SearchService } from '../../services/search.service';
import { QueryService } from '../../services/query.service';
import {  Withdraw } from 'src/app/interfaces/txn';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Brand } from 'src/app/interfaces/brand';

interface getWDResponse {
  // TODO: Fix after api change
  result: Array<Withdraw>,
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
  selector: 'app-wd',
  templateUrl: './withdraw.component.html',
  styles: []
})

export class WithdrawComponent implements OnInit {

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
    this.getWD(this.form);
    this.getBrands()
    search.set("txnList", (terms: string): void => {
      this.filters.search = terms;
      this.getWD(this.form);
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

  public txns: Array<Withdraw> = [];
  public totalPages: number = 1;

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getWD(this.form);
  }
  public openAdvanceSearch:boolean = false
  public toggleAdvanceSearch() {
    this.openAdvanceSearch = !this.openAdvanceSearch
  }
  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "account": [""],
      "card": [""],
      "amount_s": [0],
      "amount_e": [0],
      "created_at_s": [],
      "created_at_e": [],
      "brand": [""],
    });
  }
  public formSubmited: boolean = false;
  public getWD(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
    this._api.set(`txn/wd/l`, "POST", {
      id: "advanceSearch",
      body: form.value,
      params: this.filters 
    }, (res: getWDResponse): void => {
      this.txns = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
    });
  }
  public getWDPagination(pageNumber: number){
    this.filters.page = pageNumber
    this.getWD(this.form)
  }

  public brands: Array<Brand> = [];
  public getBrands(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("brand/l", "GET", {}, (res: any): void => {
      this.brands = res.result || [];
    });
  }
  public status(status){
    switch (status) {
      case 1:
        return "in queue"
      case 2:
        return "in progress"
      case 3:
        return "complete"
      case 4:
        return "canceled"
      case 5:
        return "manual complete"
      case 6:
        return "rejected"
    }
    return ""
  }
  public openConfirm:boolean = false
  public manualPayID:string = ""
  public rejectPayID:string = ""
  public manualPay(id) {
    this.openConfirm = true
    this.manualPayID = id
  }
  public rejectPay(id){
    this.openConfirm = true
    this.rejectPayID = id
  }
  public confirmResult(flag) {
    if (flag) {
      if (this.manualPayID != "") {
        this._api.set("txn/wd/mp/"+this.manualPayID, "GET", {}, (res: any): void => {
          this._translate.get("notify.operation-success").subscribe(text => {
            this._notify.success(text.title, text.message);
          });
          this.getWD(this.form)
        });
      }
      if (this.rejectPayID != "") {
        this._api.set("txn/wd/rj/"+this.rejectPayID, "GET", {}, (res: any): void => {
          this._translate.get("notify.operation-success").subscribe(text => {
            this._notify.success(text.title, text.message);
          });
          this.getWD(this.form)
        });
      }
    }
    this.openConfirm = false
    this.manualPayID = ""
  }
  manualOpen = false
  public createManual(flag:boolean): void {
    if (!flag) {
      this.getWD(this.form);
    }
    this.manualOpen = flag;
  }
  ngOnInit() { }

  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("txn/l");
  }
}
