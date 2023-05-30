import { Injectable } from '@angular/core';
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Injectable()
export class SearchService {

  constructor() { }

  private _subjects: any = {};

  public set(identifier: string, cb: (terms: string) => void): void {
    this.remove(identifier);
    this._subjects[identifier] = new Subject<string>();
    this._subjects[identifier].pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      map((event: any): string => event.target.value)
    ).subscribe((terms: string): void => {
      cb(terms.trim());
    });
  }

  public pass(event: any, identifier: string): void {
    this._subjects[identifier].next(event);
  }

  public remove(identifier: string): void {
    if (this._subjects[identifier]) {
      this._subjects[identifier].unsubscribe();
      delete this._subjects[identifier];
    }
  }
}
