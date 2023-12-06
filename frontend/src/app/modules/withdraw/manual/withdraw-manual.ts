import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray,  Validators,
  ValidatorFn, AbstractControl} from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';
import { QueryService } from '../../../services/query.service';

import { ApiService } from '../../../services/api.service';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from '../../../interfaces/user';
import { Subject } from 'rxjs';

interface getUsersResponse {
  result: Array<User>,
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
  selector: 'withdraw-manual',
  templateUrl: './withdraw-manual.html',
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

export class WithdrawManual implements OnInit {
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
    public query: QueryService

  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "amount": [, Validators.compose([Validators.required])],
      "card": ["", Validators.compose([Validators.required, Validators.minLength(16), Validators.maxLength(16), this.isValidCard()])],
      "account": ["",],
      "name": ["",],
    });
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
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
    this.flag.emit(false)

  }
  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
  
    this._api.set(`txn/wdcreateManual(true)createManual(true)/m`, "POST", {
      id: "manualPayment",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.withdraw.manual").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }
  public isValidCard(): ValidatorFn {
    return (currentControl: AbstractControl): {[key: string]: any} => {
      var card = currentControl.value
      var res = 0
      for (let i = 0; i < card?.length; i++) {
        if ((i + 1) % 2 == 0) {
          res = res + ~~card[i]
        } else {
          var mul = (~~card[i] * 2)
          if (mul > 9) mul = mul - 9
          res = res + mul
        }
      }
      return res%10==0?null:{"wrongCard":true}
    }
  }

  ngOnDestroy() {
    this._api.remove('createBrand');
  }
}
