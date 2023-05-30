import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../modules/shared/shared.module';

import { BannerRoutingModule } from './banner-routing.module';
import { BannerListComponent } from './banner-list/banner-list.component';
import { BannerCreateComponent } from './banner-create/banner-create.component';

@NgModule({
  declarations: [BannerListComponent, BannerCreateComponent],
  imports: [
    CommonModule,
    BannerRoutingModule,
    SharedModule
  ]
})
export class BannerModule { }
