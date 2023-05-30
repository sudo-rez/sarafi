import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer } from 'src/app/interfaces/customer';
import { ApiService } from '../../../services/api.service';
import { QueryService } from '../../../services/query.service';
import { Ent, NotifyService, Opr } from '../../../services/notify.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Province, City } from '../../../interfaces/province';

@Component({
  selector: 'app-create-customer',
  templateUrl: './create-customer.component.html',
  styles: [
  ]
})
export class CreateCustomerComponent implements OnInit {

  public customerID: string = this._route.snapshot.params['customerID'];
  public title: string = this.customerID ? "customer.edit.title" : "customer.create.title";
  private _submitUrl: string = "customer/save";
  public submitted: boolean = false;
  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _api: ApiService,
    private _notify: NotifyService,
    public query: QueryService,
  ) {
    this._migrateForm();
    this.getProvinces();
  }

  ngOnInit(): void {
  }

  public customerForm: FormGroup;
  private _migrateForm(): void {
    this.customerForm = this._fb.group({
      "name": ["", Validators.required],
      "user_code": [""],
      "national_code": [""],
      "phone": [""],
      "mobile": [""],
      "address": [""],
      "province": [""],
      "city": [""],
      "password": [""]
    })
  }

  public _getCustomer(): void {
    this._api.set(`customer/${this.customerID}`, "GET", { id: "getCustomer" }, (res: { customer: Customer }): void => {
      this.customerForm.patchValue(res.customer);
      this.getCity(res.customer.province, res.customer.city);
    })
  }

  public provinces: Province[] = [];
  public getProvinces() {
    this._api.set("dropdown/provinces", "GET", { id: "getProvinces" }, (res: { provinces: Province[] }): void => {
      this.provinces = res.provinces;
      if (this.customerID)
        this._getCustomer();
    }, e => {
      if (this.customerID)
        this._getCustomer();
    })
  }

  public cities: City[] = [];
  public getCity(provinceID: string, selectedCity?: string): void {
    if (!provinceID) {
      return;
    } else {
      this._api.set("dropdown/cities/" + provinceID, "GET", { id: "getCities" }, (res: { cities: City[] }): void => {
        this.cities = res.cities;
        this.customerForm.get('city').patchValue(selectedCity);
      })
    }
  }

  public save() {
    this.submitted = true;
    if (this.customerForm.invalid) return
    this._api.set(this._submitUrl, "POST", { body: { id: this.customerID, ...this.customerForm.value } }, (res: Customer): void => {
      this._notify.status(this.customerID ? Opr.Edit : Opr.Create,
        Ent.Customer);
      this._router.navigate(['/customer'], !this.customerID ? {} : { queryParams: this.query.params() });
    })
  }

  ngOnDestroy() {
    this._api.remove("getCustomer");
    this._api.remove("getProvinces");
    this._api.remove("getCities");
  }

}
