export interface Plan {
  actions: { [key: string]: number },
  base_name_en: string,
  base_name_fa: string,
  children: Array<Plan>,
  credit: number,
  decorated_paths: Array<string>,
  discount_amount: number,
  duration: string,
  features: { [key: string]: boolean },
  has_advertise: boolean,
  id: string,
  limits: { [key: string]: number },
  name: string,
  name_en: string,
  name_fa: string,
  owner: string,
  parent: string,
  price: number
}

export interface ChargeOrder {
  created_at: string,
  id: string,
  paid: boolean,
  plan_id: string,
  price: number,
  ref: string,
  transaction_result: string,
  transaction_trace_no: string,
  verified: boolean
}

export interface OwnedPlan {
  id: string,
  is_active: boolean,
  ref: string,
  ref_name?: string,
  plan: Plan,
  credit_balance: number,
  plan_expire_at: string
}
