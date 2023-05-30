import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { CustomValidators } from '../../../validators/custom-validators';

import { UserService } from '../../../services/user.service';

@Component({
  selector: 'auth-login',
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {

  constructor(
    private _fb: FormBuilder,
    private _userService: UserService
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "username": ["", Validators.compose([Validators.required])],
      "password": ["", Validators.compose([Validators.required, Validators.minLength(4), Validators.maxLength(12)])],
      "usercode": ["", Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(12)])]
    });
  }

  ngOnInit() { }

  public submit(values: any) {
    this._userService.login(values);
  }

  ngOnDestroy() { }
}
