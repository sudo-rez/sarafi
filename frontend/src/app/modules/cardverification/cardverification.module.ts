import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../modules/shared/shared.module';
import { CardVerificationComponent } from './cardverification/cardverification.component';
import {CardVerificationRoutingModule} from "./cardverification-routing.module"
import {NgxMaskModule } from 'ngx-mask'



@NgModule({
  declarations: [
    CardVerificationComponent
  ],
  imports: [
    CommonModule,
    CardVerificationRoutingModule,
    SharedModule,
    NgxMaskModule.forRoot()
  ]
})
export class TxnModule { }
