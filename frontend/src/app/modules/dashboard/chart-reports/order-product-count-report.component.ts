import { Component, OnInit, ElementRef } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import Chart from 'chart.js/auto';
import * as randomColor from 'randomcolor';
import * as moment from 'moment-jalali';

moment.loadPersian({
  dialect: 'persian-modern',
  usePersianDigits: true
});

import { ApiService } from '../../../services/api.service';

export interface Dataset {
  "label": string,
  "data": Array<number>,
  "backgroundColor"?: string
}

interface Report {
  "end_time": number,
  "start_time": number,
  "products": Array<{
    "count": number,
    "image": string,
    "name": string
  }>
}

@Component({
  selector: 'canvas[order-product-count-report]',
  template: '',
  styles: []
})
export class OrderProductCountReportComponent implements OnInit {

  public ctx: any = this._element.nativeElement.getContext('2d');
  public chart: any;
  public chartOptions: {[key: string]: any} = {
    legend: {
      display: false
   },
    responsive: false,
    scales: {
      xAxes: [{ stacked: true }],
      yAxes: [{
        stacked: true,
        position: 'left',
        ticks : {
          beginAtZero: true,
          min: 0
          // fixedStepSize: 1
        }
      }]
    }
  };

  constructor(
    private _element: ElementRef,
    private _translate: TranslateService,
    private _api: ApiService
  ) {
    this._getReport();
  }

  public reports: Array<Report> = [];
  private _getReport(): void {
    this._api.set("report/order/product-count", "GET", {}, (res: { report: Array<Report> }): void => {
      this.reports = res.report;
      this.draw();
    });
  }

  // private $onLangChange;
  ngOnInit() {
    // this.$onLangChange = this._translate.onLangChange.subscribe(data => {
    //   this.draw(data.lang);
    // });
  }

  private draw(lang: string = this._translate.currentLang): void {
    if (this.chart) this.chart.clear().destroy();
    this.chart = new Chart(this.ctx, {
      type: 'bar',
      options: this.chartOptions,
      data: this._chartData(lang)
    });
  }

  private _chartData(lang: string): {labels: Array<string>, datasets: Array<Dataset>} {
    let datasets: {[key: string]: Array<number>} = {};

    let chartLabels: Array<string> = [];
    for (const report of this.reports.reverse()) {
      let date: string = lang == 'fa' ?
        moment.unix(report.start_time).format('ddd jD jMMMM jYY') :
        new Date(report.start_time*1000).toDateString();

      let labelIndex: number = chartLabels.indexOf(date);

      if (labelIndex == -1)
        chartLabels.push(date) && (labelIndex = chartLabels.length-1);

      for (const product of report.products) {
        if (!datasets.hasOwnProperty(product.name))
          datasets[product.name] = new Array(this.reports.length);

        datasets[product.name][labelIndex] = product.count;
      }
    }

    let colors: Array<string> = randomColor({
      count: Object.keys(datasets).length,
      // hue: '#4b3a71',
      luminosity: 'dark',
      format: 'rgba',
      alpha: 0.6
    });

    let chartData: Array<Dataset> = [];
    Object.keys(datasets).forEach((label: string, i: number) => {
      chartData.push({
        label: label,
        data: datasets[label],
        backgroundColor: colors[i]
      });
    });

    return {
      labels: chartLabels,
      datasets: chartData
    };
  }

  public random(min: number =  1, max: number = 10): number {
    return Math.floor(Math.random() * (max-min+1)) + min;
  }

  ngOnDestroy() {
    // this.$onLangChange.unsubscribe();
    this._api.remove("report/order/product-count");
    if (this.chart) this.chart.clear().destroy();
  }
}