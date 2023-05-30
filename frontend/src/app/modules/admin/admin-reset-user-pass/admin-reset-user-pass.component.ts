import { Component, OnInit, Input } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { User } from '../../../interfaces/user';

@Component({
  selector: 'admin-reset-user-pass',
  templateUrl: './admin-reset-user-pass.component.html',
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
export class AdminResetUserPassComponent implements OnInit {
  @Input() set user(user: User) {
    if (!user) return;
    this._userID = user._id;
    this._openModal();
  };

  private _userID: string;

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "password": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])],
      "confirm_password": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])],
    });
  }

  ngOnInit() { }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.form.reset();
    this.formSubmited = false;
  }

  public formSubmited: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmited = true;
    if (form.invalid) return;
    this._api.set(`user/cpa?id=${this._userID}`, "POST", {
      id: "resetUserPass",
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.reset-pass-success").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  ngOnDestroy() {
    this._api.remove('resetUserPass');
  }
}
