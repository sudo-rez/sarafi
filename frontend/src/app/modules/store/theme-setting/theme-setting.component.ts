import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/user.service';
import { NotifyService, Opr, Ent, Notify } from '../../../services/notify.service';
import { TranslateService } from "@ngx-translate/core";
import { NotificationType } from "angular2-notifications";
import { Setting } from "../../../interfaces/store";
import { Image } from '../../../interfaces/image';


@Component({
  selector: 'app-theme-setting',
  templateUrl: './theme-setting.component.html',
  styles: []
})
export class ThemeSettingComponent implements OnInit, OnDestroy {

  public title: string = "store.theme-settings.title";
  public background_color: string = "#f5f5f5";
  public title_color: string = "#777777";
  public form_label_color: string = "#888888";
  public sidebar_background_color: string = "#ffffff";
  public sidebar_color: string = "#777777";
  public header_background_color: string = "#ffffff";
  public header_color: string = "#888888";
  public danger: string = "#c0392b";
  public success: string = "#4caf50";
  public info: string = "#5bc0de";
  public warning: string = "#bcbcbc";
  public main_color: string = "#4b3a71";
  public card_background_color: string = "#ffffff";
  public card_color: string = "#777777";
  public table_header_background_color: string = "#f0f0f0";
  public table_odd_color: string = "#ffffff";
  public table_even_color: string = "#f0f0f0";
  public brandId: string = this.userService.userBrand['id'];
  public lang: string  = this.translate.currentLang;
  public formSubmitted: boolean = false;
  constructor(
    private _fb: FormBuilder,
    private _api: ApiService,
    private _notify: NotifyService,
    public userService: UserService,
    public translate: TranslateService
  ) { }

  public form: FormGroup = this._fb.group({
    "brand_id": this.brandId,
    "general": this._fb.group({
      "background_color": "",
      "background_image": "",
      "text_color": this._fb.group({
        "title": "",
        "form_label": ""
      }),
      "radius": this._fb.group({
        "card": "5",
        "button": "45",
        "input": "5"
      }),
      "font_family": "tanha-fd-wol",
      "main_color": "",
      "danger_color": "",
      "success_color": "",
      "info_color": "",
      "warning_color": ""
    }),
    "sidebar": this._fb.group({
      "background_color": "",
      "text_color": ""
    }),
    "header": this._fb.group({
      "background_color": "",
      "text_color": ""
    }),
    "card": this._fb.group({
      "background_color": "",
      "text_color": ""
    }),
    "table": this._fb.group({
      "page_size": 10,
      "header_background_color": "",
      "row_background_color_even": "",
      "row_background_color_odd": ""
    })
  });

  ngOnInit() {
    this.translate.onLangChange.subscribe((res) => {
      this.lang  = res['lang'];
    });
    this._getPanelTheme();
  }

  public themeId: string = "";
  private _getPanelTheme() {
    this._api.set("store/panel/appearance", "GET", { id: "getPanelTheme" }, (res: { result: Setting }): void => {
      if (!res && !res.result) {
        return;
      }
      this.themeId = res.result.id;
      this.userService.updatePanelSetting(res.result);
      this.userService.applyPanelSetting(res.result);
      this.form.patchValue(res.result);
      if (res.result['general']['background_image']) {
        this._makeDefaultImages(res.result['general']['background_image']);
      }
      // Patch Colors
      this.background_color = res.result['general']['background_color'];
      this.title_color = res.result['general']['text_color']['title'];
      this.form_label_color = res.result['general']['text_color']['form_label'];
      this.sidebar_background_color = res.result['sidebar']['background_color'];
      this.sidebar_color = res.result['sidebar']['text_color'];
      this.header_background_color = res.result['header']['background_color'];
      this.header_color = res.result['header']['text_color'];
      this.danger = res.result['general']['danger_color'];
      this.success = res.result['general']['success_color'];
      this.info = res.result['general']['info_color'];
      this.warning = res.result['general']['warning_color'];
      this.main_color = res.result['general']['main_color'];
      this.card_background_color = res.result['card']['background_color'];
      this.card_color = res.result['card']['text_color'];
      this.table_header_background_color = res.result['table']['header_background_color'];
      this.table_odd_color = res.result['table']['row_background_color_odd'];
      this.table_even_color = res.result['table']['row_background_color_even'];
    });
  }

