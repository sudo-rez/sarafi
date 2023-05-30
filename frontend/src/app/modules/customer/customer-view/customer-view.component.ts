import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { QueryService } from '../../../services/query.service';
import { Customer } from '../../../interfaces/customer';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Province, City } from '../../../interfaces/province';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styles: []
})
export class CustomerViewComponent implements OnInit, OnDestroy {

  private _customerID: string = this._route.snapshot.params['customerID'];

  constructor(
    private _route: ActivatedRoute,
    private _api: ApiService,
    public query: QueryService,
    private _fb: FormBuilder,
  ) {
    this.getProvinces();
    this._getCustomer();
  }

  ngOnInit() { }

  public form: FormGroup = this._fb.group({
    "name": '',
    "user_code": '',
    "national_code": '',
    "phone": '',
    "mobile": '',
    "address": '',
    "province": '',
    "city": ''
  })

  public city: string = ''
  public customer: Partial<Customer> = {};
  public _getCustomer(): void {
    this._api.set(`customer/${this._customerID}`, "GET", { id: "getCustomer" }, (res: { customer: Customer }): void => {
      this.form.patchValue(res.customer);
      this.getCity(res.customer.province, res.customer.city);
    })
  }
  public provinces: Province[] = [];
  public getProvinces() {
    this._api.set("dropdown/provinces", "GET", { id: "getProvinces" }, (res: { provinces: Province[] }): void => {
      this.provinces = res.provinces;
      if (this._customerID)
        this._getCustomer();
    }, e => {
      if (this._customerID)
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
        this.form.get('city').patchValue(selectedCity);
      })
    }
  }

  ngOnDestroy() {
    this._api.remove("getCustomer");
    this._api.remove("getProvinces");
    this._api.remove("getCities")
  }
}
