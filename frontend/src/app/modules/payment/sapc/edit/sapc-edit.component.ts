import {Component,OnInit,Input,Output,EventEmitter} from '@angular/core';
import {trigger,state, style,animate,transition} from '@angular/animations';
import {FormBuilder,FormGroup,Validators,ValidatorFn,AbstractControl} from '@angular/forms';

import {NotificationsService} from 'angular2-notifications';
import {TranslateService} from '@ngx-translate/core';
import {QueryService} from '../../../../services/query.service';

import {ApiService} from '../../../../services/api.service';
import {SAPC } from 'src/app/interfaces/apc';




@Component({
  selector: 'sapc-edit',
  templateUrl: './sapc-edit.component.html',
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

export class SAPCEditComponent implements OnInit {
  @Input() set sapc(sapc: SAPC) {
    if (!sapc) return;
    this.sapcEdit = sapc
    this._openModal();
  };
  @Output() flag = new EventEmitter < boolean > ();

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    public query: QueryService

  ) {
    this._migrateForm();
  }
  public sapcEdit :SAPC = null
  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "_id":[this.sapcEdit?._id, Validators.compose([Validators.required])],
      "name": [this.sapcEdit?.name, Validators.compose([Validators.required])],
      "username": [this.sapcEdit?.username, Validators.compose([Validators.required])],
      "password": [this.sapcEdit?.password, Validators.compose([Validators.required])],
      "active": [this.sapcEdit?.active],
      "current": [this.sapcEdit?.current],
      "card_number": [this.sapcEdit?.card_number, Validators.compose([Validators.required, Validators.minLength(16), Validators.maxLength(16), this.isValidCard()])],
      "id":[this.sapcEdit?.id, Validators.compose([Validators.required])],
      "account_no":[this.sapcEdit?.account_no, Validators.compose([Validators.required])],
      "sheba_no":[this.sapcEdit?.sheba_no, Validators.compose([Validators.required])],
      "psp":[this.sapcEdit?.psp, Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
    this._migrateForm()
    this.getPsps()
  }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this._migrateForm();
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
    this.flag.emit(true)

  }


  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;

    this._api.set(`brand/sapc/u`, "POST", {
      id: "updateSAPC",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.sapc.update").subscribe(text => {
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

  public psps: Array<any> = [];
  public getPsps() {    
    this._api.set("brand/sapc/psp", "GET", {}, (res: any): void => {
      this.psps = res.result || [];
    });
  }
  public selectchange(args){ 
    this.form.get("psp").patchValue(args.target.options[args.target.selectedIndex].text)
  } 

  ngOnDestroy() {
    this._api.remove('updateSAPC');
  }
}