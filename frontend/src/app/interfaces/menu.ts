export interface Menu {
  children?: Array<Menu>;
  link?: string;
  id: string;
  title: string;
  description: string;
}
