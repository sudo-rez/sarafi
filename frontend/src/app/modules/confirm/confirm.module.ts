import { NgModule } from '@angular/core';
import { ConfirmComponent } from './confirm.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
    imports:[SharedModule],
  declarations: [ConfirmComponent],
  exports:[ConfirmComponent]
})
export class ConfirmModule { }
