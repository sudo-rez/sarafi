import { AbstractControl, ValidatorFn, ValidationErrors, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { ApiService } from '../services/api.service';

export class CustomValidators {

  static _api: ApiService;
  constructor(apiService: ApiService) {
    CustomValidators._api = apiService;
  }

  public domainCheck(control: FormControl): Observable<ValidationErrors | null> {
    let req: Observable<any> = <Observable<any>>CustomValidators._api.set("store/domain_check", "POST", {
      body: { name: control.value }
    });
    return req.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      map((res: { status: string }) => {
        return res.status == 'valid' ? null : { invalidDomain: true };
      })
    );
    // TODO: Handle multi requests
    // return Promise.resolve({ error: true } || null)
    // return new Promise((resolve, reject) => {});
  }

  static matchPasswords(AC: AbstractControl): void {
    let password: string = AC.get('password').value;
    let confirmPassword: string = AC.get('confirm_password').value;

    if (password != confirmPassword)
      AC.get('confirm_password').setErrors({ notmatch: true });
  }

  static number(params: { min?: number, max?: number } = {}): ValidatorFn {
    return (control: FormControl): ValidationErrors | null => {
      let val: number = control.value;

      if (isNaN(val) || val === null || /\D/.test(val.toString()))
        return { "number": true };

      if (!isNaN(params.min))
        return val < params.min ? { "lownumber": true } : null;

      if (!isNaN(params.max))
        return val > params.max ? { "bignumber": true } : null;

      return null;
    };
  }

  static email: RegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  static domain: RegExp = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/i;
  static cellphone: RegExp = /^09[0|1|2|3|9][0-9]{8}$/i;
  static numberOnly: RegExp = /^[0-9]*$/i;
}
