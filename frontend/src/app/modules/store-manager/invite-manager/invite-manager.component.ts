import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

import { ApiService } from '../../../services/api.service';

import { CustomValidators } from '../../../validators/custom-validators';

@Component({
  selector: 'app-invite-manager',
  templateUrl: './invite-manager.component.html',
  styles: []
})
export class InviteManagerComponent implements OnInit, OnDestroy {

  constructor(
    private _fb: FormBuilder,
    private _api: ApiService
  ) {
    this._getPermissions();
  }

  form: FormGroup = this._fb.group({
    "email": ["", Validators.compose([Validators.required, Validators.pattern(CustomValidators.email)])],
    "permissions": []
  });

  public keys: Array<string> = [];
  public permissions: { [key: string]: boolean } = {};
  private _getPermissions() {
    this._api.set("management/permissions", "GET", {}, (res: { permissions: { [key: string]: number } }): void => {
      this.keys = Object.keys(res.permissions);
      for (const key of this.keys)
        this.permissions[key] = false;
    });
  }

  ngOnInit() {
    this.submit(this.form);
  }

  public changePermission(event, key: string): void {
    // TODO: Toggle all when FULL_ACCESS and reverse
  }

  public submit(form: FormGroup) {
    form.get('permissions').patchValue(
      !!this.permissions['FULL_ACCESS']
      ? ["FULL_ACCESS"]
      : this.keys.filter((key: string) => !!this.permissions[key])
    );
    this._api.set("management/invite", "POST", {
      body: form.value,
    }, (res: any): void => {
      // TODO: Notify "invitation email sent to the new manager"
      // TODO: Redirect to list
    }, (error: any): void => {
      // TODO: Errors handling
    });
  }

  ngOnDestroy() {
    this._api.remove("management/permissions");
    this._api.remove("management/invite");
  }
}
