import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { Brand } from 'src/app/interfaces/brand';
import { UserService } from 'src/app/services/user.service';

interface getFeaturesResponse {
  result: Array<string>,
}
@Component({
  selector: 'admin-user-create',
  templateUrl: './admin-user-create.component.html',
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
export class AdminUserCreateComponent implements OnInit {
  @Input() set open(flag: boolean) {
    if (!flag) return;
    this._openModal();
  };
  @Output() flag = new EventEmitter<boolean>();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    public userService:UserService
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "username": ["", Validators.compose([Validators.required])],
      "password": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])],
      "brand":[""],
      "brand_name":[""]
    });
  }

  ngOnInit() {
   }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this.modalState = 'visible';
    if (this.userService.isAdmin()) this.getBrands()
  }
  

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
    this.flag.emit(false)

  }

  public brandName : string = "" 
  public selectchange(args){ 
    this.brandName = args.target.options[args.target.selectedIndex].text; 
  } 
  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
    form.controls["brand_name"].setValue(this.brandName)
    this._api.set(`user/c`, "POST", {
      id: "createUser",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.user.create").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  public brands: Array<Brand> = [];
  public getBrands() {    
    this._api.set("brand/l", "GET", {}, (res: any): void => {
      this.brands = res.result || [];
    });
  }
  ngOnDestroy() {
    this._api.remove('createUser');
  }
}
