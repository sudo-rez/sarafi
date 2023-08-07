import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { AccountRoutingModule } from './account-routing.module';
import { AccountComponents } from './account.component';
import { ConfirmModule } from '../confirm/confirm.module';



@NgModule({
  declarations: [
    AccountComponents  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    SharedModule,
    DpDatePickerModule,
    ConfirmModule
  ]
})
export class AccountModule { }
