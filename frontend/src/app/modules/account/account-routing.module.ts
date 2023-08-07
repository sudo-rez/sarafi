import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';

import { AccountComponents } from './account.component';
// import { BannerCreateComponent } from './banner-create/banner-create.component';


const routes: Routes = [
  {
    path: '',
    component: AccountComponents,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'accountmanagement',
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
