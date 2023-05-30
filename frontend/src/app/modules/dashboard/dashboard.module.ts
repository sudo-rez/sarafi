import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../../modules/shared/shared.module';

import { DashboardComponent } from '../../modules/dashboard/dashboard/dashboard.component';
import { OrderProductCountReportComponent } from './chart-reports/order-product-count-report.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
  ],
  declarations: [DashboardComponent, OrderProductCountReportComponent]
})
export class DashboardModule { }
