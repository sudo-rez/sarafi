import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';

import {
  NotificationsService
} from 'angular2-notifications';
import {
  TranslateService
} from '@ngx-translate/core';
import {
  QueryService
} from '../../../../services/query.service';

import {
  ApiService
} from '../../../../services/api.service';




@Component({
  selector: 'apc-create',
  templateUrl: './apc-create.component.html',
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

export class APCCreateComponent implements OnInit {
  @Input() set open(flag: boolean) {
    if (!flag) return;
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

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "name": ["", Validators.compose([Validators.required])],
      "card_number": ["", Validators.compose([Validators.required, Validators.minLength(16), Validators.maxLength(16), this.isValidCard()])],
    });
  }

  ngOnInit() {
    this._migrateForm()
  }

  public modalState: 'invisible' | 'visible' = 'invisible';

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

    this._api.set(`brand/apc/c`, "POST", {
      id: "createAPC",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.apc.create").subscribe(text => {
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
    this._api.remove('createAPC');
  }
}