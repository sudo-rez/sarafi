export interface FormMaker {
  id: string,
  name: string,
  store: string,
  view_as_table: boolean,
  categories: string[],
  fields: Field[]
}

export interface Field {
  id: string,
  name: string,
  value_type: "text" | "number" | "boolean",
  default_value: string,
  desc: string,
  value?: any
}
