import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../modules/shared/shared.module';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { WithdrawRoutingModule } from './account-routing.module';
import { WithdrawComponent } from './withdraw.component';
import { ConfirmModule } from '../confirm/confirm.module';



@NgModule({
  declarations: [
    WithdrawComponent  ],
  imports: [
    CommonModule,
    WithdrawRoutingModule,
    SharedModule,
    DpDatePickerModule,
    ConfirmModule
  ]
})
export class WithdrawModule { }
