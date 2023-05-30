import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentRoutingModule } from './payment-routing.module';
import { SharedModule } from '../../modules/shared/shared.module';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { APCListComponent } from './apc/list/apc-list.component';
import { APCCreateComponent } from './apc/create/apc-create.component';
import { APCDeleteComponent } from './apc/delete/apc-delete.component';
import { APCEditComponent } from './apc/edit/apc-edit.component';
import { SAPCListComponent } from './sapc/list/sapc-list.component';
import { SAPCCreateComponent } from './sapc/create/sapc-create.component';
import { SAPCDeleteComponent } from './sapc/delete/sapc-delete.component';
import { SAPCEditComponent } from './sapc/edit/sapc-edit.component';
import { ConfirmModule } from '../confirm/confirm.module';


@NgModule({
  declarations: [
    APCListComponent,
    APCCreateComponent,
    APCDeleteComponent,
    APCEditComponent,
    SAPCListComponent,
    SAPCCreateComponent,
    SAPCDeleteComponent,
    SAPCEditComponent,
  ],
  imports: [
    CommonModule,
    PaymentRoutingModule,
    SharedModule,
    DpDatePickerModule,
    ConfirmModule
  ]
})
export class PaymentModule { }
