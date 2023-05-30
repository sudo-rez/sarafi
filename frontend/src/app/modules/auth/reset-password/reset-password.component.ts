import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { CustomValidators } from '../../../validators/custom-validators';

import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from 'angular2-notifications';

import { ApiService } from '../../../services/api.service';
import {HttpParams} from "@angular/common/http";

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styles: []
})
export class ResetPasswordComponent implements OnInit {

  constructor(
    private _router: Router,
    private _fb: FormBuilder,
    private _translate: TranslateService,
    private _notify: NotificationsService,
    private _api: ApiService
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "old_password": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])],
      "password": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])],
      "confirm_password": "",
    }, {
        validator: CustomValidators.matchPasswords
      });
  }

  ngOnInit() { }

  public passInputType: "password" | "text" = "password";
  public togglePasswordVisibility(): void {
    this.passInputType = this.passInputType == "password" ? "text" : "password";
  }

  public formSubmitted: boolean = false;
  public submit(form: FormGroup): void {
    this.formSubmitted = true;
    if (form.invalid) return;
    this._api.set("user/cp", "POST", {
      body: form.value
    }, (res: any): void => {
      this._translate.get("notify.reset-pass-success").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this._router.navigate(['/main']);
    });
  }

  ngOnDestroy() {
    this._api.remove('auth/change-password');
  }
}