  public defaultImages: Image[] = [];
  private _makeDefaultImages(bg): void {
    let images: Image[] = [];
    let name: string[] = bg.split(".");
    images.push({
      name: name[name.length - 1],
      original: bg,
      thumb: "",
      micro: "",
      big: "",
      mid: ""
    });
    this.defaultImages = images;
  }

  public setImages(images: string[]): void {
    this.form.get('general.background_image').patchValue(images[0]);
  }

  public resetTheme() {
    this.themeId = "";
    this.userService.removePanelSetting();
    this.form.reset();
    this.defaultImages = [];
    // Reset Colors
    this.background_color = "#f5f5f5";
    this.title_color = "#777777";
    this.form_label_color = "#888888";
    this.sidebar_background_color = "#ffffff";
    this.sidebar_color = "#777777";
    this.header_background_color = "#ffffff";
    this.header_color = "#888888";
    this.danger = "#c0392b";
    this.success = "#4caf50";
    this.info = "#5bc0de";
    this.warning = "#bcbcbc";
    this.main_color = "#4b3a71";
    this.card_background_color = "#ffffff";
    this.card_color = "#777777";
    this.table_header_background_color = "#f0f0f0";
    this.table_odd_color = "#ffffff";
    this.table_even_color = "#f0f0f0";

    this.form.get("general.radius.card").patchValue("5");
    this.form.get("general.radius.button").patchValue("45");
    this.form.get("general.radius.input").patchValue("5");
    this.form.get("general.font_family").patchValue("tanha-fd-wol");
    this.form.get("table.page_size").patchValue(10);
    this.form.get("brand_id").patchValue(this.brandId);

  }

  public removeTheme(): void {
    this._notify.confirm(Opr.Del, Ent.Theme, () => {
      this._api.set("store/panel/appearance", "DELETE", { id: "deleteTheme" }, (res: any): void => {
        this.resetTheme();
        this._notify.status(Opr.Del, Ent.Theme);
      });
    }, () => { });
  }

  public submit(): void {
    this.formSubmitted = true;

    if (this.form.invalid) {
      this.translate.get("notification.required").subscribe(text => {
        this._notify.create("", text, NotificationType.Error)
      });
      return;
    }

    this.form.get("general.background_color").patchValue(this.background_color);
    this.form.get("general.text_color.title").patchValue(this.title_color);
    this.form.get("general.text_color.form_label").patchValue(this.form_label_color);

    this.form.get("sidebar.background_color").patchValue(this.sidebar_background_color);
    this.form.get("sidebar.text_color").patchValue(this.sidebar_color);

    this.form.get("header.background_color").patchValue(this.header_background_color);
    this.form.get("header.text_color").patchValue(this.header_color);

    this.form.get("general.main_color").patchValue(this.main_color);
    this.form.get("general.danger_color").patchValue(this.danger);
    this.form.get("general.success_color").patchValue(this.success);
    this.form.get("general.info_color").patchValue(this.info);
    this.form.get("general.warning_color").patchValue(this.warning);

    this.form.get("card.background_color").patchValue(this.card_background_color);
    this.form.get("card.text_color").patchValue(this.card_color);

    this.form.get("table.header_background_color").patchValue(this.table_header_background_color);
    this.form.get("table.row_background_color_even").patchValue(this.table_even_color);
    this.form.get("table.row_background_color_odd").patchValue(this.table_odd_color);

    this.form.get("general.radius.card").patchValue(String(this.form.get("general.radius.card").value));
    this.form.get("general.radius.button").patchValue(String(this.form.get("general.radius.button").value));
    this.form.get("general.radius.input").patchValue(String(this.form.get("general.radius.input").value));

    this._api.set("store/panel/appearance/save", "POST", {
      body: { id: this.themeId, ...this.form.getRawValue() },
      id: "saveTheme"
    }, (res: { result: Setting }): void => {
      this.userService.updatePanelSetting(res.result);
      this._getPanelTheme();
      this._notify.status(Opr.Edit, Ent.Setting, res['name']);
    }, err => {
      this._notify.create(Opr.Save, err.message, Notify.Error);
    });
  }

  @ViewChild('selectTabMenu') selectTabMenu: ElementRef;
  public selectTab(evt, id) {
    evt.preventDefault();
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(id).style.display = "block";
    evt.target.className += " active";
    this.selectTabMenu.nativeElement.value = id;
  }

  ngOnDestroy() {
    this._api.remove("saveTheme");
    this._api.remove("deleteTheme");
    this._api.remove("getPanelTheme");
  }
}
