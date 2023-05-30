import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreManagerRoutingModule } from './store-manager-routing.module';
import { SharedModule } from '../shared/shared.module';

import { InviteManagerComponent } from './invite-manager/invite-manager.component';

@NgModule({
  imports: [
    CommonModule,
    StoreManagerRoutingModule,
    SharedModule
  ],
  declarations: [InviteManagerComponent]
})
export class StoreManagerModule { }
