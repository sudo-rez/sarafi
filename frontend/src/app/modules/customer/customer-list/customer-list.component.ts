import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

import { NgxSmartModalService } from 'ngx-smart-modal';
import { ApiService } from '../../../services/api.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { UserService } from '../../../services/user.service';
import { Customer } from '../../../interfaces/customer';
import { Province, City } from '../../../interfaces/province';

interface getCustomersResponse {
  count: number,
  customers: Customer[],
  page: number,
  total_pages: number
}
interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit: number
}
@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styles: []
})
export class CustomerListComponent implements OnInit, OnDestroy {
  public customerIDforEdit: string = "";
  public submitted: boolean = false;
  public isHidden: boolean = false;
  constructor(
    private _fb: FormBuilder,
    public ngxSmartModalService: NgxSmartModalService,
    private _api: ApiService,
    private _notify: NotifyService,
    private _userService: UserService,
    public search: SearchService,
    public query: QueryService,
  ) {
    this.getProvinces()
    this.getCustomers();
  }

  ngOnInit() { }

  public filters: Filters = {
    limit: this._userService.panelSetting && this._userService.panelSetting['table']['page_size'] || 10,
    search: "",
    page: 1,
    sort: '-created-at',
    ...this.query.params()
  }
  public searchForm: FormGroup = this._fb.group({
    "name": "",
    "user_code": "",
    "national_code": "",
    "phone": "",
    "mobile": "",
    "address": "",
    "province": "",
    "city": "",
  })

  public provinces: Province[] = [];
  public getProvinces() {
    this._api.set("dropdown/provinces", "GET", { id: "getProvinces" }, (res: { provinces: Province[] }): void => {
      this.provinces = res.provinces;
    });
  }

  public cities: City[] = [];
  public getCity(provinceID: string, selectedCity?: string): void {
    if (!provinceID) {
      return;
    } else {
      this._api.set("dropdown/cities/" + provinceID, "GET", { id: "getCities" }, (res: { cities: City[] }): void => {
        this.cities = res.cities;
        this.searchForm.get('city').patchValue(selectedCity);
      })
    }
  }

  public customers: Customer[] = [];
  public totalPages: number = 1;
  public getCustomers(pageNumber: number = this.filters.page) {
    this.filters.page = pageNumber;
    let search_fields = [];
    let search_keywords = [];
    for (const key in this.searchForm.controls) {
      if (this.searchForm.controls[key].value) {
        search_fields.push(key);
        search_keywords.push(this.searchForm.controls[key].value);
      }
    }
    let body = {
      "limit": +this.filters.limit,
      "page": +this.filters.page,
      "sort": this.filters.sort,
      search_fields,
      search_keywords,
    };

    this._api.set("customer/list", "POST", { id: "getCustomers", body }, (res: getCustomersResponse): void => {
      this.customers = res.customers;
      this.filters.page = res.page;
      this.totalPages = Math.ceil(res.count / 10);
      this.query.set(this.filters);
    });
  }

  public reset() {
    this.searchForm.reset();
    this.getCustomers(1);
  }

  public deleteCustomer(customerID: string): void {
    this._notify.confirm(Opr.Del, Ent.Customer, () => {
      this._api.set("customer/" + customerID, "DELETE", { id: "deleteCustomer" }, (res: any): void => {
        this.getCustomers(1);
        this._notify.status(Opr.Del, Ent.Customer);
      })
    })
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getCustomers(1);
  }

  public isOpenAccordion: boolean = false;
  public openForm() {
    this.isOpenAccordion = !this.isOpenAccordion;
  }

  public editStyle(): {} {
    if (this.isOpenAccordion) {
      return { 'max-height': '100%', 'opacity': 1, 'overflow': 'visible' };
    }
    else if (!this.isOpenAccordion) return {};
  }

  public passwordForm: FormGroup = this._fb.group({
    "password": ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    "confirm_password": ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]]
  })

  public open(customerID) {
    this.ngxSmartModalService.getModal('passModal').open();
    document.getElementById('errorText').textContent = "";
    this.passwordForm.reset();
    this.isHidden = false;
    this.submitted = false;
    this.customerIDforEdit = customerID;
  }

  public close() {
    this.ngxSmartModalService.getModal('passModal').close();
  }

  public resetPassForm() {
    let password = this.passwordForm.controls['password'].value;
    this.submitted = true;
    if (this.passwordForm.invalid) return;
    let confirm_password = this.passwordForm.controls['confirm_password'].value;
    if (password !== confirm_password) {
      document.getElementById('errorText').textContent = "پسوردهای وارد شده یکسان نیست!!!";
      document.getElementById('password').addEventListener("click", () => {
        document.getElementById('errorText').textContent = "";
      });
      document.getElementById('confirm_password').addEventListener("click", () => {
        document.getElementById('errorText').textContent = "";
      });
    } else {
      this._api.set(`customer/${this.customerIDforEdit}/password`, "POST", { body: this.passwordForm.value }, (res: any): void => {
        this.close();
        this._notify.status(Opr.Edit, Ent.Customer);
      })
    }
  }

  public showHide() {
    let inputConfirmPassword: any = document.getElementById('confirm_password');
    let inputPassword: any = document.getElementById('password');
    if (inputConfirmPassword.type === "password" && inputPassword.type === "password") {
      this.isHidden = true;
      inputConfirmPassword.type = "text";
      inputPassword.type = "text";
    } else {
      this.isHidden = false;
      inputConfirmPassword.type = "password";
      inputPassword.type = "password";
    }
  }

  public openNationalCodeModal(customer) {
    let customerID = customer.id;
    this.ngxSmartModalService.getModal('nationalCode').open();
    document.getElementById('errorText').textContent = "";
    this.nationalCodeForm.controls['national_code'].setValue(customer.national_code);
    this.customerIDforEdit = customerID;
  }
  nationalCodeForm: FormGroup = this._fb.group({
    "national_code": [""]
  })

  public resetNationalCode() {
    let national_code = this.nationalCodeForm.controls['national_code'].value;
    this.submitted = true;
    this._api.set(`customer/${this.customerIDforEdit}/code`, "POST", { body: this.nationalCodeForm.value }).subscribe(
      (res: Response) => {
        this.ngxSmartModalService.getModal('nationalCode').close();
        national_code = this.nationalCodeForm.controls['national_code'].setValue("");
        this.getCustomers(1);
        this._notify.status(Opr.Edit, Ent.Customer)
      }
    )
  }

  ngOnDestroy() {
    this.search.remove("customerList");
    this._api.remove("customer/list");
    this._api.remove("deleteCustomer");
    this._api.remove("getProvinces");
    this._api.remove("getCities");
  }
}
