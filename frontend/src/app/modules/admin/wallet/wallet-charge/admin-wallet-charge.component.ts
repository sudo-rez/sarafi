import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';
import { QueryService } from '../../../../services/query.service';

import { ApiService } from '../../../../services/api.service';
import { Subject } from 'rxjs';
import { Wallet } from 'src/app/interfaces/wallet';
import { Brand } from 'src/app/interfaces/brand';

interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number
}

@Component({
  selector: 'admin-wallet-charge',
  templateUrl: './admin-wallet-charge.component.html',
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

export class AdminWalletChargeComponent implements OnInit {
  @Input() set open(wallet: Wallet) {    
    if (!wallet) return;
    this.wallet = wallet
    this._openModal();
  };
  @Input() set new(flag: boolean) {    
    if (!flag) return;
    this.newWallet = true
    this._openModal();
  };
  @Output() flag = new EventEmitter<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    public query: QueryService

  ) {
    this._migrateForm();
  }
  public newWallet : boolean = false
  public wallet :Wallet = null
  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "brand": [this.wallet?.brand, Validators.compose([Validators.required])],
      "amount": [, Validators.compose([Validators.required])],
      "currency": ["IRR", Validators.compose([Validators.required])],
    });
    if (this.newWallet) this.form.controls['amount'].setValue(0)
    
  }

  ngOnInit() { 
    
  }

  public modalState: 'invisible' | 'visible' = 'invisible';
  userPage = 1;
  userSearch = "";
  userTotalCount = 0;
  loadingUser = false;
  inputUser$ = new Subject<string>();

  
  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'created_at',
    ...this.query.params()
  }
  private _openModal(): void {
    this._migrateForm()
    this.getBrands();
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
    this.newWallet = false;
    this.flag.emit(true)

  }
  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
    this._api.set(`w/c`, "POST", {
      id: "walletCharge",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.wallet.charge").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  public brands: Array<Brand> = [];
  public getBrands(search: string = this.filters.search) {
    this._api.set("brand/l", "GET", { params: this.filters }, (res): void => {
      this.brands = res.result || [];
      this.filters.page = res.page;
      this.query.set(this.filters);
    });
  }
  private timeout_searchBrands?: number;
  public onSearchBrands(value: string) {
    window.clearTimeout(this.timeout_searchBrands);
    this.timeout_searchBrands = window.setTimeout(() => this.getBrands(value), 1000);
  }
  openBrands() {
    setTimeout(() => {
      if (this.userSearch) {
        this.userSearch = "";
        this.userPage = 1;
        this.getBrands();
      }
    }, 100);

  }

 
  ngOnDestroy() {
    this._api.remove('walletCharge');
  }
}
