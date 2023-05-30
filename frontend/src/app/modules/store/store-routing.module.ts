import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from './settings/settings.component';
import { ThemeSettingComponent } from './theme-setting/theme-setting.component';


const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    data: {
      title: "store.settings.title"
    }
  },
  {
    path: 'theme',
    component: ThemeSettingComponent,
    data: {
      title: "store.theme-settings.title"
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule { }
