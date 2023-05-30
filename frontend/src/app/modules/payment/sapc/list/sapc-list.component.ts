import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../../services/api.service';
import { SearchService } from '../../../../services/search.service';
import { QueryService } from '../../../../services/query.service';
import { Txn } from 'src/app/interfaces/txn';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { SAPC } from 'src/app/interfaces/apc';



interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number
}

@Component({
  selector: 'app-sapc-list',
  templateUrl: './sapc-list.component.html',
  styles: []
})

export class SAPCListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService :UserService,
    public _translate:TranslateService,
    private _notify: NotificationsService,

  ) {
    this.getSAPCs();
    search.set("txnList", (terms: string): void => {
      this.filters.search = terms;
      this.getSAPCs(1);
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

  public sapcs: Array<Txn> = [];
  public totalPages: number = 1;
  public getSAPCs(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("brand/sapc/l", "GET", { params: this.filters }, (res: any): void => {
      this.sapcs = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getSAPCs(1);
  }
  public createSAPCFlag:boolean = false
  public createSAPC(flag) {
    if (flag)this.createSAPCFlag = true
    else{
      this.getSAPCs()
      this.createSAPCFlag=false
    }
  }
  public sapcToDelete:SAPC = null
  public deleteSAPC(sapc: SAPC): void {
    this.sapcToDelete = sapc;
  }
  public deleteBack(flag:boolean):void {
    if (flag){
      this.getSAPCs();
    }
    this.sapcToDelete = null
  }
  public sapcToEdit:SAPC = null
  public editSAPC(sapc:SAPC) {
    this.sapcToEdit = sapc
  }
  public editBack(flag){
    if (flag) {
      this.sapcToEdit = null
      this.getSAPCs()
    }
  }
  public toggleActive(value:any){
    
    this._api.set("brand/sapc/t?key=active&id="+value._id, "GET", { params: this.filters }, (res: any): void => {
      value.active = !value.active
      this._translate.get("notify.sapc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
    });
  }
  public toggleCurrent(value:any){
    this._api.set("brand/sapc/t?key=current&id="+value._id, "GET", { params: this.filters }, (): void => {
      value.current = !value.current
      this._translate.get("notify.sapc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        this.getSAPCs()
      });
    });
  }
  public openConfirm : boolean = false
  private apcMarkToConfirm:any
  public sapcNameToBlock:string = ""
  private sapcFiledToToggle:string = ""

  public getConfirm(sapc,field) {
    this.openConfirm = true
    this.apcMarkToConfirm = sapc
    this.sapcFiledToToggle = field
    this._translate.get("sapc.name").subscribe(text =>{
      this.sapcNameToBlock = text+": "+ sapc.name
    })
  }
  public confirmResult(flag) {
    if (flag) {
      switch (this.sapcFiledToToggle) {
        case "blocked":
          this.toggleBlocked(this.apcMarkToConfirm)
          break;
        case "confirmed":
          this.toggleConfirmed(this.apcMarkToConfirm)
          break;
        default:
          break;
      }
    } else{
  this.getSAPCs()}
  this.apcMarkToConfirm = null
  this.openConfirm = false
  }
  public toggleBlocked(value:any){
    this._api.set("brand/sapc/t?key=blocked&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.sapc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        this.getSAPCs()
      });
    });
  }
  public toggleConfirmed(value:any){
    this._api.set("brand/sapc/t?key=confirmed&id="+value._id, "GET", { params: this.filters }, (): void => {
      this._translate.get("notify.sapc.update").subscribe(text => {
        this._notify.success(text.title, text.message);
        this.getSAPCs()
      });
    });
  }
  ngOnInit() { }

  ngOnDestroy() {
  }
}
