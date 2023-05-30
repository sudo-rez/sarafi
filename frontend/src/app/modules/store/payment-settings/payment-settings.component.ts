import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';

import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/user.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';

import { Store, WebgatesParams, Payment } from '../../../interfaces/store';

interface PaymentSettings extends WebgatesParams {
  "methods": Payment;
}

@Component({
  selector: 'store-payment-settings',
  templateUrl: './payment-settings.component.html',
  styles: []
})
export class PaymentSettingsComponent implements OnInit, OnDestroy {

  @Input() set paymentSettings(settings: PaymentSettings) {
    if (settings != null)
      this.form.patchValue(settings);
  }

  constructor(
    private _fb: FormBuilder,
    private _api: ApiService,
    private _notify: NotifyService,
    private _userService: UserService
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "methods": this._fb.group({
        "online_payment_is_active": false,
        "coordinatad_is_active": true
      }),
      "saman": this._fb.group({
        "merchant_id": ""
      }),
      "mellat": this._fb.group({
        "terminal_id": "",
        "username": "",
        "password": "",
        "description": ""
      }),
      "irankish": this._fb.group({
        "merchant_id": "",
        "description": ""
      })
    }, {
        validator: this._toggleRequireds
      });
  }

  public isFree: boolean 
  ngOnInit() {
    if (this.isFree)
      this.form.get('methods.online_payment_is_active').disable();
  }

  private _toggleRequireds(AC: AbstractControl): void {
    let onlinePayment: FormControl = <FormControl>AC.get("methods.online_payment_is_active");
    let saman: FormControl = <FormControl>AC.get("saman.merchant_id");
    let irankish: FormControl = <FormControl>AC.get("irankish.merchant_id");
    let mellat: FormControl = <FormControl>AC.get("mellat.terminal_id");
    let mellatUsername: FormControl = <FormControl>AC.get("mellat.username");
    let mellatPassword: FormControl = <FormControl>AC.get("mellat.password");

    if (!onlinePayment) return;

    if (onlinePayment.value && !saman.value && !irankish.value && !mellat.value) {
      saman.setErrors({ required: true });
      irankish.setErrors({ required: true });
      mellat.setErrors({ required: true });
    } else {
      saman.setErrors(null);
      irankish.setErrors(null);
      mellat.setErrors(null);
    }

    if (mellat.value) {
      if (!mellatUsername.value)
        mellatUsername.setErrors({ required: true });
      else
        mellatUsername.setErrors(null);

      if (!mellatPassword.value)
        mellatPassword.setErrors({ required: true });
      else
        mellatPassword.setErrors(null);
    }
  }

  public submit(form: FormGroup) {
    this._api.set("store/payment", "POST", {
      body: form.getRawValue()
    }, (res: { store: Store }): void => {
      this._notify.status(Opr.Edit, Ent.Store, res.store.name);
    });
  }

  ngOnDestroy() {
    this._api.remove("store/payment");
  }
}
