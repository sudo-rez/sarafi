import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { ApiService } from '../../../services/api.service';

interface getCardInfoResponse {
  info:  any,
  error?: string,
}
@Component({
  selector: 'app-cardverification',
  templateUrl: './cardverification.component.html',
  styles: []
})

export class CardVerificationComponent implements OnInit {

  constructor(
    private _storage: LocalStorageService,
    private _api: ApiService

  ) { }

  ngOnInit() { }

  public cardNumber = ""
  public bankName = ""
  public validCard = false
  private cardBanks = {
    "603799":["بانک ملی ایران	","Melli"],"589210":["بانک سپه","Sepah"],"627648":["بانک توسعه صادرات","Tossee Saderat"],
    "627961":["بانک صنعت و معدن","Sanat Madan"],"603770":["بانک کشاورزی","Keshavarzi"], "628023":["بانک مسکن","Maskan"],
    "627760":["پست بانک ایران","Post"],"502908":["بانک توسعه تعاون","Tossee Taavon"],"627412":["بانک اقتصاد نوین","Eghtesad Novin"],
    "622106":["بانک پارسیان","Parsian"],"502229":["بانک پاسارگاد","Pasargard"],"639599":["بانک قوامین","Gavamin"],
    "627488":["بانک کارآفرین","Kar Afarin"],"621986":["بانک سامان","Saman"],"639346":["بانک سینا","Sina"],"639607":["بانک سرمایه","Sarmaye"],
    "507677":["موسسه اعتباری نور","Nor"],"502806":["بانک شهر","Shahr"],"504706":["بانک شهر","Shahr"], "502938":["بانک دی","Dey"],
    "603769":["بانک صادرات","Saderat"], "610433":["بانک ملت","Mellat"], "627353":["بانک تجارت","Tejarat"],
		"585983":["بانک تجارت","Tejarat"],"589463":["بانک رفاه","Refah"], "627381":["بانک انصار","Ansar"], "639370":["بانک مهر اقتصاد","Mehr Eghtesad"],
    "628157":["موسسه اعتباری توسعه","Etebari Tossee"],"505801":["موسسه اعتباری کوثر","Etebari Kosar"],"606256":["موسسه اعتباری ملل (عسکریه)","Etebari Melal"],
    "606373":["بانک قرض الحسنه مهرایرانیان","Mehr Iranian"],
  }
  public submit(card :string) {
    this.validCard = false
    if (this.cardBanks[card]) {
      if (this._storage.get('lang') == "fa") {
        this.bankName= this.cardBanks[card][0]
      }else {
        this.bankName = this.cardBanks[card][1]
      }
    }else if (card.length <= 6) {
      this.bankName = ""
    }
    if (card.length == 16 ) {
      var res = 0
      for (let i = 0; i < card.length; i++) {
          if ((i+1)%2 == 0){
            res = res + ~~card[i]
          }else{
            var mul =  (~~card[i]*2)            
            if (mul > 9) mul = mul - 9 
            res = res + mul
          }               
      }
      if (res%10 == 0){
        this.getCardInfo(card)
        this.validCard = true
      }
    }else{
      this.cardOwner = ""
      this.cardMsg  = ""
    }
  } 
  public cardOwner= ""
  public cardMsg = ""
  public getCardInfo(cardNumber: string) {    
    this._api.set("card/info", "GET", { params: {"c":cardNumber} }, (res: getCardInfoResponse): void => {
      this.cardOwner = res.info?.owner
    },(err:any): void => {
      this.cardMsg = err.error?.error
    });
  }
  ngOnDestroy() {
  }
}
