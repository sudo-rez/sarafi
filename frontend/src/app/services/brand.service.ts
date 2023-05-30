import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { LocalStorageService } from 'angular-2-local-storage';
import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../services/api.service';

import { UserStorage, LoginResult, TokenStorage } from '../interfaces/user-storage';
import { Store, Setting } from '../interfaces/store';


@Injectable()
export class UserService {
  private _userStoreKey: string = "current-store";
  private _tokenKey: string = "token";
  private _userStorageKey: string = "current-user";
  private _panelSettingKey: string = "current-setting";

  constructor(
    private _router: Router,
    private _storage: LocalStorageService,
    private _notify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService
  ) { }

  public userStore: Store = this._storage.get(this._userStoreKey) ;
  public updateUserStore(store?: Store): void {
    if (!!store) {
      this.userStore = store;
      this._storage.set(this._userStoreKey, store);
      return;
    }
  }

  // public avtivePlan: string = this._storage.get(this._activePlanKey) || "free";
  // public updateActivePlan(plan?: string): void {
  //   if (!!plan) {
  //     this.avtivePlan = plan;
  //     this._storage.set(this._activePlanKey, plan);
  //     return;
  //   }

  //   if (this.userStorage().store_selected)
  //     this._api.set('accounting/active_plan', 'GET', { notify: false }, (res: { plan: string }) => {
  //       this.updateActivePlan(res.plan);
  //     });
  //   else {
  //     this.avtivePlan = "free";
  //     this._storage.remove(this._activePlanKey);
  //   }
  // }

  public panelSetting: Setting = this._storage.get(this._panelSettingKey) || null;
  public updatePanelSetting(setting?: Setting): void {
    if (!!setting) {
      this.panelSetting = setting;
      this._storage.set(this._panelSettingKey, setting);
      this.applyPanelSetting(setting);
      return;
    }
  }

  public applyPanelSetting(setting?: Setting): void {
    if (setting) {
      // document.body.setAttribute("style",
      //   "--main-color: " + setting['general']['main_color'] + ";" +
      //   "--danger-color: " + setting['general']['danger_color'] + ";" +
      //   "--success-color: " + setting['general']['success_color'] + ";" +
      //   "--info-color: " + setting['general']['info_color'] + ";" +
      //   "--warn-color: " + setting['general']['warning_color'] + ";" +
      //   "--btn-radius: " + setting['general']['radius']['button'] + "px;" +
      //   "--card-radius: " + setting['general']['radius']['card'] + "px;" +
      //   "--form-radius: " + setting['general']['radius']['input'] + "px;" +
      //   "--sidebar-bg: " + setting['sidebar']['background_color'] + ";" +
      //   "--sidebar-color: " + setting['sidebar']['text_color'] + ";" +
      //   "--header-bg: " + setting['header']['background_color'] + ";" +
      //   "--header-color: " + setting['header']['text_color'] + ";" +
      //   "--table-header-color: " + setting['table']['header_background_color'] + ";" +
      //   "--table-even-color: " + setting['table']['row_background_color_even'] + ";" +
      //   "--table-odd-color: " + setting['table']['row_background_color_odd'] + ";" +
      //   "--card-bg: " + setting['card']['background_color'] + ";" +
      //   "--card-color: " + setting['card']['text_color'] + ";" +
      //   "--title-text-color: " + setting['general']['text_color']['title'] + ";" +
      //   "background-color: " + setting['general']['background_color'] + ";" +
      //   "background-image: " + "url("+setting['general']['background_image'] + ")" + ";" +
      //   "font-family: " + setting['general']['font_family'] + ";" +
      //   "--color: " + setting['general']['text_color']['form_label'] + ";"
      // );
    }
  }

