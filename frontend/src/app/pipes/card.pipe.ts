import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'bank'
})
export class BankPipe implements PipeTransform {

    private $onLangChange;
    public currentLang: string = this._translate.currentLang;

    constructor(
      private _translate: TranslateService
    ) {
      this.$onLangChange = this._translate.onLangChange.subscribe(data => {        
        this.currentLang = data.lang;
      });
    }
  
  transform(value: any): any {
    try {   
        return this.Bank(value,this.currentLang)
    }
    catch {
      return value;
    }
  }
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
  public Bank(value,lang) {
    if (lang == "fa") return this.cardBanks[value][0]
    return this.cardBanks[value][1]
  }
  public BankList(){
    return this.cardBanks
  }
}


