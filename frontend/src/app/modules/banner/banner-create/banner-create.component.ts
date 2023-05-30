import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ApiService } from '../../../services/api.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';
import { QueryService } from '../../../services/query.service';
import { Image } from '../../../interfaces/image';
import { Banner } from '../../../interfaces/banner';

@Component({
  selector: 'app-banner-create',
  templateUrl: './banner-create.component.html',
  styles: []
})
export class BannerCreateComponent implements OnInit, OnDestroy {

  private _bannerID: string = this._route.snapshot.params['id'] || "";
  public title: string = this._bannerID ? "banner.create.edit" : "banner.create.title";
  private _submit_method: 'PUT' | 'POST' = (this._bannerID) ? 'PUT' : 'POST';
  // public keywords: { id: string, name: string }[] = [
  //   { id: "banner1", name: "banner.create.banner1" },
  //   { id: "banner2", name: "banner.create.banner2" }
  // ];

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _api: ApiService,
    private _notify: NotifyService,
    public query: QueryService
  ) {
    this._migrateForm();
    if (this._bannerID) this.getBannerInfo()
  }

  ngOnInit() {
  }

  public form: FormGroup;
  private _migrateForm(): void {
    this.form = this._fb.group({
      //"image_id": ["",Validators.required],
      //"title": ["", ],
     //"is-published": false,
      //"desc": [""],
      //"link": ["",],
      //"keyword": ["",Validators.required],

      "image_path": ["",Validators.required],
      "image_path_mobile": "",
      "published": false,
      "titles": ["",Validators.required],
      "links": ["",Validators.required]
    });
  }

  public getBannerInfo() {
    this._api.set(`banner/${this._bannerID}`, 'GET', { id: "getBannerInfo" }, (res: { banner: Banner }) => {
      if (!res.banner.custom_data) {
        res.banner.custom_data = { alt: "", title: "" };
      }
      this.form.patchValue(res.banner);
      this._makeDefaultImages(res.banner.image);
    });
  }

  public defaultImages: Image[] = [];
  public setImages(event) {
    this.form.controls['image_path'].patchValue(event[0]);
  }

  private _makeDefaultImages(image): void {
    this.defaultImages = [{
      name: image.name_no_ext,
      original: image.original,
      thumb: image.thumb,
      micro: image.micro,
      big: image.big,
      mid: image.mid,
      id: image.id
    }]
  }

  public formSubmitted: boolean = false;
  public submit(form: FormGroup) {
    this.formSubmitted = true;
    if (form.invalid) return;
    this._api.set('banner/save', this._submit_method, {
      params: {
        id: this._bannerID 
      },
      body: this.form.value
    }, (res): void => {
      this._router.navigate(['/banner']);
      this._notify.status(this._bannerID ? Opr.Edit : Opr.Create, Ent.Banner);
    });
  }

  ngOnDestroy() {
    this._api.remove('banner/save')
    this._api.remove('getBannerInfo')
  }

}