import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';

import { WithdrawComponent } from './withdraw.component';
// import { BannerCreateComponent } from './banner-create/banner-create.component';


const routes: Routes = [
  {
    path: '',
    component: WithdrawComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'sidebar.withdraw',
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WithdrawRoutingModule { }
