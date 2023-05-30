import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpEventType
} from '@angular/common/http';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from './services/user.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  private _userService: UserService;
  private _translate: TranslateService;

  constructor(
    private inj: Injector,
    private _notify: NotificationsService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    this._userService = this.inj.get(UserService);
    this._translate = this.inj.get(TranslateService);

    if (!req.url.includes("static")) {
        req = req.clone({
          url: `./api/${req.url}`,
        }); 
    }

    let userToken: string = this._userService.tokenStorage().token;
    if (userToken)
      req = req.clone({
        setHeaders: {
          Authorization: userToken
        }
      });

    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            return this.fileUploadProgress(event);
            break;
          case HttpEventType.Response:
            return this.apiResponse(event);
            break;
          default:
            break;
        }
        if (event instanceof HttpResponse)
          return event;
      }),
      catchError(err => {
        
        switch (err.status) {
          case 400:
            if (err.error.error == "user already exists") {
              this._translate.get("error.user-exist").subscribe(notify => {
                this._notify.error(notify.title, notify.message);
              });
              break;
            }else if(err.error.error.includes("national code exists")) {
              this._translate.get("error.national-code-exist").subscribe(notify => {
                this._notify.error(notify.title, notify.message);
              });
              break;
            }else if(err.error.error.includes("Field validation for 'national_code'")) {
              this._translate.get("error.validation-national-code").subscribe(notify => {
                this._notify.error(notify.title, notify.message);
              });
              break;
            }else if(err.error.error == "file size can`t 1mg") {
              this._translate.get("notify.video-size-error").subscribe(text => {
                this._notify.error(text.title, text.message);
              });
              break;
            } else if (req.url.includes("panel/appearance") && req.method == 'GET') {
              // noop
              break
            } else {
              this._translate.get("error.400").subscribe(notify => {
                this._notify.error(notify.title, notify.message);
              });
              break;
            }
          case 401:
            // this._translate.get("error.401").subscribe(notify => {
            //   this._notify.error(notify.title, notify.message);
            // });
            this._userService.ejectUser({ notify: true });
            break;
          case 403:
            if (err.error == 'u or password not matched') {
              this._translate.get("notify.login-error").subscribe(notify => {
                this._notify.error(notify.title, notify.message);
              });
              break;
            }
            this._userService.ejectUser({ notify: true });
            break;
          case 404:
            this._translate.get("error.404").subscribe(notify => {
              this._notify.error(notify.title, notify.message);
            });
            break;
          default:
            this._notify.error(err.statusText, JSON.parse(err.error).msg);
            break;
        }
        return observableThrowError(err);
      })
    );
  }


  private fileUploadProgress(event) {
    const percentDone = Math.round(100 * event.loaded / event.total);
    return { status: 'progress', message: percentDone };
  }

  private apiResponse(event) {
    return event;
  }

}
