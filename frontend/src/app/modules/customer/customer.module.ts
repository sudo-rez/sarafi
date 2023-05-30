import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerRoutingModule } from './customer-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { NgxSmartModalModule } from "ngx-smart-modal";

import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerViewComponent } from './customer-view/customer-view.component';
import { CreateCustomerComponent } from './create-customer/create-customer.component';

@NgModule({
  imports: [
    CommonModule,
    NgxSmartModalModule.forRoot(),
    DpDatePickerModule,
    CustomerRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [CustomerListComponent, CustomerViewComponent, CreateCustomerComponent]
})
export class CustomerModule { }
