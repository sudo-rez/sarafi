import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreRoutingModule } from './store-routing.module';
import { SharedModule } from '../../modules/shared/shared.module';

import { SettingsComponent } from './settings/settings.component';
import { PaymentSettingsComponent } from './payment-settings/payment-settings.component';
import { PromotionSettingsComponent } from './promotion-settings/promotion-settings.component';
import { CustomTagsComponent } from './custom-tags/custom-tags.component';
import { NgxSmartModalModule } from "ngx-smart-modal";
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { CKEditorModule } from "ckeditor4-angular";
import { ThemeSettingComponent } from './theme-setting/theme-setting.component';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  imports: [
    CommonModule,
    NgxSmartModalModule.forRoot(),
    StoreRoutingModule,
    DpDatePickerModule,
    SharedModule,
    CKEditorModule,
    ColorPickerModule
  ],
  declarations: [
    SettingsComponent,
    PaymentSettingsComponent,
    PromotionSettingsComponent,
    CustomTagsComponent,
    ThemeSettingComponent
  ]
})
export class StoreModule { }
