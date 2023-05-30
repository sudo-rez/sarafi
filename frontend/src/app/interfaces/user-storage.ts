import { Store } from '../interfaces/store';
import { User } from '../interfaces/user';
import { Brand } from './brand';
export interface UserStorage {
  user: User,
  // stores?: Array<Store>,
  // store_selected: boolean
}
export interface BrandResult {
  msg?:string,
  brand:Brand
}
export interface TokenStorage {
  token: string,
}
export interface LoginResult extends UserStorage {
  msg?: string,
}
