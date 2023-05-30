export interface Store {
  acceptable_customer_register_info: string;
  address: string;
  cellphone: string;
  city: string;
  created_at: string;
  current_theme: string;
  custom_meta_tags: Array<CustomMetaTag>;
  delivery: Delivery;
  description: string;
  domain: string;
  domains: Array<Domain>;
  email: string;
  enamad_meta_id: number;
  enamad_tag: string;
  favicon: string;
  fax: string;
  freeze: boolean;
  theme_fullpath: string;
  google_analytics: string;
  has_customer_register_verification: boolean;
  has_favicon: boolean;
  has_logo: boolean;
  id: string;
  index_in_mastershop: boolean;
  is_mastershop: boolean;
  is_selected?: boolean;
  logo: string;
  manager_count: number,
  manager_is_limited: boolean,
  meta_description: string,
  meta_keyword: Array<string>;
  must_verify_customer: boolean;
  name: string;
  ordering_freeze: boolean;
  payment: Payment;
  phone: string;
  postal: number;
  product_is_limited: boolean;
  required_customer_profile_fields: Array<string>;
  samandehi: string;
  sells_gift_cards: boolean;
  sliders: Array<any>;
  socials: { [key: string]: string };
  state: string;
  suspend: boolean;
  tax: number;
  theme_name: string,
  user_profile_force: boolean;
  verify_customer_register_info: boolean;
  view_address: string;
  webgates: Array<string>;
  webgates_params: WebgatesParams;
  unlimited_time_ordering: boolean;
  sms_footer: string;
  customize_sms_footer: boolean;
  owner: Owner,
  currency: string;
  product_count?: number;
  exists_product_count?: number;
}

export interface Owner {
  fullname: string;
  cellphone: string;
  email: string;
}

export interface CustomMetaTag {
  name: string;
  content: string;
}

export interface tabContent {
  title: string;
  desc: string;
}

export interface Delivery {
  area_support: string;
  courier: boolean;
  free_for_price: number;
  free_shiping: boolean;
  post: boolean;
  price_for_area_selected: number;
  post_cost: Array<any>
}

export interface Domain {
  can_delete: boolean;
  is_active: boolean;
  is_default: boolean;
  name: string;
}

export interface Payment {
  coordinatad_is_active: boolean;
  online_payment_is_active: boolean;
}

export interface WebgatesParams {
  irankish: Irankish;
  mellat: Mellat;
  saman: Saman;
}

interface Irankish {
  merchant_id: string;
  description: string;
}

interface Mellat {
  terminal_id: string;
  username: string;
  password: string;
  description: string;
}

interface Saman {
  merchant_id: string;
}

export interface Imain_setting {
  freeze: boolean,
  ordering_freeze: boolean,
  must_verify_customer: boolean,
  favicon_image: Array<string>,
  logo_image: Array<string>,
  name: string,
  email: string,
  thumb: string[],
  micro: string[],
}
// Panel Settings
export interface Setting {
  id: string;
  store_id: string;
  general: GeneralSetting;
  sidebar: Sidebar;
  header: Sidebar;
  table: Table;
  card: Sidebar;
  created_at: string;
  updated_at: string;
}

interface GeneralSetting {
  background_color: string;
  background_image: string;
  text_color: TextColor;
  radius: Radius;
  main_color: string;
  danger_color: string;
  success_color: string;
  info_color: string;
  warning_color: string;
  font_family: string;
}

interface TextColor {
  title: string;
  form_label: string;
}

interface Radius {
  card: string;
  button: string;
  input: string;
}

interface Sidebar {
  background_color: string;
  text_color: string;
}

interface Table {
  page_size: number;
  header_background_color: string;
  row_background_color_even: string;
  row_background_color_odd: string;
}