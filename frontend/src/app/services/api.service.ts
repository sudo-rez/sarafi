import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
interface Options {
  id?: string,
  notify?: boolean,
  force?: boolean,
  headers?: any,
  body?: any,
  formData?: boolean,
  params?: any,
  options?: any
}
type SuccessCallback = (res: any) => void;
type ErrorCallback = (err: any) => void;

@Injectable()
export class ApiService {

  constructor(
    private _http: HttpClient,
    private _notify: NotificationsService,
    private _translate: TranslateService
  ) { }

  private _requests: Array<Observable<ArrayBuffer>> = [];

  private _intro(key: string, options: Options): void {
    if (options.notify != false) {
      this._translate.get("notify.request").subscribe(text => {
        this._notify.info(text.title, text.message, {
          id: key,
          timeOut: 0
        });
      });
    }
  }

  private _trigger(key: string, success: SuccessCallback, error: ErrorCallback): void {
    this._requests[key] = this._requests[key].subscribe(
      res => {
        this.remove(key);
        success(res);
      },
      err => {
        this.remove(key);
        if (error)
          error(err);
      }
    );
  }

  public formData(params: any): FormData {
    let formData = new FormData();
    for (let key in params) {
      formData.append(key, params[key]);
    };
    return formData;
  }

  private _bodyHandler(method: Method, options: Options): any {
    if (!options.body)
      return null;
    if (options.formData)
      return this.formData(options.body);
    return options.body;
  }

  public httpParams(params: any): HttpParams {
    let httpParams: HttpParams = new HttpParams();
    for (let key in params) {
      if (Array.isArray(params[key]) && !params[key].length || !params[key])
        continue;
      httpParams = httpParams.append(key.toString(), params[key].toString());
    }
    return httpParams;
  }

  public set(
    url: string,
    method: Method,
    options: Options,
    success?: SuccessCallback,
    error?: ErrorCallback
  ): Observable<any> {
    let key: string = options.id || url;
    let req = this._http.request(method, url, {
      headers: options.headers || {},
      body: this._bodyHandler(method, options),
      params: this.httpParams(options.params),
      ...options.options
    });

    if (!!success && (!this._requests[key] || options.force)) {
      this.remove(key);
      this._intro(key, options);
      this._requests[key] = req;
      this._trigger(key, success, error);
    }
    return req;
  }

  public remove(key: string): void {
    this._notify.remove(key);
    if (!!this._requests[key]) {
      this._requests[key].unsubscribe();
      delete this._requests[key];
    }
  }

  public uploadFile(formData) {
    return this._http.post<any>(`store/upload_files`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  public uploadImages(formData) {
    return this._http.post<any>(`store/upload_images`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

}
