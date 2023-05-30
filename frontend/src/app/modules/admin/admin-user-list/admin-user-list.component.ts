import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { User } from '../../../interfaces/user';
import { UserService } from 'src/app/services/user.service';

interface getUsersResponse {
  // TODO: Fix after api change
  result: Array<User>,
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
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html',
  styles: []
})

export class AdminUserListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService,
    public userService:UserService,
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
    sort: 'created_at',
    ...this.query.params()
  }

  public users: Array<User> = [];
  public totalPages: number = 1;
  public getUsers(pageNumber: number = this.filters.page) {
    this.filters.page = pageNumber;
    this._api.set("user/l", "GET", { params: this.filters }, (res: getUsersResponse): void => {
      this.users = res.result || [];
      this.filters.page = res.page;
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
  public userToDelete: User = null;
  public userToPermission: User = null;
  public createUserFlag : boolean = false

  public resetPass(user: User): void {
    this.userToResetPass = user;
  }
 
  public createUser(flag:boolean): void {
    if (!flag) {
      this.getUsers();
    }
    this.createUserFlag = flag;
  }
  ///
  public deleteUser(user: User): void {
    this.userToDelete = user;
  }

  public deleteBack(flag:boolean):void {
    if (flag){
      this.getUsers();
    }
    this.userToDelete = null
  }
  // permission
  public createPermission(user: User): void {
    this.userToPermission = user;
  }
  public permissionBack(flag:boolean): void {
    if (flag){
      this.getUsers();
    }
    this.userToPermission = null
  }
  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("admin/list-users");
  }
}
