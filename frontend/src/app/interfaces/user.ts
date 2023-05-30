export interface User {
  username: string;
  _id: string;
  is_admin: boolean;
  is_brandadmin: boolean;
  permissions:Object;
  group: string;
  brand_name: string;
}
