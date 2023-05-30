import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../modules/shared/shared.module';
import { DpDatePickerModule } from "ng2-jalali-date-picker";
import { SettingComponent } from './setting.component';
import { SettingRoutingModule } from './setting-routing.module';
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";


@NgModule({
  declarations: [
    SettingComponent
  ],
  imports: [
    CommonModule,
    SettingRoutingModule,
    SharedModule,
    DpDatePickerModule,
    CKEditorModule
  ]
})
export class SettingModule { }
