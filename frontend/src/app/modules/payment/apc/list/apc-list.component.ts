import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../../services/api.service';
import { SearchService } from '../../../../services/search.service';
import { QueryService } from '../../../../services/query.service';
import { Txn } from 'src/app/interfaces/txn';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { APC } from 'src/app/interfaces/apc';

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
  selector: 'app-apc-list',
  templateUrl: './apc-list.component.html',
  styles: []
})

export class APCListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService :UserService,
    public _translate:TranslateService,
    private _notify: NotificationsService,

  ) {
    this.getAPCs();
    search.set("txnList", (terms: string): void => {
      this.filters.search = terms;
      this.getAPCs(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'created_at',
    ...this.query.params()
  }

  public datePickerConfig = {
    drops: 'down',
    format: 'jYYYY/jMM/jDD HH:mm'
}

  public apcs: Array<Txn> = [];
  public totalPages: number = 1;
  public getAPCs(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("brand/apc/l", "GET", { params: this.filters }, (res: getTxnsResponse): void => {
      this.apcs = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getAPCs(1);
  }
  public createAPCFlag:boolean = false
  public createAPC(flag) {
    if (flag)this.createAPCFlag = true
    else{
      this.getAPCs()
      this.createAPCFlag=false
    }
  }
  public apcToDelete:APC = null
  public deleteAPC(apc: APC): void {
    this.apcToDelete = apc;
  }
  public deleteBack(flag:boolean):void {
    if (flag){
      this.getAPCs();
    }
    this.apcToDelete = null
  }
  public apcToEdit:APC = null
  public editAPC(apc:APC) {
    this.apcToEdit = apc
  }
  public editBack(flag){
    if (flag) {
      this.apcToEdit = null
      this.getAPCs()
    }
  }
  public toggleActive(value:any){
    this._api.set("brand/apc/t?key=active&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.apc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        value.active = !value.active

      });
    });
  }
  public openConfirm : boolean = false
  private apcMarkToConfirm:any
  public apcNameToBlock:string = ""
  private apcFiledToToggle:string = ""
  public getConfirm(apc,field) {
    this.openConfirm = true
    this.apcMarkToConfirm = apc
    this.apcFiledToToggle = field
    this._translate.get("apc.name").subscribe(text =>{
      this.apcNameToBlock = text+": "+ apc.name
    })
  }
  public confirmResult(flag) {
   if (flag) {
    switch (this.apcFiledToToggle) {
      case "blocked":
        this.toggleBlocked(this.apcMarkToConfirm)
        break;
      case "confirmed":
        this.toggleConfirmed(this.apcMarkToConfirm)
        break;
      default:
        break;
    }
  }else{ 
  this.getAPCs()
  }
  this.apcMarkToConfirm = null
  this.openConfirm = false
  this.apcFiledToToggle=""
  }
  public toggleBlocked(value:any){
    this._api.set("brand/apc/t?key=blocked&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.apc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        this.getAPCs()
      });
    });
  }
  public toggleConfirmed(value:any){
    this._api.set("brand/apc/t?key=confirmed&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.apc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        this.getAPCs()
      });
    });
  }
  public toggleCurrent(value:any){
    this._api.set("brand/apc/t?key=current&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.apc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        value.current = !value.current
        this.getAPCs()
      });
    });
  }
  ngOnInit() { }

  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("txn/l");
  }
}
