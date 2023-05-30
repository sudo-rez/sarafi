import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { Brand } from 'src/app/interfaces/brand';

interface getBrandsResponse {
  // TODO: Fix after api change
  result: Array<Brand>,
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
  selector: 'app-admin-brand-list',
  templateUrl: './admin-brand-list.component.html',
  styles: []
})

export class AdminBrandListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    public query: QueryService
  ) {
    this.getBrands();
    search.set("adminUserList", (terms: string): void => {
      this.filters.search = terms;
      this.getBrands(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: 'created_at',
    ...this.query.params()
  }

  public brands: Array<Brand> = [];
  public totalPages: number = 1;
  public getBrands(pageNumber: number = this.filters.page) {    
    this.filters.page = pageNumber;
    this._api.set("brand/l", "GET", { params: this.filters }, (res: getBrandsResponse): void => {
      this.brands = res.result || [];
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    });
  }

  public sort(key: string): void {
    this.filters.sort = this.filters.sort == key ? `-${key}` : key;
    this.getBrands(1);
  }

  ngOnInit() { }

  // public userToResetPass: User = null;
  public brandToDelete: Brand = null;
  public brandToEdit: Brand = null;
  public createBrandFlag : boolean = false
  // public resetPass(user: User): void {
  //   this.userToResetPass = user;
  // }
  public deleteBrand(brand: Brand): void {
    this.brandToDelete = brand;
  }
  public editBrand(brand: Brand): void {
    this.brandToEdit = brand;
  }
  public createBrand(flag:boolean): void {
    if (!flag) {
      this.getBrands();
    }
    this.createBrandFlag = flag;
  }
  public deleteBack(flag:boolean):void {
    if (flag){
      this.getBrands();
    }
    this.brandToDelete = null
  }
  public editBrandBack(flag:boolean):void {
    if (flag){
      this.getBrands();
    }
    this.brandToEdit = null
  }
  ngOnDestroy() {
    this.search.remove("adminUserList");
    this._api.remove("admin/list-users");
  }
}
