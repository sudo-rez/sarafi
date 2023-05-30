import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ApiService } from "../../../services/api.service";
import { LocalStorageService } from 'angular-2-local-storage';
import { TranslateService } from '@ngx-translate/core';
import Chart from 'chart.js/auto'
import * as moment from 'jalali-moment';
import { Brand } from 'src/app/interfaces/brand';
import { Wallet } from 'src/app/interfaces/wallet';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: []
})
export class DashboardComponent implements OnInit, AfterViewInit {

  public selectedLang = this._storage.get('lang');

  constructor(
    private _api: ApiService,
    private _translate: TranslateService,
    private _storage: LocalStorageService,
    public userService:UserService
    
  ) {

  }

  public chart: any;
  public chartmsg: any;

  public parsDateString(date: string): string {
    let yyyy = date.slice(0, 4);
    let mm = date.slice(4, 6);
    let dd = date.slice(6, 8);
    let _date = moment(`${yyyy}/${mm}/${dd}`, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD');
    if (this.selectedLang == 'fa') {
      return _date;
    } else {
      return `${yyyy}/${mm}/${dd}`;
    }
    // return yyyy + '/' + mm + '/' + dd;
    // return _date;
  }

  ngOnInit() {
    this.generateChart();
    this.getWithdrawQueue()
    this.getBrands()
    this.getWallet()
    this.getBaseInfo()
    this._translate.onLangChange.subscribe(data => {
      this.selectedLang = data.lang;
      this.chart.destroy()    
      this.generateChart()
    });
  }

  public sliceNameOfreefer(str: string): string{
    const index = str.lastIndexOf('=')+1;
    return str.slice(index, str.length);
  }
  public successTxnLabel : string = ""
  public failedTxnLabel : string = ""

  public generateChart() {
    this._translate.get("dashboard.statistics.success-txn").subscribe(text => {
      this.successTxnLabel = text
    })
    this._translate.get("dashboard.statistics.failed-txn").subscribe(text => {
      this.failedTxnLabel = text
    })
    if (this.selectedLang == "fa") {
      Chart.defaults.font.family = "tanha-fd-wol"
    }else {
      Chart.defaults.font.family = "nunito-sans-light"
    }
    // TXN CHART 
   this.chart = new Chart("TxnChart", {
        type: 'bar', //this denotes tha type of chart
        
        data: {// values on X-Axis
          labels: ['2022-05-10', '2022-05-11', '2022-05-12','2022-05-13',
                   '2022-05-14', '2022-05-15', '2022-05-16','2022-05-17', ], 
           datasets: [
            {
              label: this.successTxnLabel ,
              data: ['467','576', '572', '79', '92',
                   '574', '573', '576'],
              backgroundColor: 'green'
            } ,
            {
              label: this.failedTxnLabel ,
              data: ['100','400', '200', '10', '200',
                   '300', '400', '576'],
              backgroundColor: 'red'
            } 
          ]
        },
        options: {
          aspectRatio:2.5,
        }
        
      });
    
    // TXN MSG CHART 
    this.chartmsg = new Chart("TxnMsgChart", {
      type: 'doughnut', //this denotes tha type of chart
      
      data: {// values on X-Axis
        labels: ['OK' , 'موجودی ناکافی', 'خطای رمزنگاری','تراکنش ناموفق'], 
         datasets: [
          {
            data: ['1000','200','50','400'],
            backgroundColor: ['green','gray','sandybrown','red'],
          } 
        ]
      },
      options: {
        aspectRatio:2.5,
      }
      
    });
    // this._api.set("store/", "GET", {}, (res: { store: Store, stat_reefers: string[] }): void => {
    //   this.allProduct = res.store.product_count;
    //   this.existProduct = res.store.exists_product_count;
    //   this.chartVisit = res.store['stats']['visit'].map((data) => {
    //     let day = data['Day'];
    //     this.chartVisitCat.push(this.parsDateString(day.toString()));
    //     return data['Value'];
    //   });

    //   // reefers
    //   this.statReefers = res.stat_reefers;

    //   this.chartSale = res.store['stats']['sale'].map((data) => {
    //     let day = data['Day'];
    //     let date = new Date();
    //     let todayDate = `${date.getFullYear()}${date.getMonth()+1}${date.getDate()}`;
    //     this.chartSaleCat.push(this.parsDateString(day.toString()));
    //     if(day == todayDate) this.todaySaleVolume = data['Value'];
    //     return data['Value'];
    //   });

    //   this.chartorder = res.store['stats']['order'].map((data) => {
    //     let day = data['Day'];
    //     this.chartorderCat.push(this.parsDateString(day.toString()));
    //     return data['Value'];
    //   });

    //   let reefer = res.store['stats']['reefer'];
    //   for (const [key, value] of Object.entries(reefer)) {
    //     this.chartreefer.push({ name: key, y: value })
    //   }

    //   let chartVisit = highChart.chart('chartVisit', {
    //     credits: {
    //       enabled: false
    //     },
    //     chart: {
    //       type: 'area',
    //       zoomType: 'x'
    //     },
    //     legend: {
    //       enabled: false
    //     },
    //     title: {
    //       text: null
    //     },
    //     yAxis: {
    //       title: false,
    //     },
    //     xAxis: {
    //       // type: 'datetime',
    //       // tickInterval: 1
    //       categories: this.chartVisitCat,
    //     },
    //     plotOptions: {
    //       series: {
    //         color: '#7ac83f'
    //       }
    //     },
    //     series: [{
    //       data: this.chartVisit,
    //     }]
    //   });
    //   let chartSell = highChart.chart('chartSell', {
    //     credits: {
    //       enabled: false
    //     },
    //     chart: {
    //       type: 'area',
    //       zoomType: 'x'
    //     },
    //     legend: {
    //       enabled: false
    //     },
    //     title: {
    //       text: null
    //     },
    //     yAxis: {
    //       title: false
    //     },
    //     xAxis: {
    //       // tickInterval: 1
    //       categories: this.chartSaleCat,
    //     },
    //     plotOptions: {
    //       series: {
    //         color: '#7ac83f'
    //       }
    //     },
    //     series: [{
    //       data: this.chartSale
    //     }]
    //   });
    //   let chartOrder = highChart.chart('chartOrder', {
    //     credits: {
    //       enabled: false
    //     },
    //     chart: {
    //       type: 'area',
    //       zoomType: 'x'
    //     },
    //     legend: {
    //       enabled: false
    //     },
    //     title: {
    //       text: null
    //     },
    //     yAxis: {
    //       title: false
    //     },
    //     xAxis: {
    //       // tickInterval: 1
    //       categories: this.chartorderCat,
    //     },
    //     plotOptions: {
    //       series: {
    //         color: '#7ac83f'
    //       }
    //     },
    //     series: [{
    //       data: this.chartorder
    //     }]
    //   });
    //   let chartEntrance = highChart.chart('chartEntrance', {
    //     credits: {
    //       enabled: false
    //     },
    //     chart: {
    //       plotBackgroundColor: null,
    //       plotBorderWidth: null,
    //       plotShadow: false,
    //       type: 'pie',
    //       showInLegend: false
    //     },
    //     title: {
    //       text: null
    //     },
    //     tooltip: {
    //       pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    //     },
    //     plotOptions: {
    //       pie: {
    //         allowPointSelect: true,
    //         cursor: 'pointer',
    //         showInLegend: true,
    //         dataLabels: {
    //           enabled: true,
    //           format: '<b>{point.name}</b>: {point.percentage:.1f} %'
    //         }
    //       }
    //     },
    //     series: [{
    //       name: 'Brands',
    //       colorByPoint: true,
    //       data: this.chartreefer
    //     }]
    //   });
    // });
  }
  public withdrawQueue : any = {}
  public wdselect :any = []
  public getWithdrawQueue(){
    this._api.set("txn/wd/q/l", "GET", {  }, (res: any): void => {
      this.withdrawQueue = res.result || [];
      for (var k in this.withdrawQueue){
        this.wdselect = this.withdrawQueue[k]
        break
      }
    });
  }
  public brands: Array<Brand> = [];
  public txnselect:any = ""
  public getBrands() {    
    this._api.set("brand/l", "GET", {}, (res: any): void => {
      this.brands = res.result || [];
      this.txnselect =this.brands[0]?._id
      this.getLastTxns()
    });
  }
  public txns : any = []
  public getLastTxns(){
    this._api.set("txn/l", "POST", { body:{"brand":this.txnselect} ,params:{"sort":"-created_at","limit":10}}, (res: any): void => {
      this.txns = res.result || [];
    });
  }
  public wallet :Wallet=null
  public getWallet(){
    this._api.set("w/current","GET",{},(res)=>{
      this.wallet = res?.wallet
    })
   }
   public base :any=null
   public getBaseInfo(){
    this._api.set("dashboard/base","GET",{},(res)=>{
      this.base = res
    })
   }

  ngOnDestroy() { }

  ngAfterViewInit(): void {
    // if (!localStorage.getItem('welcome-modal')) {
    //   localStorage.setItem('welcome-modal', 'true');
    // }

  }
}