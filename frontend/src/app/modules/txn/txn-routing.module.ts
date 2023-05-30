import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';

import { TxnListComponent } from './txn-list/txn-list.component';
// import { BannerCreateComponent } from './banner-create/banner-create.component';


const routes: Routes = [
  {
    path: '',
    component: TxnListComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: {
      title: 'transactions',
    }
  },
//   {
//     path: 'create',
//     component: BannerCreateComponent,
//     canActivate: [AdminAccessGuard],
//     canActivateChild: [AdminAccessGuard],
//     data: {
//       title: 'banner.create.title',
//     }
//   },
//   {
//     path: 'edit/:id',
//     component: BannerCreateComponent,
//     canActivate: [AdminAccessGuard],
//     canActivateChild: [AdminAccessGuard],
//     data: {
//       title: 'banner.create.edit',
//     }
//   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TxnRoutingModule { }
