import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { Brand } from 'src/app/interfaces/brand';

@Component({
  selector: 'admin-brand-delete',
  templateUrl: './admin-brand-delete.component.html',
  styles: [],
  animations: [
    trigger('toggle-modal', [
      state('invisible', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('visible', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('invisible <=> visible', animate('100ms ease-in'))
    ])
  ]
})
export class AdminBrandDeleteComponent implements OnInit {
  @Input() set brand(brand: Brand) {
    if (!brand) return;
    this.brandInfo = brand
    this._openModal();
  };
  
  @Output() deleteFlag = new EventEmitter<boolean>();
  public brandInfo: Brand;

  constructor(
    private _fb: FormBuilder,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService
  ) {}



  ngOnInit() { }

  public modalState: 'invisible' | 'visible' = 'invisible';

  private _openModal(): void {
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
    this.deleteFlag.emit(true)
  }

  public formSubmited: boolean = false;
  public submit(): void {
    this._api.set(`brand/d?id=`+this.brandInfo._id, "DELETE", {
      id: "deleteBrand",
    }, (res: any): void => {
      this._translate.get("notify.brand.delete").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
      this.closeModal();
    });
  }

  ngOnDestroy() {
    this._api.remove('deleteBrand');
  }
}
