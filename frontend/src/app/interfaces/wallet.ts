export interface Wallet {
    brand: string;
    brand_name: string;
    _id: string;
    currency: string;
    amount: number;
    history: Array<WalletHistory>;
    created_at:string;
    updated_at:string;
  }
  
  export interface WalletHistory {
    type: string;
    wallet: string;
    amount:number;
    _id:string;
    by:string;
    created_at:string;
    currency: string;
  }