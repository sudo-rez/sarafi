import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { NgxSmartModalService } from "ngx-smart-modal";
import { User } from '../../../interfaces/user';

interface getUsersResponse {
  stores: Array<User>,
  page: number,
  total_pages: number
}

interface Filters {
  search?: string,
  page: number,
  sort?: string,
  limit?: number
}

@Component({
  selector: 'app-admin-customer-list',
  templateUrl: './admin-customer-list.component.html',
  styles: []
})
export class AdminCustomerListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public ngxSmartModalService: NgxSmartModalService,
  ) {
    this.getUsers();
    search.set("adminUserList", (terms: string): void => {
      this.filters.search = terms;
      this.getUsers(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'fullname',
    ...this.query.params()
  }

  public toCalculateRowInTable: number = 0;
  public users: Array<User> = [];
  public totalPages: number = 1;
  public getUsers(pageNumber: number = this.filters.page) {
    this.filters.page = pageNumber;
    this._api.set("wemeto/control_user/list", "GET", { params: this.filters }, (res): void => {
      this.users = res.users;
      this.filters.page = res.page;
      this.toCalculateRowInTable = this.filters.page - 1 ;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getUsers(1);
  }

  ngOnInit() { }

  public userToResetPass: User = null;
  public resetPass(user: User): void {
    this.userToResetPass = user;
  }

  public cellphone: string;
  public selectCustomer(customer: User) {
    this.getSubscriptions();
    this.ngxSmartModalService.getModal('freeSubscription').open();
  }

  public subscriptions = [];
  public getSubscriptions() {
    this._api.set("wemeto/plan?published=true", "GET", { id: "getSubscriptions" }, (res: { subscription: [] }) => {
      if (res) {
        this.subscriptions = res.subscription;
      }
    });
  }

  public checkCheckbox = [];
  public subscriptionId: string;
  public selectedSubscription(event, id) {
    for (let i = 0; i < this.subscriptions.length; i++) {
      let allSubscriptionID = this.subscriptions[i].id;
      if (allSubscriptionID == id) {
        this.checkCheckbox[i] = true;
        this.subscriptionId = id;
      }
      else {
        this.checkCheckbox[i] = false;
      }
    }
  }

  public emptyCheckbox() {
    for (let i = 0; i < this.subscriptions.length; i++) {
      this.checkCheckbox[i] = false;
    }
  }

  public giveFreeSubscription() {
    this._api.set(`wemeto/buy/free/${this.subscriptionId}?phone=${this.cellphone}`, "GET", { id: "giveFreeSubscription" },
      (res) => {
        this.ngxSmartModalService.getModal('freeSubscription').close();
        this.emptyCheckbox();
      },
      (err) => {
        this.ngxSmartModalService.getModal('freeSubscription').close();
        this.emptyCheckbox();
      }
    )
  }

  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("wemeto/control_user/list");
    this._api.remove("giveFreeSubscription");
    this._api.remove("getSubscriptions");
  }
}