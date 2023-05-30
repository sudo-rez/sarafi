export interface Txn {
    amount:number,
    account:string,
    brand_name:string,
    checkout_ref:string,
    client_ip:string,
    created_at:string,
    updated_at:string,
    destination:string,
    message:string,
    request_id:string,
    site_ref:string,
    source:string,
    _id:string
}
export interface Withdraw {
    amount:number,
    account:string,
    created_at:string,
    updated_at:string,
    card:string,
    done:boolean,
    inprogress:boolean,
    brand:string,
    remaining:number,
    inprogress_amount:number,
}