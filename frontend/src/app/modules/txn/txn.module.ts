import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TxnRoutingModule } from './txn-routing.module';
import { SharedModule } from '../../modules/shared/shared.module';
import { TxnListComponent } from "./txn-list/txn-list.component";
import { DpDatePickerModule } from "ng2-jalali-date-picker";


@NgModule({
  declarations: [
    TxnListComponent
  ],
  imports: [
    CommonModule,
    TxnRoutingModule,
    SharedModule,
    DpDatePickerModule
  ]
})
export class TxnModule { }