  public removePanelSetting(): void {
    this.panelSetting = null;
    this._storage.remove(this._panelSettingKey);
    // document.body.setAttribute("style",
    //   "--main-color: #4b3a71;" +
    //   "--danger-color: #c0392b;" +
    //   "--success-color: #4caf50;" +
    //   "--info-color: #5bc0de;" +
    //   "--warn-color: #bcbcbc;" +
    //   "--btn-radius: 45px;" +
    //   "--card-radius: 5px;" +
    //   "--form-radius: 5px;" +
    //   "--sidebar-bg: #fff;" +
    //   "--sidebar-color: #888;" +
    //   "--header-bg: #fff;" +
    //   "--header-color: #777;" +
    //   "--table-header-color: #F0F0F0;" +
    //   "--table-even-color: #f0f0f0;" +
    //   "--table-odd-color: #fff;" +
    //   "--card-bg: #fff;" +
    //   "--card-color: #888;" +
    //   "--title-text-color: #777" +
    //   "background-color: #f5f5f5;" +
    //   "color: #888;"
    // );
  }

  public userStorage(): UserStorage {
    return this._storage.get<UserStorage>(this._userStorageKey) || {
      user: {
        username: this._translate.currentLang == 'fa' ? "میهمان" : "Guest",
        is_admin: false
      },
    } as UserStorage;
  }
  public tokenStorage(): TokenStorage {
    return this._storage.get<TokenStorage>(this._tokenKey)|| {
      token : "",
    }as TokenStorage;
  }

  public getUserName(): string {
    return this.userStorage().user.username
  }

  public setUserStorage(userStorage: LoginResult): void {
    this._storage.set(this._userStorageKey, userStorage);
  }

  public updateUserStorage(): void {
    this._api.set("user/current", "GET", { notify: false }, (res: LoginResult): void => {
      this.setUserStorage(res);
      // this.updateUserStore();
    }, err => {
      this._notify.remove();
      this._storage.remove(this._tokenKey)
      this._router.navigate(['/auth']);

    });
  }
  public setTokenStorage(tokenStorage: TokenStorage): void {
    this._storage.set(this._tokenKey, tokenStorage);
  }
  public isLoggedIn(redirectUrl?: string): boolean {
    if (this._storage.get(this._tokenKey))
      return true;
    if (redirectUrl)
      this._api.set("user/current", "GET", { notify: false }, (res: LoginResult): void => {
        this.passToPanel(res, redirectUrl);
      },err =>{
        this._router.navigate(['/auth']);
      });
    return false;
  }

  public isAdmin(): boolean {
    return this.userStorage().user.is_admin;
  }
  public isBrandAdmin(): boolean {
    return this.userStorage().user.is_brandadmin;
  }
  public getGroup(): string {
    return this.userStorage().user.group;
  }

  public login(body: { username?: string, password?: string }): void {
    this._api.set("user/a", "POST", {
      body: body
    }, (res: TokenStorage): void => {
      this.setTokenStorage(res);
      this.passToPanel();
      this.updateUserStorage();
      this._translate.get("notify.login-success").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
    });
  }

  public register(body: { fullname: string, email: string, password: string }): void {
    this._api.set("auth/register", "POST", {
      body: body
    }, (res: LoginResult): void => {
      this.passToPanel(res);
      this.updateUserStore();
      this.updateUserStorage();
      this.updatePanelSetting();
      this._translate.get("notify.register-success").subscribe(text => {
        this._notify.success(text.title, text.message);
      });
    });
  }

  public passToPanel(loginResult?: LoginResult, redirectUrl?: string): void {
    this.setUserStorage(loginResult);
    if (redirectUrl)
      this._router.navigateByUrl(redirectUrl);
    this._router.navigate(['/main']);
  }

  public logout(): void {
      this._storage.remove(this._tokenKey)
      this.ejectUser({});

  }

  public ejectUser(opt: { redirect_url?: string, notify?: boolean }): void {
    this._notify.remove();
    this._storage.remove(this._userStorageKey);
    this.removePanelSetting();
    this.updateUserStore();

    if (opt.notify)
      this._translate.get("notify.login-required").subscribe(text => {
        this._notify.warn(text.title, text.message);
      });

    this._router.navigate(['/auth']);
  }

}
