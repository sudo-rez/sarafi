import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  private _storage: any = {};

  constructor() { }

  public get(key: string): any {
    return this._storage[key];
  }

  public set(key: string, value: any): void {
    this._storage[key] = value;
  }

  public remove(key: string): boolean {
    if(this._storage[key])
      return delete this._storage[key];
    return false;
  }

  public reset(): void {
    this._storage = {};
  }

}
