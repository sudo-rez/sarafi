import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { SearchService } from '../../services/search.service';
import { QueryService } from '../../services/query.service';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { BankPipe } from 'src/app/pipes/card.pipe';
import Editor  from 'src/static/vendor/ckeditor';
import { Setting } from 'src/app/interfaces/setting';
@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styles: []
})

export class SettingComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService :UserService,
    public _translate:TranslateService,
    private _notify: NotificationsService,
    private _bankpipe : BankPipe

  ) {
    this.getSetting();   
    this.banks = Object.assign({},this._bankpipe.BankList())
    this.allBanks = Object.assign({},this._bankpipe.BankList())
  } 
  public banks :any ={}
  public allBanks :any = {}
  public setting: Setting = {gateway:{blocked_banks:[],messages:"<ul></ul>",open_time:20,alg_duration:10}};
  public Editor = Editor;
  public editorConfig = {
    language :"fa",
  };
  public getSetting() {    
    this._api.set("setting", "GET", { }, (res: any): void => {
      this.setting = res.setting || null;
      if (this.setting?.gateway?.blocked_banks){
        this.setting?.gateway?.blocked_banks.forEach(element => {
          delete this.banks[element]
        });
      }

    });
  }

   public addBank(n) {
      this.setting?.gateway?.blocked_banks.push(n)  
      this.updateFirstMsg()
     delete this.banks[n]   
    }
  public removeBank(n){
    var index = this.setting?.gateway?.blocked_banks.indexOf(n)
    if (index > -1){
      this.setting?.gateway?.blocked_banks.splice(index,1)
    }
    this.banks[n] = this._bankpipe.BankList()[n]
    this.updateFirstMsg()
  }

  public updateFirstMsg() {
    var msg = this.setting?.gateway?.messages
     var index = msg.indexOf("<li>")
     var index2 = msg.indexOf("</li>")

     if (index < 0 && index2 < 0  ) this.setting.gateway.messages = "<ul><li>"+this.bankSeperator(this.setting?.gateway?.blocked_banks)+" موقتا غیرفعال می باشند، لطفا از کارت بانک های دیگری استفاده کنید </li></ul>"
     else {
      this.setting.gateway.messages = msg.slice(0,index)+"<li>"+this.bankSeperator(this.setting?.gateway?.blocked_banks)+" موقتا غیرفعال می باشند، لطفا از کارت بانک های دیگری استفاده کنید </li>"+msg.slice(index2)
      
     }
     
  }
  public bankSeperator(bs:Array<string>){
    if (bs){
      var translatedBanks =[]
      bs.forEach(element => {
          translatedBanks.push(this.allBanks[element][0])
      });
      return translatedBanks.join("، ")
    }
    return ""
  }

  public formSubmited: boolean = false;
  public submit(): void {
    this._api.set(`setting`, "POST", {
      id: "saveSetting",
      body: this.setting
    }, (res: any): void => {
      this._translate.get("notify.setting.save").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
    });
  }
  ngOnInit() { }

  ngOnDestroy() {
    this._api.remove("saveSetting");
  }
}
