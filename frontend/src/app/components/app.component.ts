import { Component, ViewEncapsulation, Renderer2 } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { map, filter, mergeMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { Title } from '@angular/platform-browser';

import { UserService } from '../services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {

  private $onLangChange;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _renderer: Renderer2,
    private _translate: TranslateService,
    private _storage: LocalStorageService,
    private _title: Title,
    public userService: UserService
  ) {
    let defaultLanguage: string = 'fa' || _translate.getBrowserLang();
    _translate.setDefaultLang(defaultLanguage);

    this.$onLangChange = _translate.onLangChange.subscribe(data => {
      this._storage.set('lang', data.lang);
      this._onLangChange(data.lang);
    });
    _translate.use(this._storage.get('lang') || defaultLanguage);
    if (this.userService.panelSetting) {
      this.userService.applyPanelSetting(this.userService.panelSetting);
    } else {
      this.userService.updatePanelSetting();
    }
    console.log("v-0.0.5");
  }

  public simpleNotificationsOptions = {};
  public jasperoConfirmationsOptions = {};
  public progressDirection: "rightToLeftIncreased" | "leftToRightIncreased" = "leftToRightIncreased";
  private _onLangChange(language: string): void {
    /**
     * Simple notifications joint options
     */
    let simpleNotificationsOptions = {
      timeOut: 5000,
      showProgressBar: false,
      maxStack: 3,
      animate: "scale"
    };
    /**
     * Change styles direction to rtl on switch language
     */
    if (language == 'fa') {
      this._renderer.addClass(document.body, "rtl");
      this.simpleNotificationsOptions = {
        position: ["bottom", "left"],
        ...simpleNotificationsOptions
      };
      this.progressDirection = "rightToLeftIncreased";
    } else {
      this._renderer.removeClass(document.body, "rtl");
      this.simpleNotificationsOptions = {
        position: ["bottom", "right"],
        ...simpleNotificationsOptions
      };
      this.progressDirection = "leftToRightIncreased";
    }
    /**
     * Reset page title on switch language
     */
    this._title.setTitle(`Payment`);
  }

  ngOnInit() {
    this._routeChangeEventListener();
    // this.userService.updateUserStorage();
  }

  private _routeChangeEventListener(): void {
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this._route),
      map((route) => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      filter((route) => route.outlet === 'primary'),
      mergeMap((route) => route.data)
    ).subscribe(data => {
      /**
       * Set page title on route changes
       */
      if (data.title)
        this._translate.get(data.title).subscribe(title => {
          this._title.setTitle(`Payment :: ${title}`);
        });
      else
        this._title.setTitle(`Payment`);

      if (this.sidebarVisibility)
        this.sidebarToggle();
    });
  }

  public sidebarVisibility: boolean = false;
  public sidebarToggle() {
    this.sidebarVisibility = !this.sidebarVisibility;
  }

  // ngAfterContentInit() {
  //   setTimeout(() => {
  //     this._setMainHeight();
  //   });
  // }
  // @HostListener('window:resize', ['$event']) private _onWindowResize(event) {
  //   this._setMainHeight();
  // }
  // public mainHeight: string = "auto";
  // private _setMainHeight(): void {
  //   this.mainHeight = (document.body.offsetHeight - document.getElementsByTagName("header")[0].offsetHeight) + "px";
  // }

  ngOnDestroy() {
    this.$onLangChange.unsubscribe();
  }
}
