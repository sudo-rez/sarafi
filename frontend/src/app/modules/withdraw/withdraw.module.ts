import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../modules/shared/shared.module';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { WithdrawRoutingModule } from './withdraw-routing.module';
import { WithdrawComponent } from './withdraw.component';
import { ConfirmModule } from '../confirm/confirm.module';
import { WithdrawManual } from './manual/withdraw-manual';



@NgModule({
  declarations: [
    WithdrawComponent,
    WithdrawManual
  ],
  imports: [
    CommonModule,
    WithdrawRoutingModule,
    SharedModule,
    DpDatePickerModule,
    ConfirmModule
  ]
})
export class WithdrawModule { }
