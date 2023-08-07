export interface Account {
    id:string
    brand:string
    brand_name:string
    username:string
    pans:Array<Pans>
    trust_level:number
    created_at:string
    updated_at:string
    sapc_active:boolean
}
export interface Pans {
    card:string
    mobile:string
    national_code:string
    birthday:string
}