import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

export interface Params { [key: string]: any; };

@Injectable({
  providedIn: 'root'
})
export class QueryService {

  constructor(
    private _router: Router,
    private _route: ActivatedRoute
  ) { }

  private _ignores: Array<string> = ['limit'];

  public params(): Params {
    return this._route.snapshot.queryParams;
  }

  public param(key: string): any {
    return this.params()[key];
  }

  public set(params: Params, clear: boolean = false): Params {
    if (!clear)
      params = Object.assign({}, this.params(), params);

    for (const key in params) {
      if(this._ignores.includes(key) || (!params[key] && params[key] !== 0))
        delete params[key];
    }

    this._router.navigate([], { queryParams: params });
    return params;
  }

  public remove(key: string): Params {
    let params = this.params();
    delete params[key];
    return this.set(params, true);
  }

  public clear(): void {
    this.set({}, true);
  }

}
