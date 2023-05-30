import { Component, OnInit, OnDestroy } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { SearchService } from '../../../services/search.service';
import { QueryService } from '../../../services/query.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';

import { UserService } from "../../../services/user.service";
import { Banner } from '../../../interfaces/banner';

interface getBannersList {
  banner: Banner[],
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
  selector: 'app-banner-list',
  templateUrl: './banner-list.component.html',
  styles: []
})
export class BannerListComponent implements OnInit {

  constructor(
    private _api: ApiService,
    public search: SearchService,
    private _notify: NotifyService,
    public query: QueryService,
    private userService: UserService
  ) { 
    this.getBannerList(1);
    this.search.set("bannerList", (terms: string): void => {
      this.filters.search = terms;
      this.getBannerList(1);
    });
  }

  public filters: Filters = {
    limit: 10,
    search: "",
    page: 1,
    sort: '',
    ...this.query.params()
  }

  ngOnInit() {
  }

  public banners: Banner[] = [];
  public publishedBanners: Banner[] = [];
  public totalPages: number = 1;
  public getBannerList(pageNumber: number = this.filters.page) {
    this.filters.page = pageNumber;
    this._api.set('banner/list', 'GET', {params: this.filters, id:'getBannerList'}, (res: getBannersList) => {
      this.banners = res.banner || [];
      this.publishedBanners = this.banners.filter(banner => banner.published == true);
      this.filters.page = res.page;
      this.totalPages = res.total_pages;
      this.query.set(this.filters);
    })
  }

  public deleteBanner(id){
    this._notify.confirm(Opr.Del, Ent.Banner, () => {
      this._api.set(`banner/delete${id}`, "DELETE", { id: "deleteBanner" }, (res: any): void => {
        this.getBannerList(1);
        this._notify.status(Opr.Del, Ent.Banner);
      });
    });
  }

  ngOnDestroy(){
    this._api.remove('getBannerList');
    this._api.remove('deleteBanner');
  }

}
