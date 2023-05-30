import { Injectable } from '@angular/core';
import { forkJoin } from "rxjs";

import { NotificationsService, NotificationType as Notify } from 'angular2-notifications';
export { Notify };
import { TranslateService } from '@ngx-translate/core';
import swal from 'sweetalert2';

export enum Opr {
  Create = "create",
  Add = "add",
  AddTo = "add-to",
  Edit = "edit",
  Select = "select",
  Del = "delete",
  BatchDel = "batch-delete",
  Remove = "remove",
  Swap = "swap",
  Rcal = "recalculate",
  Upload = "upload",
  Save = "save",
  Send = "sent",
  Confirm = "confirm",
  Decline = "decline"
}

export enum Ent {
  Store = "store",
  Domain = "domain",
  Theme = "theme",
  Slider = "slider",
  Content = "content",
  Product = "product",
  Customer = "customer",
  SProducts = "selected-products",
  PBundle = "products-bundle",
  Order = "order",
  Category = "category",
  Contact = "contact",
  Comment = "comment",
  Image = "image",
  PriceMaker = "price-maker",
  Variable = "variable",
  SVariables = "selected-variables",
  Form = "form",
  Menu = "menu",
  Plan = "plan",
  UserProfile = "user-profile",
  Manager = "manager",
  NSet = "notifications-settings",
  Selected_Area = "selected_area",
  Setting = "setting",
  Send_to_Mobile = "sent",
  Owner = "owner",
  Discount_code = "discount-code",
  Banner = "banner",
  Access = "access",
  Schedul = "schedul",
  Video = "video",
  Question = "question",
  Quiz = "quiz",
  Event = "event",
  Gift_discount = "gift-discount"
}

export enum SwlT {
  Success = "success",
  Warn = "warning",
  Error = "error",
  Info = "info",
  Question = "question",
}

@Injectable()
export class NotifyService {

  constructor(
    private _notify: NotificationsService,
    private _translate: TranslateService
  ) { }

  public status(
    operation: Opr,
    entity: Ent,
    name?: string,
    type: Notify = Notify.Success,
    textKey: string = "success"
  ): void {
    let operation$ = this._translate.get(`operation.${operation}`);
    let entity$ = this._translate.get(`entity.${entity}`);
    forkJoin([operation$, entity$]).subscribe(data1 => {
      const [operation, entity]: string[] = data1;
      let statusTitle$ = this._translate.get(`notify.${textKey}.title`, { operation: operation, entity: entity });
      let statusMessage$ = this._translate.get(`notify.${textKey}.message`, { operation: operation, name: name || entity });
      forkJoin([statusTitle$, statusMessage$]).subscribe(data2 => {
        let [title, message]: string[] = data2;
        this._notify.create(title, message, type);
      });
    });
  }

  public create(title: string, message: string, type: Notify = Notify.Success): void {
    this._notify.create(title, message, type);
  }

  public confirm(
    operation: Opr,
    entity: Ent,
    cb: () => void,
    cancel?: () => void
  ): void {
    const operation$ = this._translate.get(`operation.${operation}`);
    let entity$ = this._translate.get(`entity.${entity}`);
    let message$ = this._translate.get(`confirm.message`);
    forkJoin([operation$, entity$, message$]).subscribe(data => {
      let [operation, entity, message] = data;
      this.simpleConfirm(`${operation.title} ${entity}`, message, cb, cancel);
    });
  };

  public deleteGift(
    operation: Opr,
    entity: Ent,
    cb: () => void,
    cancel?: () => void
  ): void {
    const operation$ = this._translate.get(`operation.${operation}`);
    let entity$ = this._translate.get(`entity.${entity}`);
    let message$ = this._translate.get(`delete-gift.message`);
    forkJoin([operation$, entity$, message$]).subscribe(data => {
      let [operation, entity, message] = data;
      this.simpleConfirm(`${operation.title} ${entity}`, message, cb, cancel);
    });
  };

  // TODO: In this case (when using sweetalert), preferred to return promise instead of using callbacks!
  public simpleConfirm(title: string, message: string, cb: () => void, cancel?: () => void): void {
    let options: { [key: string]: any } = {
      title: title,
      text: message,
      type: "warning",
      confirmButtonText: this._translate.currentLang == 'fa' ? "بله" : "Yes",
      confirmButtonClass: "btn btn-success",
      showCancelButton: true,
      cancelButtonText: this._translate.currentLang == 'fa' ? "خیر" : "No",
      cancelButtonClass: "btn btn-danger",
      buttonsStyling: false,
      heightAuto: false,
      // reverseButtons: true
    };

    swal.fire(options).then(result => {
      if (result.value)
        cb();
      else {
        cancel();
      }
    });
  }

  public alert(title: string, message: string, type: SwlT = SwlT.Success): Promise<any> {
    return swal.fire({
      title: title,
      text: message,
      confirmButtonText: this._translate.currentLang == 'fa' ? "تأیید" : "OK",
      heightAuto: false,
      buttonsStyling: false
    });
  }
}
