export interface Setting {
    gateway: Gateway
}
export interface Gateway {
    blocked_banks: Array < string >
        messages: string
        open_time: number
        alg_duration:number
}