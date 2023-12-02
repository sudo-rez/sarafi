
export interface APC {
    _id:string
    name:string
    card_number:string
    active:boolean
    current:boolean
    bank:string
    amount_all:number
    amount_day:number
}
export interface SAPC {
    _id:string
    name:string
    card_number:string
    active:boolean
    current:boolean
    bank:string
    amount_all:number
    amount_day:number
    username:string
    password:string
    id:string
    account_no:string
    sheba_no:string
    psp:string
}